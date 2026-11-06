/*
# Tighten grants on customer profiles and individual orders

1. Modified Tables
- `profiles`: removes all privileges from the anonymous role (guests never have profiles). Signed-in customers keep SELECT, INSERT and UPDATE, which the existing own-row policies control. DELETE is removed because no policy allows it.
- `individual_orders`: anonymous visitors keep INSERT only (needed to save guest orders, enforced by the Pending/own-user policy). SELECT is removed from anonymous visitors. Signed-in customers keep SELECT and INSERT; UPDATE and DELETE are removed because customers must not change or delete their own orders.

2. Security
- No policies are changed. These statements only remove privileges that no policy would have allowed anyway, reducing the chance of a future policy mistake granting access.
- Rows remain protected by the existing row level security policies.

3. Important notes
- Admin access to orders is unchanged: admins read orders through their own policy, and this migration does not touch admin rights.
- Revoking is safe to re-run.
*/

REVOKE ALL ON profiles FROM anon;
REVOKE DELETE ON profiles FROM authenticated;

REVOKE SELECT, UPDATE, DELETE ON individual_orders FROM anon;
REVOKE UPDATE, DELETE ON individual_orders FROM authenticated;
