-- Manual order payment records. No payment gateway or automatic payment confirmation.
CREATE TABLE IF NOT EXISTS public.order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.individual_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method = 'bank_transfer'),
  status text NOT NULL DEFAULT 'awaiting_confirmation'
    CHECK (status IN ('awaiting_confirmation', 'confirmed', 'rejected')),
  amount_kobo bigint NOT NULL CHECK (amount_kobo > 0),
  currency text NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'),
  reference text NOT NULL UNIQUE,
  sender_name text,
  sender_bank text,
  transfer_reference text,
  proof_url text,
  customer_note text,
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id),
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

CREATE TABLE IF NOT EXISTS public.campus_payment_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  bank_name text NOT NULL DEFAULT '',
  account_name text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  payment_instructions text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
INSERT INTO public.campus_payment_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.campus_payment_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.campus_payment_settings TO authenticated;
DROP POLICY IF EXISTS customers_read_campus_payment_settings ON public.campus_payment_settings;
CREATE POLICY customers_read_campus_payment_settings ON public.campus_payment_settings
FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS admins_update_campus_payment_settings ON public.campus_payment_settings;
CREATE POLICY admins_update_campus_payment_settings ON public.campus_payment_settings
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.submit_manual_order_payment(
  p_order_id uuid,
  p_method text,
  p_sender_name text DEFAULT NULL,
  p_sender_bank text DEFAULT NULL,
  p_transfer_reference text DEFAULT NULL,
  p_customer_note text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_amount numeric;
  v_payment_id uuid;
  v_reference text := 'DPC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Sign in to submit payment.' USING ERRCODE = '42501'; END IF;
  IF p_method <> 'bank_transfer' THEN RAISE EXCEPTION 'Only bank transfer is accepted.'; END IF;
  IF coalesce(trim(p_sender_name), '') = '' OR coalesce(trim(p_transfer_reference), '') = '' THEN
    RAISE EXCEPTION 'Enter the sender name and bank transfer reference.';
  END IF;
  SELECT q.amount INTO v_amount
  FROM public.quotations q
  JOIN public.individual_orders o ON o.id = q.order_id
  WHERE q.order_id = p_order_id AND q.status = 'Approved' AND o.user_id = v_user_id
  ORDER BY q.created_at DESC LIMIT 1;
  IF v_amount IS NULL OR v_amount <= 0 THEN RAISE EXCEPTION 'An approved quotation is required before payment.'; END IF;

  INSERT INTO public.order_payments (
    order_id,user_id,method,status,amount_kobo,currency,reference,
    sender_name,sender_bank,transfer_reference,customer_note
  ) VALUES (
    p_order_id,v_user_id,p_method,'awaiting_confirmation',round(v_amount * 100)::bigint,'NGN',v_reference,
    nullif(trim(p_sender_name),''),nullif(trim(p_sender_bank),''),nullif(trim(p_transfer_reference),''),nullif(trim(p_customer_note),'')
  ) RETURNING id INTO v_payment_id;
  RETURN v_payment_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.submit_manual_order_payment(uuid,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_manual_order_payment(uuid,text,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_manual_order_payment(
  p_payment_id uuid,
  p_decision text,
  p_admin_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_institution_id uuid;
BEGIN
  IF p_decision NOT IN ('confirmed','rejected') THEN RAISE EXCEPTION 'Invalid payment decision.'; END IF;
  SELECT o.institution_id INTO v_institution_id
  FROM public.order_payments op
  JOIN public.individual_orders o ON o.id = op.order_id
  WHERE op.id = p_payment_id AND op.status = 'awaiting_confirmation'
  FOR UPDATE OF op;
  IF NOT FOUND THEN RAISE EXCEPTION 'Awaiting payment was not found.'; END IF;

  IF NOT (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.institution_admins ia
      WHERE ia.user_id = auth.uid() AND ia.active AND ia.institution_id = v_institution_id)
  ) THEN RAISE EXCEPTION 'You are not authorised to review this payment.' USING ERRCODE = '42501'; END IF;

  UPDATE public.order_payments
  SET status = p_decision, admin_note = nullif(trim(p_admin_note),''),
      reviewed_by = auth.uid(), paid_at = CASE WHEN p_decision = 'confirmed' THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = p_payment_id AND status = 'awaiting_confirmation';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.review_manual_order_payment(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_manual_order_payment(uuid,text,text) TO authenticated;
