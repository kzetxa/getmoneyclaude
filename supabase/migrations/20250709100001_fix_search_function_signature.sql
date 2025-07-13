-- Create a new, simplified search function that uses whole-word matching.
-- This is faster and more precise than the previous fuzzy search.
CREATE OR REPLACE FUNCTION search_properties_fuzzy_simple(
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
DECLARE
    search_words TEXT[];
BEGIN
    -- Clean search input and split into words
    search_name := TRIM(UPPER(search_name));
    search_words := string_to_array(search_name, ' ');

    -- Proceed only if the table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'unclaimed_properties'
    ) THEN
        RETURN QUERY
        SELECT 
            ps.id,
            ps.property_type,
            ps.cash_reported,
            ps.shares_reported,
            ps.name_of_securities_reported,
            ps.number_of_owners,
            ps.owner_name,
            ps.owner_full_address,
            ps.owner_city,
            ps.owner_state,
            ps.owner_zip,
            ps.owner_country_code,
            ps.current_cash_balance,
            ps.number_of_pending_claims,
            ps.number_of_paid_claims,
            ps.holder_name,
            ps.holder_full_address,
            ps.holder_city,
            ps.holder_state,
            ps.holder_zip,
            ps.cusip,
            1.0::real as similarity_score
        FROM property_search ps
        WHERE
            (
                SELECT bool_and(UPPER(ps.owner_name) ~ ('\\y' || word || '\\y'))
                FROM unnest(search_words) as word
            )
            AND (min_amount IS NULL OR ps.current_cash_balance >= min_amount)
            AND (max_amount IS NULL OR ps.current_cash_balance <= max_amount)
            AND (search_city IS NULL OR ps.owner_city ILIKE '%' || search_city || '%')
            AND (search_property_type IS NULL OR ps.property_type = search_property_type)
        ORDER BY
            ps.current_cash_balance DESC
        LIMIT search_limit;
    END IF;
END;
$$ LANGUAGE plpgsql
SET statement_timeout = '30s';

-- Update the main search_properties function to use the new simple search.
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
    RETURN QUERY SELECT * FROM search_properties_fuzzy_simple(
        search_name, min_amount, max_amount, search_city, search_property_type, search_limit
    );
END;
$$ LANGUAGE plpgsql
SET statement_timeout = '30s';

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION search_properties_fuzzy_simple TO anon, authenticated; 