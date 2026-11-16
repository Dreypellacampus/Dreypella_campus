/*
# Complete institution-level administration

- Allow assigned institution administrators to use the operational dashboard.
- Restrict institution administrators to their own institution's customers, orders,
  order notes, quotations and status history.
- Add main-admin-only RPCs to assign, list and deactivate institution administrators
  by account email without exposing auth.users to browser clients.
- Preserve main administrator access and customer ownership rules.
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
  ON CONFLICT (user_id) DO UPDATE
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

CREATE OR REPLACE FUNCTION public.admin_list_institution_admins(p_institution_id uuid)
RETURNS TABLE(user_id uuid, email text, active boolean, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Main administrator access required.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT ia.user_id, u.email::text, ia.active, ia.created_at
  FROM public.institution_admins ia
  JOIN auth.users u ON u.id = ia.user_id
  WHERE ia.institution_id = p_institution_id
  ORDER BY ia.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_institution_admin_active(
  p_user_id uuid,
  p_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Main administrator access required.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.institution_admins
  SET active = p_active, updated_at = now()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Institution administrator assignment was not found.' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_assign_institution_admin(text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_institution_admins(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_institution_admin_active(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_institution_admin(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_institution_admins(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_institution_admin_active(uuid, boolean) TO authenticated;

DROP POLICY IF EXISTS institution_admin_read_assigned_profiles ON public.profiles;
CREATE POLICY institution_admin_read_assigned_profiles ON public.profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.institution_admins ia
    WHERE ia.user_id = auth.uid()
      AND ia.active
      AND ia.institution_id = profiles.institution_id
  )
);

GRANT SELECT (institution_id, institution_name_snapshot, customer_category)
ON public.individual_orders TO authenticated;

DROP POLICY IF EXISTS institution_admin_read_order_notes ON public.individual_order_notes;
CREATE POLICY institution_admin_read_order_notes ON public.individual_order_notes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.individual_orders o
    JOIN public.institution_admins ia ON ia.institution_id = o.institution_id
    WHERE o.id = individual_order_notes.order_id
      AND ia.user_id = auth.uid()
      AND ia.active
  )
);

DROP POLICY IF EXISTS institution_admin_insert_order_notes ON public.individual_order_notes;
CREATE POLICY institution_admin_insert_order_notes ON public.individual_order_notes
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.individual_orders o
    JOIN public.institution_admins ia ON ia.institution_id = o.institution_id
    WHERE o.id = individual_order_notes.order_id
      AND ia.user_id = auth.uid()
      AND ia.active
  )
);

DROP POLICY IF EXISTS institution_admin_update_order_notes ON public.individual_order_notes;
CREATE POLICY institution_admin_update_order_notes ON public.individual_order_notes
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.individual_orders o
    JOIN public.institution_admins ia ON ia.institution_id = o.institution_id
    WHERE o.id = individual_order_notes.order_id
      AND ia.user_id = auth.uid()
      AND ia.active
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.individual_orders o
    JOIN public.institution_admins ia ON ia.institution_id = o.institution_id
    WHERE o.id = individual_order_notes.order_id
      AND ia.user_id = auth.uid()
      AND ia.active
  )
);

DROP POLICY IF EXISTS institution_admin_read_order_status_events ON public.order_status_events;
CREATE POLICY institution_admin_read_order_status_events ON public.order_status_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.individual_orders o
    JOIN public.institution_admins ia ON ia.institution_id = o.institution_id
    WHERE o.id = order_status_events.order_id
      AND ia.user_id = auth.uid()
      AND ia.active
  )
);

DROP POLICY IF EXISTS institution_admin_read_quotations ON public.quotations;
CREATE POLICY institution_admin_read_quotations ON public.quotations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.individual_orders o
    JOIN public.institution_admins ia ON ia.institution_id = o.institution_id
    WHERE o.id = quotations.order_id
      AND ia.user_id = auth.uid()
      AND ia.active
  )
);

DROP POLICY IF EXISTS institution_admin_insert_quotations ON public.quotations;
CREATE POLICY institution_admin_insert_quotations ON public.quotations
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.individual_orders o
    JOIN public.institution_admins ia ON ia.institution_id = o.institution_id
    WHERE o.id = quotations.order_id
      AND ia.user_id = auth.uid()
      AND ia.active
  )
);

DROP POLICY IF EXISTS institution_admin_update_quotations ON public.quotations;
CREATE POLICY institution_admin_update_quotations ON public.quotations
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.individual_orders o
    JOIN public.institution_admins ia ON ia.institution_id = o.institution_id
    WHERE o.id = quotations.order_id
      AND ia.user_id = auth.uid()
      AND ia.active
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.individual_orders o
    JOIN public.institution_admins ia ON ia.institution_id = o.institution_id
    WHERE o.id = quotations.order_id
      AND ia.user_id = auth.uid()
      AND ia.active
  )
);

DROP POLICY IF EXISTS institution_admin_delete_quotations ON public.quotations;
CREATE POLICY institution_admin_delete_quotations ON public.quotations
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.individual_orders o
    JOIN public.institution_admins ia ON ia.institution_id = o.institution_id
    WHERE o.id = quotations.order_id
      AND ia.user_id = auth.uid()
      AND ia.active
  )
);
