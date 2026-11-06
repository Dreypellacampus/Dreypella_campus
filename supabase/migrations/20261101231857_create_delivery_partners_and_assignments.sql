/*
# Delivery partners, assignments and partner status updates

1. New Tables
- `delivery_partners`: one row per delivery partner. Linked to a sign-in account (`user_id`). Holds name, WhatsApp number and an active flag.
- `delivery_assignments`: one row per individual order that has been handed to a partner. Holds the delivery fee (what the partner earns), when the order was assigned and when it was delivered. Kept separate from `individual_orders` so fees are never visible to customers.

2. Security
- Row level security enabled on both tables.
- Admins can read and manage partners and assignments.
- A partner can read only their own partner row and only the assignments that point to them.
- Partners can read an individual order only when it is assigned to them, so customers' orders stay private.
- Partners cannot write to any table directly. They change order status through `partner_update_delivery_status`, which checks the partner is active, the order is assigned to them, and the change is allowed (Ready for Delivery to Delivered only).
- The existing status history and customer notification triggers fire on that update, so customers and admins see the change as usual.

3. Important notes
- Partner accounts are linked by user id. Admin screens to create partners and assign orders are a separate change.
- Fees are stored in whole Naira.
*/

CREATE TABLE IF NOT EXISTS delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) >= 2 AND char_length(btrim(full_name)) <= 120),
  whatsapp text NOT NULL CHECK (whatsapp ~ '^0[789][01][0-9]{8}$'),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_assignments (
  order_id uuid PRIMARY KEY REFERENCES individual_orders(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES delivery_partners(id) ON DELETE RESTRICT,
  fee integer NOT NULL CHECK (fee >= 0 AND fee <= 100000000),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz
);

CREATE INDEX IF NOT EXISTS delivery_assignments_partner_idx ON delivery_assignments (partner_id, assigned_at);

ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON delivery_partners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON delivery_assignments TO authenticated;

DROP POLICY IF EXISTS "admins_select_delivery_partners" ON delivery_partners;
CREATE POLICY "admins_select_delivery_partners" ON delivery_partners FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_insert_delivery_partners" ON delivery_partners;
CREATE POLICY "admins_insert_delivery_partners" ON delivery_partners FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_update_delivery_partners" ON delivery_partners;
CREATE POLICY "admins_update_delivery_partners" ON delivery_partners FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_delete_delivery_partners" ON delivery_partners;
CREATE POLICY "admins_delete_delivery_partners" ON delivery_partners FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "partner_select_own_profile" ON delivery_partners;
CREATE POLICY "partner_select_own_profile" ON delivery_partners FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_select_delivery_assignments" ON delivery_assignments;
CREATE POLICY "admins_select_delivery_assignments" ON delivery_assignments FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_insert_delivery_assignments" ON delivery_assignments;
CREATE POLICY "admins_insert_delivery_assignments" ON delivery_assignments FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_update_delivery_assignments" ON delivery_assignments;
CREATE POLICY "admins_update_delivery_assignments" ON delivery_assignments FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_delete_delivery_assignments" ON delivery_assignments;
CREATE POLICY "admins_delete_delivery_assignments" ON delivery_assignments FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "partner_select_own_assignments" ON delivery_assignments;
CREATE POLICY "partner_select_own_assignments" ON delivery_assignments FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM delivery_partners dp
      WHERE dp.id = delivery_assignments.partner_id AND dp.user_id = auth.uid() AND dp.active
    )
  );

DROP POLICY IF EXISTS "partner_select_assigned_orders" ON individual_orders;
CREATE POLICY "partner_select_assigned_orders" ON individual_orders FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM delivery_assignments da
      JOIN delivery_partners dp ON dp.id = da.partner_id
      WHERE da.order_id = individual_orders.id AND dp.user_id = auth.uid() AND dp.active
    )
  );

CREATE OR REPLACE FUNCTION partner_update_delivery_status(p_order_id uuid, p_status text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id uuid;
  v_current_status text;
BEGIN
  SELECT dp.id INTO v_partner_id
  FROM delivery_partners dp
  WHERE dp.user_id = auth.uid() AND dp.active;

  IF v_partner_id IS NULL THEN
    RAISE EXCEPTION 'You are not an active delivery partner.' USING ERRCODE = '42501';
  END IF;

  SELECT o.status INTO v_current_status
  FROM individual_orders o
  JOIN delivery_assignments da ON da.order_id = o.id
  WHERE o.id = p_order_id AND da.partner_id = v_partner_id
  FOR UPDATE OF o;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'This order is not assigned to you.' USING ERRCODE = '42501';
  END IF;

  IF NOT (v_current_status = 'Ready for Delivery' AND p_status = 'Delivered') THEN
    RAISE EXCEPTION 'That status change is not allowed for this order.' USING ERRCODE = '22023';
  END IF;

  UPDATE individual_orders
  SET status = p_status, updated_at = now()
  WHERE id = p_order_id;

  UPDATE delivery_assignments
  SET delivered_at = now()
  WHERE order_id = p_order_id;

  RETURN p_status;
END;
$$;

REVOKE EXECUTE ON FUNCTION partner_update_delivery_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION partner_update_delivery_status(uuid, text) TO authenticated;
