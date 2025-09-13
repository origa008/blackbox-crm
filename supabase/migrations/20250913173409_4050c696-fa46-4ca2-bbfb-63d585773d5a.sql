-- First update existing records to match the new status values
UPDATE public.sales_pipelines 
SET status = CASE 
  WHEN status = 'in_progress' THEN 'contacted'
  WHEN status = 'closed_won' THEN 'closed_won'
  WHEN status = 'closed_lost' THEN 'closed_lost'
  WHEN status = 'pending' THEN 'contacted'
  ELSE 'contacted'
END;

-- Now add the constraint to ensure only valid statuses
ALTER TABLE public.sales_pipelines 
ADD CONSTRAINT valid_status CHECK (status IN ('contacted', 'qualified', 'closed_won', 'closed_lost'));