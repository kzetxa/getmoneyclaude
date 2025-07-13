-- Create unclaimed_properties table for California state data
CREATE TABLE IF NOT EXISTS unclaimed_properties (
    id TEXT PRIMARY KEY,
    property_type TEXT NOT NULL,
    cash_reported DECIMAL(12,2) DEFAULT 0,
    shares_reported DECIMAL(12,2) DEFAULT 0,
    name_of_securities_reported TEXT,
    number_of_owners TEXT,
    owner_name TEXT NOT NULL,
    owner_street_1 TEXT,
    owner_street_2 TEXT,
    owner_street_3 TEXT,
    owner_city TEXT,
    owner_state TEXT,
    owner_zip TEXT,
    owner_country_code TEXT,
    current_cash_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    number_of_pending_claims INTEGER DEFAULT 0,
    number_of_paid_claims INTEGER DEFAULT 0,
    holder_name TEXT NOT NULL,
    holder_street_1 TEXT,
    holder_street_2 TEXT,
    holder_street_3 TEXT,
    holder_city TEXT,
    holder_state TEXT,
    holder_zip TEXT,
    cusip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable extensions first
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for efficient searching
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_owner_name ON unclaimed_properties USING gin(to_tsvector('english', owner_name));
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_owner_name_trigram ON unclaimed_properties USING gin(owner_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_current_cash_balance ON unclaimed_properties(current_cash_balance);
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_property_type ON unclaimed_properties(property_type);
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_owner_city ON unclaimed_properties(owner_city);
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_owner_state ON unclaimed_properties(owner_state);
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_holder_name ON unclaimed_properties(holder_name);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_unclaimed_properties_updated_at ON unclaimed_properties;
CREATE TRIGGER update_unclaimed_properties_updated_at
    BEFORE UPDATE ON unclaimed_properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for property search with formatted data
CREATE OR REPLACE VIEW property_search AS
SELECT 
    id,
    property_type,
    cash_reported,
    shares_reported,
    name_of_securities_reported,
    number_of_owners,
    owner_name,
    TRIM(CONCAT_WS(', ', 
        NULLIF(owner_street_1, ''),
        NULLIF(owner_street_2, ''),
        NULLIF(owner_street_3, '')
    )) AS owner_full_address,
    owner_city,
    owner_state,
    owner_zip,
    owner_country_code,
    current_cash_balance,
    number_of_pending_claims,
    number_of_paid_claims,
    holder_name,
    TRIM(CONCAT_WS(', ', 
        NULLIF(holder_street_1, ''),
        NULLIF(holder_street_2, ''),
        NULLIF(holder_street_3, '')
    )) AS holder_full_address,
    holder_city,
    holder_state,
    holder_zip,
    cusip,
    created_at,
    updated_at
FROM unclaimed_properties;

-- Create a function for fuzzy name search
DROP FUNCTION IF EXISTS search_properties(TEXT, DECIMAL, DECIMAL, TEXT, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION search_properties(
    search_name TEXT,
    min_amount DECIMAL DEFAULT NULL,
    max_amount DECIMAL DEFAULT NULL,
    search_city TEXT DEFAULT NULL,
    search_property_type TEXT DEFAULT NULL,
    search_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id TEXT,
    property_type TEXT,
    cash_reported DECIMAL,
    shares_reported DECIMAL,
    name_of_securities_reported TEXT,
    number_of_owners TEXT,
    owner_name TEXT,
    owner_full_address TEXT,
    owner_city TEXT,
    owner_state TEXT,
    owner_zip TEXT,
    owner_country_code TEXT,
    current_cash_balance DECIMAL,
    number_of_pending_claims INTEGER,
    number_of_paid_claims INTEGER,
    holder_name TEXT,
    holder_full_address TEXT,
    holder_city TEXT,
    holder_state TEXT,
    holder_zip TEXT,
    cusip TEXT,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.*,
        GREATEST(
            similarity(ps.owner_name, search_name),
            word_similarity(search_name, ps.owner_name)
        ) as similarity_score
    FROM property_search ps
    WHERE 
        (
            ps.owner_name ILIKE '%' || search_name || '%' OR
            similarity(ps.owner_name, search_name) > 0.3 OR
            word_similarity(search_name, ps.owner_name) > 0.3 OR
            to_tsvector('english', ps.owner_name) @@ plainto_tsquery('english', search_name)
        )
        AND (min_amount IS NULL OR ps.current_cash_balance >= min_amount)
        AND (max_amount IS NULL OR ps.current_cash_balance <= max_amount)
        AND (search_city IS NULL OR ps.owner_city ILIKE '%' || search_city || '%')
        AND (search_property_type IS NULL OR ps.property_type = search_property_type)
    ORDER BY 
        similarity_score DESC,
        ps.current_cash_balance DESC
    LIMIT search_limit;
END;
$$ LANGUAGE plpgsql;

-- Create a data import tracking table
CREATE TABLE IF NOT EXISTS data_imports (
    id SERIAL PRIMARY KEY,
    import_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    source_url TEXT NOT NULL,
    total_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    import_status TEXT DEFAULT 'pending' CHECK (import_status IN ('pending', 'in_progress', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE unclaimed_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to unclaimed properties
DROP POLICY IF EXISTS "Public read access to unclaimed properties" ON unclaimed_properties;
CREATE POLICY "Public read access to unclaimed properties" ON unclaimed_properties
    FOR SELECT USING (true);

-- Create policies for data imports (restrict to authenticated users if needed)
DROP POLICY IF EXISTS "Public read access to data imports" ON data_imports;
CREATE POLICY "Public read access to data imports" ON data_imports
    FOR SELECT USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON unclaimed_properties TO anon, authenticated;
GRANT SELECT ON property_search TO anon, authenticated;
GRANT SELECT ON data_imports TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_properties TO anon, authenticated;
