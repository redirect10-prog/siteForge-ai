-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add user_id column to generated_websites
ALTER TABLE public.generated_websites
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update RLS policies for generated_websites to allow users to manage their own
DROP POLICY IF EXISTS "Anyone can create websites" ON public.generated_websites;
DROP POLICY IF EXISTS "Anyone can view published websites" ON public.generated_websites;

CREATE POLICY "Anyone can view published websites"
ON public.generated_websites FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create websites"
ON public.generated_websites FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update their own websites"
ON public.generated_websites FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own websites"
ON public.generated_websites FOR DELETE
USING (auth.uid() = user_id);

-- Allow anonymous website creation for non-logged in users
CREATE POLICY "Anonymous can create websites"
ON public.generated_websites FOR INSERT
WITH CHECK (user_id IS NULL);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (new.id, new.raw_user_meta_data ->> 'username');
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profile timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();