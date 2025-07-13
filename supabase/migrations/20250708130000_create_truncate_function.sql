-- Function to efficiently clear the unclaimed_properties table
CREATE OR REPLACE FUNCTION truncate_unclaimed_properties()
RETURNS void
LANGUAGE plpgsql
-- Using SECURITY DEFINER is crucial so the function runs with the permissions of the owner,
-- which can truncate the table even if the calling role (e.g., service_role) cannot.
SECURITY DEFINER
AS $$
BEGIN
  -- TRUNCATE is much faster than DELETE for clearing all records from a large table.
  -- It's a DDL command and is minimally logged.
  TRUNCATE TABLE public.unclaimed_properties;
END;
$$;

-- Grant permission to the service_role so our import script can call it.
GRANT EXECUTE ON FUNCTION public.truncate_unclaimed_properties() TO service_role; 