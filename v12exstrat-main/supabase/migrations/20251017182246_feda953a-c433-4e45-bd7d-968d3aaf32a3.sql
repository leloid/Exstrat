-- Add first_name and last_name columns to beta_applications
ALTER TABLE public.beta_applications 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Make the new columns required for future inserts
-- (existing records will have NULL values, which is fine for historical data)
ALTER TABLE public.beta_applications 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;