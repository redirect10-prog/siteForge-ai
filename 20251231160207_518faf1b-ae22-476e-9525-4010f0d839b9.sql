-- Add edit_count column to track edits per website
ALTER TABLE public.generated_websites 
ADD COLUMN edit_count integer NOT NULL DEFAULT 0;

-- Create function to increment edit count
CREATE OR REPLACE FUNCTION public.increment_edit_count(website_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  website_tier text;
BEGIN
  SELECT edit_count, tier INTO current_count, website_tier
  FROM generated_websites
  WHERE id = website_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Website not found or access denied';
  END IF;
  
  -- Free tier limit is 3 edits
  IF (website_tier IS NULL OR website_tier = 'free') AND current_count >= 3 THEN
    RAISE EXCEPTION 'Edit limit reached for free tier';
  END IF;
  
  UPDATE generated_websites
  SET edit_count = edit_count + 1
  WHERE id = website_id AND user_id = auth.uid();
  
  RETURN current_count + 1;
END;
$$;