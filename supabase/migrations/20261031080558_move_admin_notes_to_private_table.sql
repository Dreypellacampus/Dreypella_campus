/*
# Move internal order notes into an admin-only table

1. New Tables
- `individual_order_notes`: one internal note per individual order.
  - `order_id` (uuid, primary key, references individual_orders.id, cascades on delete)
  - `notes` (text, up to 2000 characters, default empty)
  - `updated_at` (timestamp)

2. Modified Tables
- `individual_orders.admin_notes`: existing notes are copied into the new table. The column itself is kept (data is never dropped) but every customer and anonymous privilege on it is revoked, so it can no longer be read or written from the browser.

3. Security
- Row level security enabled on `individual_order_notes`.
- Only users listed in `admin_users` can select, insert, update or delete notes (policies check `admin_users`).
- Grants to `authenticated` only; customers see zero rows because RLS filters them out.

4. Important Notes
- Step 1: create the private table.
- Step 2: copy existing notes across without overwriting anything already present.
- Step 3: revoke browser access to the old column.
*/

CREATE TABLE IF NOT EXISTS individual_order_notes (
  order_id uuid PRIMARY KEY REFERENCES individual_orders(id) ON DELETE CASCADE,
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 2000),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE individual_order_notes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON individual_order_notes TO authenticated;

DROP POLICY IF EXISTS "admins_select_order_notes" ON individual_order_notes;
CREATE POLICY "admins_select_order_notes" ON individual_order_notes FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_insert_order_notes" ON individual_order_notes;
CREATE POLICY "admins_insert_order_notes" ON individual_order_notes FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_update_order_notes" ON individual_order_notes;
CREATE POLICY "admins_update_order_notes" ON individual_order_notes FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_delete_order_notes" ON individual_order_notes;
CREATE POLICY "admins_delete_order_notes" ON individual_order_notes FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

INSERT INTO individual_order_notes (order_id, notes)
SELECT id, admin_notes FROM individual_orders
WHERE admin_notes IS NOT NULL AND btrim(admin_notes) <> ''
ON CONFLICT (order_id) DO NOTHING;

REVOKE SELECT, INSERT, UPDATE, REFERENCES ON individual_orders FROM anon, authenticated;
GRANT SELECT (id, reference, service_id, service_title, customer_name, whatsapp, details, delivery_location, status, created_at, updated_at, user_id) ON individual_orders TO authenticated;
GRANT INSERT (reference, service_id, service_title, customer_name, whatsapp, details, delivery_location, status, user_id) ON individual_orders TO anon, authenticated;
GRANT UPDATE (status, updated_at) ON individual_orders TO authenticated;
