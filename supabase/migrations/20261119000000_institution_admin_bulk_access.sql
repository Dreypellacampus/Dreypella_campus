/*
# Institution-scoped bulk request administration

Institution administrators may read and update operational fields only for
bulk requests belonging to their assigned active institution. Main administrators
retain access to every request. Customer history remains exposed only through
the existing customer_list_own_bulk_orders() security-definer function.
*/

DROP POLICY IF EXISTS admins_read_bulk_orders ON public.bulk_orders;
CREATE POLICY admins_read_bulk_orders ON public.bulk_orders
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.institution_admins ia
    WHERE ia.user_id = auth.uid()
      AND ia.active
      AND ia.institution_id = bulk_orders.institution_id
  )
);

DROP POLICY IF EXISTS admins_update_bulk_orders ON public.bulk_orders;
CREATE POLICY admins_update_bulk_orders ON public.bulk_orders
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.institution_admins ia
    WHERE ia.user_id = auth.uid()
      AND ia.active
      AND ia.institution_id = bulk_orders.institution_id
  )
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.institution_admins ia
    WHERE ia.user_id = auth.uid()
      AND ia.active
      AND ia.institution_id = bulk_orders.institution_id
  )
);
