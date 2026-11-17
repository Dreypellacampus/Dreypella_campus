/*
# Partner self-service bank details and bank-transfer-only collections

Partners can maintain only their own payout details through a checked RPC.
Only main administrators can record collections and remittances. Cash is not
an allowed customer payment or partner collection method.
*/

ALTER TABLE public.delivery_partners
  DROP CONSTRAINT IF EXISTS delivery_partners_bank_details_length;
ALTER TABLE public.delivery_partners
  ADD CONSTRAINT delivery_partners_bank_details_length
  CHECK (
    char_length(bank_name) <= 100
    AND char_length(bank_account_name) <= 150
    AND char_length(bank_account_number) <= 30
  );

ALTER TABLE public.delivery_partner_collections
  DROP CONSTRAINT IF EXISTS delivery_partner_collections_collection_method_check;
ALTER TABLE public.delivery_partner_collections
  ADD CONSTRAINT delivery_partner_collections_collection_method_check
  CHECK (collection_method IN ('not_recorded','bank_transfer'));

CREATE OR REPLACE FUNCTION public.partner_update_own_bank_details(
  p_bank_name text,
  p_account_name text,
  p_account_number text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to update your payout details.' USING ERRCODE = '42501';
  END IF;
  IF length(trim(coalesce(p_bank_name,''))) < 2 OR length(trim(coalesce(p_bank_name,''))) > 100
     OR length(trim(coalesce(p_account_name,''))) < 2 OR length(trim(coalesce(p_account_name,''))) > 150
     OR length(trim(coalesce(p_account_number,''))) < 10 OR length(trim(coalesce(p_account_number,''))) > 30
     OR trim(p_account_number) !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'Enter a valid bank, account name and numeric account number.';
  END IF;
  UPDATE public.delivery_partners
  SET bank_name = trim(p_bank_name),
      bank_account_name = trim(p_account_name),
      bank_account_number = trim(p_account_number)
  WHERE user_id = auth.uid() AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active delivery partner profile was found for this account.' USING ERRCODE = '42501';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.partner_update_own_bank_details(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_update_own_bank_details(text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_record_partner_collection(
  p_order_id uuid,
  p_amount_kobo bigint,
  p_method text,
  p_reference text DEFAULT NULL,
  p_collected_at timestamptz DEFAULT now()
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_partner_id uuid;
  v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only a main administrator can record partner collections.' USING ERRCODE = '42501';
  END IF;
  IF p_amount_kobo < 0 OR p_method <> 'bank_transfer' THEN
    RAISE EXCEPTION 'Only bank-transfer collections can be recorded.';
  END IF;
  SELECT partner_id INTO v_partner_id FROM public.delivery_assignments WHERE order_id = p_order_id;
  IF v_partner_id IS NULL THEN RAISE EXCEPTION 'The order has no delivery partner assignment.'; END IF;
  INSERT INTO public.delivery_partner_collections(
    assignment_order_id, partner_id, amount_collected_kobo, collection_method,
    collection_reference, collected_at, verified_by, verified_at
  ) VALUES (
    p_order_id, v_partner_id, p_amount_kobo, p_method,
    nullif(trim(p_reference),''), p_collected_at, auth.uid(), now()
  )
  ON CONFLICT (assignment_order_id) DO UPDATE SET
    amount_collected_kobo = EXCLUDED.amount_collected_kobo,
    collection_method = EXCLUDED.collection_method,
    collection_reference = EXCLUDED.collection_reference,
    collected_at = EXCLUDED.collected_at,
    verified_by = auth.uid(), verified_at = now(), updated_at = now()
  WHERE delivery_partner_collections.remitted_amount_kobo <= EXCLUDED.amount_collected_kobo
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN RAISE EXCEPTION 'Collected amount cannot be lower than an amount already remitted.'; END IF;
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_record_partner_collection(uuid,bigint,text,text,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_record_partner_collection(uuid,bigint,text,text,timestamptz) TO authenticated;
