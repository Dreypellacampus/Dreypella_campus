-- Payment records are created/updated only by trusted Edge Functions using the service role.
CREATE TABLE IF NOT EXISTS public.order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.individual_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('paystack', 'cash')),
  status text NOT NULL CHECK (status IN ('pending', 'successful', 'failed', 'awaiting_cash')),
  amount_kobo bigint NOT NULL CHECK (amount_kobo >= 0),
  currency text NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'),
  reference text NOT NULL UNIQUE,
  provider_reference text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_payments_order_created_idx ON public.order_payments(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS order_payments_user_created_idx ON public.order_payments(user_id, created_at DESC);
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.order_payments TO authenticated;
DROP POLICY IF EXISTS customers_read_own_order_payments ON public.order_payments;
CREATE POLICY customers_read_own_order_payments ON public.order_payments
FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS admins_read_order_payments ON public.order_payments;
CREATE POLICY admins_read_order_payments ON public.order_payments
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.individual_orders o
    JOIN public.institution_admins ia ON ia.institution_id = o.institution_id
    WHERE o.id = order_payments.order_id AND ia.user_id = auth.uid() AND ia.active
  )
);
