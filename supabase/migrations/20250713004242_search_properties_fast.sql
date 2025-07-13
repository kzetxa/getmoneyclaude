-- 1) Create a GIN index on owner_name for full-text lookup
--    (run once on your base table; property_search should be a simple view over unclaimed_properties)
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_owner_name_fts
  ON unclaimed_properties
  USING GIN (to_tsvector('simple', owner_name));

-- 2) New fast search function
CREATE OR REPLACE FUNCTION search_properties_fast(
    search_name       TEXT,
    min_amount        DECIMAL   DEFAULT NULL,
    max_amount        DECIMAL   DEFAULT NULL,
    search_city       TEXT      DEFAULT NULL,
    search_prop_type  TEXT      DEFAULT NULL,
    search_limit      INTEGER   DEFAULT 50
)
RETURNS TABLE (
    id                          TEXT,
    property_type               TEXT,
    cash_reported               DECIMAL,
    shares_reported             DECIMAL,
    name_of_securities_reported TEXT,
    number_of_owners            TEXT,
    owner_name                  TEXT,
    owner_full_address          TEXT,
    owner_city                  TEXT,
    owner_state                 TEXT,
    owner_zip                   TEXT,
    owner_country_code          TEXT,
    current_cash_balance        DECIMAL,
    number_of_pending_claims    INTEGER,
    number_of_paid_claims       INTEGER,
    holder_name                 TEXT,
    holder_full_address         TEXT,
    holder_city                 TEXT,
    holder_state                TEXT,
    holder_zip                  TEXT,
    cusip                       TEXT
) AS $$
DECLARE
  q   tsquery := plainto_tsquery('simple', search_name);
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
    ps.cusip
  FROM property_search ps
  WHERE
    -- full-text must match ALL tokens exactly (no partials, no anagrams)
    to_tsvector('simple', ps.owner_name) @@ q
    -- optional numeric and text filters:
    AND (min_amount       IS NULL OR ps.current_cash_balance >= min_amount)
    AND (max_amount       IS NULL OR ps.current_cash_balance <= max_amount)
    AND (search_city      IS NULL OR ps.owner_city ILIKE '%' || search_city || '%')
    AND (search_prop_type IS NULL OR ps.property_type = search_prop_type)
  ORDER BY
    ps.current_cash_balance DESC  -- or whatever makes sense for you
  LIMIT search_limit;
END;
$$ LANGUAGE plpgsql
SET statement_timeout = '15s';

-- 3) (Optional) You can still keep your old fuzzy version under a different name,
--    or simply call search_properties_fast() instead of search_properties().
