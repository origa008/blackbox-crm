-- Update sales_pipelines table to use standard pipeline statuses
ALTER TABLE public.sales_pipelines 
ALTER COLUMN status TYPE text,
ALTER COLUMN status SET DEFAULT 'contacted';

-- Add constraint to ensure only valid statuses
ALTER TABLE public.sales_pipelines 
ADD CONSTRAINT valid_status CHECK (status IN ('contacted', 'qualified', 'closed_won', 'closed_lost'));