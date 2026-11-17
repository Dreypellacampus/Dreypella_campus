-- Permit authorised operations staff to confirm cash received; never expose direct payment writes.
CREATE OR REPLACE FUNCTION public.admin_confirm_cash_order_payment(p_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_institution_id uuid;
BEGIN
  SELECT op.order_id, o.institution_id
  INTO v_order_id, v_institution_id
  FROM public.order_payments op
  JOIN public.individual_orders o ON o.id = op.order_id
  WHERE op.id = p_payment_id
    AND op.method = 'cash'
    AND op.status = 'awaiting_cash'
  FOR UPDATE OF op;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Pending cash payment was not found.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.institution_admins ia
      WHERE ia.user_id = auth.uid() AND ia.active AND ia.institution_id = v_institution_id
    )
  ) THEN
    RAISE EXCEPTION 'You are not authorised to confirm this payment.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.order_payments
  SET status = 'successful', paid_at = now(), updated_at = now()
  WHERE id = p_payment_id AND status = 'awaiting_cash';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_confirm_cash_order_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_confirm_cash_order_payment(uuid) TO authenticated;
