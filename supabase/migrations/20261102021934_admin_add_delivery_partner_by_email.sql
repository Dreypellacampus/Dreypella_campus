/*
# Admin function to add a delivery partner by account email

1. New Function
- `admin_add_delivery_partner(p_email, p_full_name, p_whatsapp)`: finds the sign-in account with the given email and makes it a delivery partner. Returns the new partner id.

2. Security
- Only accounts on the admin list can run it. Anyone else gets an access error.
- The function is the only way admins can link a partner to an account, because the browser cannot read sign-in accounts directly.
- Execute permission is removed from the public and anonymous roles and granted only to signed-in users. The admin check runs inside the function.

3. Important notes
- The account must already exist (the partner must have signed up). The function refuses if the email has no account or the account is already a partner.
*/

CREATE OR REPLACE FUNCTION admin_add_delivery_partner(p_email text, p_full_name text, p_whatsapp text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_partner_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required.' USING ERRCODE = '42501';
  END IF;

  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(btrim(p_email));

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No account exists for that email yet. Ask the partner to sign up first.' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (SELECT 1 FROM delivery_partners dp WHERE dp.user_id = v_user_id) THEN
    RAISE EXCEPTION 'That account is already a delivery partner.' USING ERRCODE = '23505';
  END IF;

  INSERT INTO delivery_partners (user_id, full_name, whatsapp)
  VALUES (v_user_id, btrim(p_full_name), p_whatsapp)
  RETURNING id INTO v_partner_id;

  RETURN v_partner_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_add_delivery_partner(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_add_delivery_partner(text, text, text) TO authenticated;
