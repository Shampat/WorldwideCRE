-- WorldwideCRE listing inquiries / lead capture
-- Run this migration in the WorldwideCRE Supabase project before using the inquiry form.

CREATE TABLE IF NOT EXISTS public.listing_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  requester_phone text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'READ', 'CONTACTED', 'CLOSED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_inquiries_recipient_idx
  ON public.listing_inquiries(recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_inquiries_listing_idx
  ON public.listing_inquiries(listing_id, created_at DESC);

ALTER TABLE public.listing_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recipients can view listing inquiries" ON public.listing_inquiries;
CREATE POLICY "Recipients can view listing inquiries"
  ON public.listing_inquiries
  FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "Requesters can view own listing inquiries" ON public.listing_inquiries;
CREATE POLICY "Requesters can view own listing inquiries"
  ON public.listing_inquiries
  FOR SELECT
  TO authenticated
  USING (requester_user_id = auth.uid());

DROP POLICY IF EXISTS "Recipients can update listing inquiries" ON public.listing_inquiries;
CREATE POLICY "Recipients can update listing inquiries"
  ON public.listing_inquiries
  FOR UPDATE
  TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.submit_listing_inquiry(
  p_listing_id uuid,
  p_requester_name text,
  p_requester_email text,
  p_requester_phone text DEFAULT NULL,
  p_message text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_user_id uuid;
  v_inquiry_id uuid;
  v_requester_user_id uuid;
  v_name text := btrim(coalesce(p_requester_name, ''));
  v_email text := lower(btrim(coalesce(p_requester_email, '')));
  v_phone text := nullif(btrim(coalesce(p_requester_phone, '')), '');
  v_message text := btrim(coalesce(p_message, ''));
BEGIN
  IF char_length(v_name) < 2 OR char_length(v_name) > 120 THEN
    RAISE EXCEPTION 'Please provide a valid name.';
  END IF;

  IF char_length(v_email) < 5 OR char_length(v_email) > 320
     OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Please provide a valid email address.';
  END IF;

  IF char_length(v_phone) > 40 THEN
    RAISE EXCEPTION 'Phone number is too long.';
  END IF;

  IF char_length(v_message) < 10 OR char_length(v_message) > 4000 THEN
    RAISE EXCEPTION 'Please provide a message between 10 and 4000 characters.';
  END IF;

  SELECT l.created_by
    INTO v_recipient_user_id
  FROM public.listings l
  WHERE l.id = p_listing_id
    AND l.status = 'ACTIVE'
    AND (l.expires_at IS NULL OR l.expires_at > now());

  IF v_recipient_user_id IS NULL THEN
    RAISE EXCEPTION 'This listing is not currently available for inquiries.';
  END IF;

  v_requester_user_id := auth.uid();

  INSERT INTO public.listing_inquiries (
    listing_id,
    recipient_user_id,
    requester_user_id,
    requester_name,
    requester_email,
    requester_phone,
    message
  )
  VALUES (
    p_listing_id,
    v_recipient_user_id,
    v_requester_user_id,
    v_name,
    v_email,
    v_phone,
    v_message
  )
  RETURNING id INTO v_inquiry_id;

  RETURN v_inquiry_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_listing_inquiry(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_listing_inquiry(uuid, text, text, text, text) TO anon, authenticated;

COMMENT ON TABLE public.listing_inquiries IS
  'Private listing inquiries/lead records routed to the listing owner/representative.';
