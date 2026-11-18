/*
# Fix ambiguous column reference when assigning an institution administrator

The RETURNS TABLE output variable named user_id can conflict with the
ON CONFLICT (user_id) target in PL/pgSQL. Name the primary-key constraint
explicitly so PostgreSQL resolves the conflict target unambiguously.

This preserves the existing main-admin authorization, registered-account
lookup, main-admin exclusion, and institution assignment behavior.
*/

CREATE OR REPLACE FUNCTION public.admin_assign_institution_admin(
  p_email text,
  p_institution_id uuid
)
RETURNS TABLE(user_id uuid, email text, active boolean, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Main administrator access required.' USING ERRCODE = '42501';
  END IF;

  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RAISE EXCEPTION 'Enter the email address used by the staff member to sign in.' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = p_institution_id) THEN
    RAISE EXCEPTION 'The selected institution does not exist.' USING ERRCODE = 'P0002';
  END IF;

  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(btrim(p_email))
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No registered account was found for that email. Ask the staff member to create an account first.' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_user_id) THEN
    RAISE EXCEPTION 'This account is already a main administrator and does not need an institution assignment.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.institution_admins (user_id, institution_id, active, updated_at)
  VALUES (v_user_id, p_institution_id, true, now())
  ON CONFLICT ON CONSTRAINT institution_admins_pkey DO UPDATE
    SET institution_id = EXCLUDED.institution_id,
        active = true,
        updated_at = now();

  RETURN QUERY
  SELECT ia.user_id, u.email::text, ia.active, ia.created_at
  FROM public.institution_admins ia
  JOIN auth.users u ON u.id = ia.user_id
  WHERE ia.user_id = v_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_assign_institution_admin(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_institution_admin(text, uuid) TO authenticated;
