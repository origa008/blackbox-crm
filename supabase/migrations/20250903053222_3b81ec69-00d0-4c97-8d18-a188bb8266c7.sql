-- Remove pending status from sales_pipelines table by updating existing records
UPDATE sales_pipelines 
SET status = 'in_progress' 
WHERE status = 'pending';

-- Add constraint to prevent pending status in future
ALTER TABLE sales_pipelines 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('in_progress', 'closed_won', 'closed_lost'));