-- Implement optimized fuzzy search using pg_trgm for 3M+ records
-- This migration replaces the simple search with efficient trigram-based fuzzy search

-- Ensure pg_trgm extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Set similarity threshold for better fuzzy matching
-- 0.3 is a good balance between precision and recall
SELECT set_limit(0.3);

-- Drop the existing simple search function
DROP FUNCTION IF EXISTS search_properties(TEXT, DECIMAL, DECIMAL, TEXT, TEXT, INTEGER);

-- Create optimized fuzzy search function
CREATE OR REPLACE FUNCTION search_properties_fuzzy(
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
    reversed_name TEXT;
BEGIN
    -- Clean and prepare search input
    search_name := TRIM(UPPER(search_name));
    
    -- Split search name into words for additional matching strategies
    search_words := string_to_array(search_name, ' ');
    
    -- Create reversed name for "NANCY ROBB" -> "ROBB NANCY" matching
    IF array_length(search_words, 1) = 2 THEN
        reversed_name := search_words[2] || ' ' || search_words[1];
    ELSE
        reversed_name := search_name;
    END IF;

    -- Check if the source table exists before querying
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'unclaimed_properties'
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
            -- Calculate the best similarity score from multiple strategies
            GREATEST(
                -- Direct trigram similarity
                similarity(UPPER(ps.owner_name), search_name),
                -- Reversed name similarity (for "NANCY ROBB" vs "ROBB NANCY C")
                similarity(UPPER(ps.owner_name), reversed_name),
                -- Word similarity (better for partial matches)
                word_similarity(search_name, UPPER(ps.owner_name)),
                -- Exact substring match gets highest score
                CASE 
                    WHEN UPPER(ps.owner_name) = search_name THEN 1.0
                    WHEN UPPER(ps.owner_name) LIKE search_name || '%' THEN 0.95
                    WHEN UPPER(ps.owner_name) LIKE '%' || search_name || '%' THEN 0.85
                    ELSE 0.0
                END
            ) as similarity_score
        FROM property_search ps
        WHERE 
            -- Use multiple search strategies for comprehensive matching
            (
                -- Trigram similarity (fastest with GIN index)
                UPPER(ps.owner_name) % search_name OR
                UPPER(ps.owner_name) % reversed_name OR
                -- Traditional LIKE for exact matches (still fast with B-tree index)
                UPPER(ps.owner_name) LIKE '%' || search_name || '%' OR
                -- Word similarity for partial word matches
                word_similarity(search_name, UPPER(ps.owner_name)) > 0.3
            )
            -- Apply additional filters
            AND (min_amount IS NULL OR ps.current_cash_balance >= min_amount)
            AND (max_amount IS NULL OR ps.current_cash_balance <= max_amount)
            AND (search_city IS NULL OR ps.owner_city ILIKE '%' || search_city || '%')
            AND (search_property_type IS NULL OR ps.property_type = search_property_type)
        ORDER BY 
            -- Sort by similarity score (descending), then by cash balance (descending)
            GREATEST(
                similarity(UPPER(ps.owner_name), search_name),
                similarity(UPPER(ps.owner_name), reversed_name),
                word_similarity(search_name, UPPER(ps.owner_name)),
                CASE 
                    WHEN UPPER(ps.owner_name) = search_name THEN 1.0
                    WHEN UPPER(ps.owner_name) LIKE search_name || '%' THEN 0.95
                    WHEN UPPER(ps.owner_name) LIKE '%' || search_name || '%' THEN 0.85
                    ELSE 0.0
                END
            ) DESC,
            ps.current_cash_balance DESC
        LIMIT search_limit;
    END IF;
END;
$$ LANGUAGE plpgsql
SET statement_timeout = '30s';

-- Create a wrapper function with the original name for backward compatibility
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
    RETURN QUERY SELECT * FROM search_properties_fuzzy(
        search_name, min_amount, max_amount, search_city, search_property_type, search_limit
    );
END;
$$ LANGUAGE plpgsql
SET statement_timeout = '30s';

DO $$
BEGIN
   IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE  table_schema = 'public'
      AND    table_name   = 'unclaimed_properties'
   ) THEN
      -- Ensure we have optimal indexes for fuzzy search
      -- The trigram index should already exist from the first migration, but let's ensure it's there
      CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_owner_name_trigram 
      ON unclaimed_properties USING gin(owner_name gin_trgm_ops);

      -- Add an uppercase trigram index for case-insensitive fuzzy search
      CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_owner_name_upper_trigram 
      ON unclaimed_properties USING gin(UPPER(owner_name) gin_trgm_ops);

      -- Add a B-tree index for exact matches (complements the trigram index)
      CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_owner_name_upper_btree 
      ON unclaimed_properties (UPPER(owner_name));
   END IF;
END $$;


-- Grant permissions
GRANT EXECUTE ON FUNCTION search_properties_fuzzy TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_properties TO anon, authenticated;

-- Add a comment explaining the search strategy
COMMENT ON FUNCTION search_properties_fuzzy IS 
'Optimized fuzzy search function using pg_trgm extension. 
Handles various name patterns including reversed names (e.g., "NANCY ROBB" vs "ROBB NANCY C").
Uses multiple search strategies: trigram similarity, word similarity, and exact substring matching.
Optimized for 3M+ records with proper indexing.'; 