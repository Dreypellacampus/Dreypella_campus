/*
# Quotations for individual orders

1. New Tables
- `quotations`: one price quotation per individual order.
  - `order_id` (uuid, unique, references individual_orders.id, cascades on delete)
  - `amount` (numeric, zero or more)
  - `summary` (text, up to 1000 characters) describing what the price covers
  - `status` ('Sent', 'Approved', 'Declined', 'Clarification requested')
  - `customer_message` (text, up to 1000 characters) holds the customer's clarification question
  - `created_at`, `updated_at`

2. Security
- Row level security enabled on `quotations`.
- Admins (listed in `admin_users`) can read, create, revise and delete quotations.
- Customers can read only quotations attached to their own orders.
- Customers cannot write directly. They respond through `respond_to_quotation`, a database function that checks ownership, allows only the three responses, and only while the quotation is awaiting a reply.

3. Important Notes
- Revising a quotation sends it back to the customer with status 'Sent'.
- The function is granted to signed-in customers only.
*/

CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES individual_orders(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  summary text NOT NULL DEFAULT '' CHECK (char_length(summary) <= 1000),
  status text NOT NULL DEFAULT 'Sent' CHECK (status IN ('Sent', 'Approved', 'Declined', 'Clarification requested')),
  customer_message text NOT NULL DEFAULT '' CHECK (char_length(customer_message) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON quotations TO authenticated;

DROP POLICY IF EXISTS "admins_select_quotations" ON quotations;
CREATE POLICY "admins_select_quotations" ON quotations FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_insert_quotations" ON quotations;
CREATE POLICY "admins_insert_quotations" ON quotations FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_update_quotations" ON quotations;
CREATE POLICY "admins_update_quotations" ON quotations FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_delete_quotations" ON quotations;
CREATE POLICY "admins_delete_quotations" ON quotations FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "customers_read_own_quotations" ON quotations;
CREATE POLICY "customers_read_own_quotations" ON quotations FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM individual_orders o WHERE o.id = quotations.order_id AND o.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION respond_to_quotation(p_order_id uuid, p_decision text, p_message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message text := left(btrim(coalesce(p_message, '')), 1000);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to respond to this quotation.';
  END IF;

  IF p_decision NOT IN ('Approved', 'Declined', 'Clarification requested') THEN
    RAISE EXCEPTION 'Choose approve, decline or ask a question.';
  END IF;

  IF p_decision = 'Clarification requested' AND v_message = '' THEN
    RAISE EXCEPTION 'Tell us what you would like clarified.';
  END IF;

  UPDATE quotations q
  SET status = p_decision,
      customer_message = CASE WHEN p_decision = 'Clarification requested' THEN v_message ELSE '' END,
      updated_at = now()
  FROM individual_orders o
  WHERE q.order_id = o.id
    AND o.id = p_order_id
    AND o.user_id = auth.uid()
    AND q.status = 'Sent';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This quotation is not waiting for a response.';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION respond_to_quotation(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION respond_to_quotation(uuid, text, text) TO authenticated;
