/*
# Create hostel list and administrator allowlist

1. New Tables
- `admin_users`: one row per administrator. `user_id` points to a Supabase Auth account. Rows are managed by the project owner only, never from the website.
- `hostels`: editable list of hostels and accommodation names shown in the delivery location selector. `location_type` is either `on-campus` or `off-campus`.

2. Seed data
- Three placeholder on-campus hostel names ("Hostel 1" to "Hostel 3") so the selector is usable. Administrators should rename them to the real hostel names. No official hostel names are invented here.

3. Security
- RLS enabled on both tables.
- `hostels`: anyone (anon and signed-in users) can read the list, which is intentionally public. Only signed-in administrators can insert, update or delete, and only when their account is in `admin_users`.
- `admin_users`: a signed-in user can read only their own row, so they can confirm whether they are an administrator. Nobody can write to it through the API.

4. Notes
- Adding an administrator: insert the user's id from the Auth users list into `admin_users` via the database dashboard.
- Deleting a hostel does not affect existing orders, because orders store the hostel name as text.
*/

CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON admin_users TO authenticated;

DROP POLICY IF EXISTS "admins_read_own_row" ON admin_users;
CREATE POLICY "admins_read_own_row" ON admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS hostels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  location_type text NOT NULL CHECK (location_type IN ('on-campus', 'off-campus')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (location_type, name)
);

ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON hostels TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON hostels TO authenticated;

DROP POLICY IF EXISTS "public_read_hostels" ON hostels;
CREATE POLICY "public_read_hostels" ON hostels
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "admins_insert_hostels" ON hostels;
CREATE POLICY "admins_insert_hostels" ON hostels
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_update_hostels" ON hostels;
CREATE POLICY "admins_update_hostels" ON hostels
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_delete_hostels" ON hostels;
CREATE POLICY "admins_delete_hostels" ON hostels
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

INSERT INTO hostels (name, location_type)
VALUES ('Hostel 1', 'on-campus'), ('Hostel 2', 'on-campus'), ('Hostel 3', 'on-campus')
ON CONFLICT (location_type, name) DO NOTHING;
