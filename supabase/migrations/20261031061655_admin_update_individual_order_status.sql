/*
# Let admins update the status of individual orders

1. Modified Tables
- `individual_orders`: signed-in admins can change the status of any order. Customers still cannot change their own orders.

2. Security
- New policy `admins_update_individual_orders` (UPDATE, role authenticated): allowed only when the signed-in user is listed in the admin allowlist. Both the row check and the new-value check require admin membership.
- New column-level grant: authenticated users may update only `status` and `updated_at` on `individual_orders`. Other columns stay read-only for everyone except the original insert.
- No change to customer SELECT or INSERT rights.

3. Important notes
- Re-running this migration is safe: the policy is dropped before it is created, and the grant is repeatable.
*/

GRANT UPDATE (status, updated_at) ON individual_orders TO authenticated;

DROP POLICY IF EXISTS "admins_update_individual_orders" ON individual_orders;
CREATE POLICY "admins_update_individual_orders" ON individual_orders FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));
