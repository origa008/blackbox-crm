-- Drop all status constraints to allow updates
ALTER TABLE public.sales_pipelines DROP CONSTRAINT IF EXISTS sales_pipelines_status_check;
ALTER TABLE public.sales_pipelines DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE public.sales_pipelines DROP CONSTRAINT IF EXISTS check_status_values;