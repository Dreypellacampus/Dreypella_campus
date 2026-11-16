/*
# Allow institution administrators to manage only their institution's bulk requests

Institution administrators already have a Bulk Requests section in the admin UI.
This migration grants that section institution-scoped row access while preserving
the existing main-administrator policies and customer submission rules.
*/

DROP POLICY IF EXISTS institution_admin_read_assigned_bulk_orders ON public.bulk_orders;
CREATE POLICY institution_admin_read_assigned_bulk_orders
ON public.bulk_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_admins ia
    WHERE ia.user_id = auth.uid()
      AND ia.active
      AND ia.institution_id = bulk_orders.institution_id
  )
);

DROP POLICY IF EXISTS institution_admin_update_assigned_bulk_orders ON public.bulk_orders;
CREATE POLICY institution_admin_update_assigned_bulk_orders
ON public.bulk_orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_admins ia
    WHERE ia.user_id = auth.uid()
      AND ia.active
      AND ia.institution_id = bulk_orders.institution_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.institution_admins ia
    WHERE ia.user_id = auth.uid()
      AND ia.active
      AND ia.institution_id = bulk_orders.institution_id
  )
);
