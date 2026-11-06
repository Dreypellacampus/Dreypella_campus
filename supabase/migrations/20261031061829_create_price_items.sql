/*
# Create admin-managed price list

1. New Tables
- `price_items`: one row per priced item.
  - `id` (uuid, primary key)
  - `name` (text, required, 2 to 120 characters, unique ignoring capitals and spaces at the ends)
  - `unit_price` (integer, Naira, zero or more, up to 100,000,000)
  - `created_at`, `updated_at` (timestamps)

2. Security
- Row level security is enabled.
- Anyone (including guests) may read prices, because the prices are shown to customers on bulk requests.
- Only signed-in admins (listed in the admin allowlist) may add, change or remove prices. Customers cannot change prices.
- Grants: read for anonymous and signed-in users; insert, update and delete for signed-in users only, with update limited to the name, price and timestamp columns.

3. Important notes
- The table starts empty. Items without a price continue to show "Request a Quote".
- Re-running this migration is safe.
*/

CREATE TABLE IF NOT EXISTS price_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) >= 2 AND char_length(btrim(name)) <= 120),
  unit_price integer NOT NULL CHECK (unit_price >= 0 AND unit_price <= 100000000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS price_items_name_key ON price_items (lower(btrim(name)));

ALTER TABLE price_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON price_items TO anon, authenticated;
GRANT INSERT, DELETE ON price_items TO authenticated;
GRANT UPDATE (name, unit_price, updated_at) ON price_items TO authenticated;

DROP POLICY IF EXISTS "public_read_price_items" ON price_items;
CREATE POLICY "public_read_price_items" ON price_items FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "admins_insert_price_items" ON price_items;
CREATE POLICY "admins_insert_price_items" ON price_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_update_price_items" ON price_items;
CREATE POLICY "admins_update_price_items" ON price_items FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_delete_price_items" ON price_items;
CREATE POLICY "admins_delete_price_items" ON price_items FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));
