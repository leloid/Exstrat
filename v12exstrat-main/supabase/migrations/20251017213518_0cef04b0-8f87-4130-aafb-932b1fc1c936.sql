-- Create beta_applications table for beta signup data
CREATE TABLE IF NOT EXISTS public.beta_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.beta_applications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (public signup)
CREATE POLICY "Anyone can submit beta applications"
ON public.beta_applications
FOR INSERT
WITH CHECK (true);

-- Create policy to prevent reading (admin only via service role)
CREATE POLICY "No public read access to beta applications"
ON public.beta_applications
FOR SELECT
USING (false);