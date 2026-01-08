-- Create table for generated websites
CREATE TABLE public.generated_websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  prompt text NOT NULL,
  website_type text,
  target_audience text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  internal_explanation jsonb,
  tier text DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_websites ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view published websites (public sharing)
CREATE POLICY "Anyone can view published websites" 
ON public.generated_websites 
FOR SELECT 
USING (true);

-- Allow anyone to insert (since we don't have auth yet)
CREATE POLICY "Anyone can create websites" 
ON public.generated_websites 
FOR INSERT 
WITH CHECK (true);

-- Create index on slug for fast lookups
CREATE INDEX idx_generated_websites_slug ON public.generated_websites(slug);