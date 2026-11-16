/*
# Secure customer bulk-order history

Customers retrieve only their own bulk requests through a narrowly scoped RPC.
Do not add a table SELECT policy: bulk_orders also contains internal_notes and
customer_response, which must remain administrator-only.
*/

DROP POLICY IF EXISTS customers_read_own_bulk_orders ON public.bulk_orders;

CREATE OR REPLACE FUNCTION public.customer_list_own_bulk_orders()
RETURNS TABLE (
  id uuid,
  reference text,
  status text,
  customer_name text,
  service_type text,
  items jsonb,
  delivery_date date,
  delivery_time text,
  delivery_location jsonb,
  institution_name_snapshot text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.id,
    b.reference,
    b.status,
    b.customer_name,
    b.service_type,
    b.items,
    b.delivery_date,
    b.delivery_time,
    b.delivery_location,
    b.institution_name_snapshot,
    b.created_at
  FROM public.bulk_orders b
  WHERE b.user_id = auth.uid()
  ORDER BY b.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.customer_list_own_bulk_orders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.customer_list_own_bulk_orders() TO authenticated;
