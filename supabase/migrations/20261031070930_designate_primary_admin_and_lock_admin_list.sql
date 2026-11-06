/*
# Designate the primary administrator and lock the admin list

1. Modified Tables
- `admin_users`: the allowlist of administrator accounts. The designated primary administrator, feranmionayemi@gmail.com, is added if an account with that email already exists. Nothing else is inserted and no password is stored.

2. Security
- Anonymous visitors lose every privilege on `admin_users`.
- Signed-in users keep read-only access to `admin_users`, and the existing policy still limits them to their own row. Customers therefore cannot add themselves to the admin list or change it.
- Admin rights can only be granted by a database administrator using the secure dashboard or the SQL editor, never from the website.

3. Important notes
- If the designated account does not yet exist, the insert affects no rows. Create the account on the site first, then re-run this migration.
- Re-running is safe: existing admin rows are left unchanged.
*/

REVOKE ALL ON admin_users FROM anon;
REVOKE INSERT, UPDATE, DELETE ON admin_users FROM authenticated;

INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE lower(email) = 'feranmionayemi@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
