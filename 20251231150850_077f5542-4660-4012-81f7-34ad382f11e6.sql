-- Create storage bucket for user uploads (logos, section images, backgrounds)
INSERT INTO storage.buckets (id, name, public) VALUES ('website-assets', 'website-assets', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'website-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'website-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'website-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to assets
CREATE POLICY "Public can view assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'website-assets');

-- Create contact_submissions table for form data
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES public.generated_websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,
  phone TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contact_submissions
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit contact forms (public forms)
CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions FOR INSERT
WITH CHECK (true);

-- Only website owners can view their submissions
CREATE POLICY "Website owners can view submissions"
ON public.contact_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.generated_websites gw 
    WHERE gw.id = contact_submissions.website_id 
    AND gw.user_id = auth.uid()
  )
);

-- Create newsletter_signups table
CREATE TABLE public.newsletter_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES public.generated_websites(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(website_id, email)
);

-- Enable RLS on newsletter_signups
ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to sign up for newsletters
CREATE POLICY "Anyone can signup for newsletter"
ON public.newsletter_signups FOR INSERT
WITH CHECK (true);

-- Only website owners can view their signups
CREATE POLICY "Website owners can view newsletter signups"
ON public.newsletter_signups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.generated_websites gw 
    WHERE gw.id = newsletter_signups.website_id 
    AND gw.user_id = auth.uid()
  )
);

-- Create navigation_links table for dynamic navigation
CREATE TABLE public.navigation_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES public.generated_websites(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_button BOOLEAN DEFAULT false,
  opens_login BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on navigation_links
ALTER TABLE public.navigation_links ENABLE ROW LEVEL SECURITY;

-- Website owners can manage their navigation links
CREATE POLICY "Website owners can manage navigation"
ON public.navigation_links FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.generated_websites gw 
    WHERE gw.id = navigation_links.website_id 
    AND gw.user_id = auth.uid()
  )
);

-- Public can view navigation links
CREATE POLICY "Public can view navigation links"
ON public.navigation_links FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_navigation_links_updated_at
BEFORE UPDATE ON public.navigation_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add user usage tracking for rate limiting
CREATE TABLE public.user_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  generations_today INTEGER DEFAULT 0,
  images_today INTEGER DEFAULT 0,
  last_generation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_usage
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own usage
CREATE POLICY "Users can view their own usage"
ON public.user_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON public.user_usage FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.user_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_usage_updated_at
BEFORE UPDATE ON public.user_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();