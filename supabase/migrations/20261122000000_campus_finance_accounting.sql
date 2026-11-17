/*
  Campus finance ledger.
  Entries are manual accounting records; they do not represent live bank balances.
  Every entry is restricted to the main administrator. Entries are append-only so
  corrections are recorded as new reversing/adjustment entries rather than erased.
*/
CREATE TABLE IF NOT EXISTS public.campus_finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type text NOT NULL CHECK (entry_type IN ('income','expense')),
  category text NOT NULL CHECK (char_length(btrim(category)) BETWEEN 2 AND 80),
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 2 AND 500),
  amount_kobo bigint NOT NULL CHECK (amount_kobo > 0),
  transaction_date date NOT NULL DEFAULT current_date,
  institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  partner_id uuid REFERENCES public.delivery_partners(id) ON DELETE RESTRICT,
  reference text CHECK (reference IS NULL OR char_length(reference) <= 160),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campus_finance_partner_payout_expense CHECK (
    category <> 'partner_payout' OR (entry_type = 'expense' AND partner_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS campus_finance_entries_date_idx
  ON public.campus_finance_entries(transaction_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS campus_finance_entries_institution_idx
  ON public.campus_finance_entries(institution_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS campus_finance_entries_partner_idx
  ON public.campus_finance_entries(partner_id, transaction_date DESC);

ALTER TABLE public.campus_finance_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campus_finance_entries FROM anon, authenticated;
GRANT SELECT, INSERT ON public.campus_finance_entries TO authenticated;

DROP POLICY IF EXISTS campus_finance_main_admin_read ON public.campus_finance_entries;
CREATE POLICY campus_finance_main_admin_read ON public.campus_finance_entries
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS campus_finance_main_admin_insert ON public.campus_finance_entries;
CREATE POLICY campus_finance_main_admin_insert ON public.campus_finance_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
  );

COMMENT ON TABLE public.campus_finance_entries IS
  'Main-admin-only append-only accounting ledger. Values are manually recorded and require reconciliation with bank statements.';
