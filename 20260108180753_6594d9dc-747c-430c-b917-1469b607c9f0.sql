-- Create user_subscriptions table for server-side rate limiting
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'business')),
  requests_used INTEGER DEFAULT 0,
  requests_limit INTEGER DEFAULT 3,
  images_used INTEGER DEFAULT 0,
  images_limit INTEGER DEFAULT 5,
  billing_period_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users view own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Users cannot modify their subscription directly (prevents tier escalation)
-- Only service role or triggers can update

-- Create trigger to auto-create subscription on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, tier, requests_limit, images_limit)
  VALUES (
    NEW.id, 
    'free',
    3,  -- Free tier: 3 requests per day
    5   -- Free tier: 5 images per day
  );
  RETURN NEW;
END;
$$;

-- Trigger to create subscription when user signs up
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Function to reset daily limits (call via cron)
CREATE OR REPLACE FUNCTION public.reset_daily_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET 
    requests_used = 0,
    images_used = 0,
    billing_period_start = now(),
    updated_at = now()
  WHERE billing_period_start < now() - INTERVAL '1 day';
END;
$$;

-- Function to safely increment request count (returns true if allowed)
CREATE OR REPLACE FUNCTION public.use_generation_request(p_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requests_used INTEGER;
  v_requests_limit INTEGER;
BEGIN
  SELECT requests_used, requests_limit INTO v_requests_used, v_requests_limit
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF v_requests_used >= v_requests_limit THEN
    RETURN false;
  END IF;
  
  UPDATE public.user_subscriptions
  SET requests_used = requests_used + 1, updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$;

-- Function to safely increment image count (returns true if allowed)
CREATE OR REPLACE FUNCTION public.use_image_request(p_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_images_used INTEGER;
  v_images_limit INTEGER;
BEGIN
  SELECT images_used, images_limit INTO v_images_used, v_images_limit
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF v_images_used >= v_images_limit THEN
    RETURN false;
  END IF;
  
  UPDATE public.user_subscriptions
  SET images_used = images_used + 1, updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$;