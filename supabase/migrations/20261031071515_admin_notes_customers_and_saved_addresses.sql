/*
# Admin order notes, admin customer list, and saved addresses

1. Modified tables
- `individual_orders`: new `admin_notes` column (optional text, up to 2000 characters) for internal staff notes. Customers cannot read or write it through their own access rules.
- `profiles`: no column changes. Admins gain read access to customer profiles so the Customers page can list them.

2. New tables
- `saved_addresses`: a customer's reusable delivery addresses. Each row has an id, the owner (`user_id`, defaults to the signed-in user), a short label (for example "Hostel"), the address text, and a created time.

3. Security
- `individual_orders`: authenticated users may update only the `admin_notes` column in addition to the existing `status` and `updated_at` columns. The existing admin-only UPDATE policy still decides who may change them.
- `profiles`: new admin-only SELECT policy using the existing admin check. Customers keep their own select, insert, and update policies.
- `saved_addresses`: RLS enabled. Authenticated users may select, insert, and delete only their own rows. No update is granted, so addresses are replaced by deleting and re-adding them.

4. Notes
- Every statement is idempotent so the migration can be safely re-applied.
- No existing data is changed or removed.
*/

ALTER TABLE individual_orders ADD COLUMN IF NOT EXISTS admin_notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'individual_orders_admin_notes_length'
  ) THEN
    ALTER TABLE individual_orders
      ADD CONSTRAINT individual_orders_admin_notes_length CHECK (admin_notes IS NULL OR char_length(admin_notes) <= 2000);
  END IF;
END $$;

GRANT UPDATE (admin_notes) ON individual_orders TO authenticated;

DROP POLICY IF EXISTS "admins_read_profiles" ON profiles;
CREATE POLICY "admins_read_profiles" ON profiles FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS saved_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 60),
  address text NOT NULL CHECK (char_length(address) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_addresses_user_id_idx ON saved_addresses (user_id);

ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON saved_addresses TO authenticated;

DROP POLICY IF EXISTS "select_own_saved_addresses" ON saved_addresses;
CREATE POLICY "select_own_saved_addresses" ON saved_addresses FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved_addresses" ON saved_addresses;
CREATE POLICY "insert_own_saved_addresses" ON saved_addresses FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved_addresses" ON saved_addresses;
CREATE POLICY "delete_own_saved_addresses" ON saved_addresses FOR DELETE
TO authenticated USING (auth.uid() = user_id);
