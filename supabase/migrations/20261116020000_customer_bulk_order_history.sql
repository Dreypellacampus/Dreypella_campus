/*
# Let customers view their own bulk-order history

Bulk orders already store the authenticated submitter in user_id. This adds a
customer-only SELECT policy so the account history can show that customer's
requests without exposing other customers' requests or admin-only fields.
*/

DROP POLICY IF EXISTS customers_read_own_bulk_orders ON public.bulk_orders;
CREATE POLICY customers_read_own_bulk_orders
ON public.bulk_orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
