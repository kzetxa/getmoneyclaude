-- Create analysis tables for tracking discarded records and import analysis

-- Table to track all discarded records during import
CREATE TABLE IF NOT EXISTS discarded_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_data JSONB NOT NULL,
  discard_reason TEXT NOT NULL CHECK (discard_reason IN ('parse_error', 'validation_error', 'insertion_error', 'duplicate_id', 'missing_required_fields', 'malformed_data')),
  error_message TEXT,
  file_name TEXT,
  row_number INTEGER,
  import_id INTEGER NOT NULL REFERENCES data_imports(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_discarded_records_import_id ON discarded_records(import_id);
CREATE INDEX IF NOT EXISTS idx_discarded_records_reason ON discarded_records(discard_reason);
CREATE INDEX IF NOT EXISTS idx_discarded_records_created_at ON discarded_records(created_at);

-- Table to track import analysis results
CREATE TABLE IF NOT EXISTS import_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id INTEGER NOT NULL REFERENCES data_imports(id) ON DELETE CASCADE,
  total_records INTEGER NOT NULL,
  records_with_ids INTEGER NOT NULL,
  records_without_ids INTEGER NOT NULL,
  percentage_with_ids TEXT NOT NULL,
  percentage_without_ids TEXT NOT NULL,
  sample_records JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_import_analysis_import_id ON import_analysis(import_id);

-- Function to get analysis summary
CREATE OR REPLACE FUNCTION get_import_analysis_summary(import_uuid INTEGER)
RETURNS TABLE (
  total_records INTEGER,
  successful_records INTEGER,
  failed_records INTEGER,
  discarded_records INTEGER,
  records_with_ids INTEGER,
  records_without_ids INTEGER,
  discard_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    di.total_records,
    di.successful_records,
    di.failed_records,
    COALESCE(discarded.count, 0) as discarded_records,
    ia.records_with_ids,
    ia.records_without_ids,
    COALESCE(discarded.breakdown, '{}'::jsonb) as discard_breakdown
  FROM data_imports di
  LEFT JOIN import_analysis ia ON di.id = ia.import_id
  LEFT JOIN (
    SELECT 
      import_id,
      COUNT(*) as count,
      jsonb_object_agg(discard_reason, reason_count) as breakdown
    FROM (
      SELECT 
        import_id,
        discard_reason,
        COUNT(*) as reason_count
      FROM discarded_records
      WHERE import_id = import_uuid
      GROUP BY import_id, discard_reason
    ) grouped
    GROUP BY import_id
  ) discarded ON di.id = discarded.import_id
  WHERE di.id = import_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get detailed discarded records
CREATE OR REPLACE FUNCTION get_discarded_records(import_uuid INTEGER, reason_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  discard_reason TEXT,
  error_message TEXT,
  file_name TEXT,
  row_number INTEGER,
  owner_name TEXT,
  current_cash_balance TEXT,
  holder_name TEXT,
  property_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dr.id,
    dr.discard_reason,
    dr.error_message,
    dr.file_name,
    dr.row_number,
    dr.original_data->>'OWNER_NAME' as owner_name,
    dr.original_data->>'CURRENT_CASH_BALANCE' as current_cash_balance,
    dr.original_data->>'HOLDER_NAME' as holder_name,
    dr.original_data->>'PROPERTY_TYPE' as property_type,
    dr.created_at
  FROM discarded_records dr
  WHERE dr.import_id = import_uuid
    AND (reason_filter IS NULL OR dr.discard_reason = reason_filter)
  ORDER BY dr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE discarded_records IS 'Tracks all records that were discarded during import process for analysis';
COMMENT ON TABLE import_analysis IS 'Stores analysis results for each import including ID statistics';
COMMENT ON FUNCTION get_import_analysis_summary IS 'Returns comprehensive summary of import results including discard breakdown';
COMMENT ON FUNCTION get_discarded_records IS 'Returns detailed view of discarded records with key fields extracted'; 