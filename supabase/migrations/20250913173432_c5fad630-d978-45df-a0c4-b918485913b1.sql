-- Drop existing constraint first
ALTER TABLE public.sales_pipelines DROP CONSTRAINT IF EXISTS check_status_values;

-- Update existing records to match the new status values
UPDATE public.sales_pipelines 
SET status = CASE 
  WHEN status = 'in_progress' THEN 'contacted'
  WHEN status = 'closed_won' THEN 'closed_won'
  WHEN status = 'closed_lost' THEN 'closed_lost'
  WHEN status = 'pending' THEN 'contacted'
  ELSE 'contacted'
END;