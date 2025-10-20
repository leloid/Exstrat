-- Create beta_applications table
CREATE TABLE IF NOT EXISTS public.beta_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_method TEXT NOT NULL,
  contact_identifier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.beta_applications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for beta signups)
CREATE POLICY "Allow public beta signups" 
ON public.beta_applications 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Create policy to allow authenticated users to view all applications
CREATE POLICY "Authenticated users can view applications" 
ON public.beta_applications 
FOR SELECT 
TO authenticated
USING (true);