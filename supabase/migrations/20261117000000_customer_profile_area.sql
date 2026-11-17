/*
  Add a customer's usual delivery area to their profile.
  Existing profiles remain valid and can fill this in when they next edit their profile.
  This migration is committed for the development branch only; it is not applied to Supabase.
*/
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS area text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_area_length;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_area_length
  CHECK (area IS NULL OR char_length(btrim(area)) BETWEEN 2 AND 160);
