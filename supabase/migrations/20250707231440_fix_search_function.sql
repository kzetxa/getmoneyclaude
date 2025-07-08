-- Fix the search_properties function to avoid type mismatches
DROP FUNCTION IF EXISTS search_properties;

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
        GREATEST(
            similarity(ps.owner_name, search_name),
            word_similarity(search_name, ps.owner_name)
        )::REAL as similarity_score
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
        GREATEST(
            similarity(ps.owner_name, search_name),
            word_similarity(search_name, ps.owner_name)
        ) DESC,
        ps.current_cash_balance DESC
    LIMIT search_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions again
GRANT EXECUTE ON FUNCTION search_properties TO anon, authenticated;
