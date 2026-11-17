/*
# Delivery partner financial tracking

Stores partner payout details and per-assignment collection/remittance records.
Collection entries are administrative records; a submitted amount is not proof
that funds have reached Dreypella. Only an authorised administrator can verify
a collection or record a remittance. No customer cash-payment option is created.
*/

ALTER TABLE public.delivery_partners
  ADD COLUMN IF NOT EXISTS bank_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account_number text NOT NULL DEFAULT '';

ALTER TABLE public.delivery_partners
  ADD CONSTRAINT delivery_partners_bank_details_length
  CHECK (
    char_length(bank_name) <= 100
    AND char_length(bank_account_name) <= 150
    AND char_length(bank_account_number) <= 30
  );

CREATE TABLE IF NOT EXISTS public.delivery_partner_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_order_id uuid NOT NULL REFERENCES public.delivery_assignments(order_id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE RESTRICT,
  amount_collected_kobo bigint NOT NULL DEFAULT 0 CHECK (amount_collected_kobo >= 0),
  collection_method text NOT NULL DEFAULT 'not_recorded'
    CHECK (collection_method IN ('not_recorded','bank_transfer','cash_collected')),
  collection_reference text,
  collected_at timestamptz,
  remitted_amount_kobo bigint NOT NULL DEFAULT 0 CHECK (remitted_amount_kobo >= 0),
  remitted_at timestamptz,
  remittance_reference text,
  remittance_note text,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_order_id),
  CHECK (remitted_amount_kobo <= amount_collected_kobo),
  CHECK (collection_method <> 'not_recorded' OR amount_collected_kobo = 0)
);

CREATE INDEX IF NOT EXISTS partner_collections_partner_date_idx
  ON public.delivery_partner_collections(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS partner_collections_unremitted_idx
  ON public.delivery_partner_collections(partner_id)
  WHERE remitted_amount_kobo < amount_collected_kobo;

ALTER TABLE public.delivery_partner_collections ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.delivery_partner_collections TO authenticated;
GRANT SELECT (bank_name, bank_account_name, bank_account_number) ON public.delivery_partners TO authenticated;

DROP POLICY IF EXISTS admins_read_partner_collections ON public.delivery_partner_collections;
CREATE POLICY admins_read_partner_collections ON public.delivery_partner_collections
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
);

DROP POLICY IF EXISTS partners_read_own_collections ON public.delivery_partner_collections;
CREATE POLICY partners_read_own_collections ON public.delivery_partner_collections
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.delivery_partners dp
    WHERE dp.id = partner_id AND dp.user_id = auth.uid() AND dp.active
  )
);

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
  IF p_amount_kobo < 0 OR p_method NOT IN ('bank_transfer','cash_collected') THEN
    RAISE EXCEPTION 'Enter a valid collection amount and method.';
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

CREATE OR REPLACE FUNCTION public.admin_record_partner_remittance(
  p_collection_id uuid,
  p_amount_kobo bigint,
  p_reference text DEFAULT NULL,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_collected bigint;
  v_remitted bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only a main administrator can verify partner remittances.' USING ERRCODE = '42501';
  END IF;
  IF p_amount_kobo <= 0 THEN RAISE EXCEPTION 'Remittance amount must be greater than zero.'; END IF;
  SELECT amount_collected_kobo, remitted_amount_kobo INTO v_collected, v_remitted
  FROM public.delivery_partner_collections WHERE id = p_collection_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Collection record not found.'; END IF;
  IF v_remitted + p_amount_kobo > v_collected THEN
    RAISE EXCEPTION 'Remittance cannot exceed the outstanding collected balance.';
  END IF;
  UPDATE public.delivery_partner_collections
  SET remitted_amount_kobo = remitted_amount_kobo + p_amount_kobo,
      remitted_at = now(), remittance_reference = nullif(trim(p_reference),''),
      remittance_note = nullif(trim(p_note),''), updated_at = now()
  WHERE id = p_collection_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_record_partner_collection(uuid,bigint,text,text,timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_record_partner_remittance(uuid,bigint,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_record_partner_collection(uuid,bigint,text,text,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_record_partner_remittance(uuid,bigint,text,text) TO authenticated;
