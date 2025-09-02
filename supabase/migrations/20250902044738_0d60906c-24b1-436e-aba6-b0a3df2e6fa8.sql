-- Add amount column to sales_pipelines table
ALTER TABLE public.sales_pipelines 
ADD COLUMN amount DECIMAL(10,2) DEFAULT 0;

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  serial_number TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id),
  sales_pipeline_id UUID REFERENCES public.sales_pipelines(id),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoices table
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Users can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" 
ON public.invoices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" 
ON public.invoices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates on invoices
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for invoices
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;