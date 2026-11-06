/*
# Website enquiry inbox, replies and unanswered counter

1. New Tables
- `website_enquiries`: messages sent through the website contact form. Stores the customer's name, phone, optional email, enquiry category, optional order reference, message, status (unanswered or answered) and an optional archived timestamp.
- `enquiry_replies`: admin replies saved against an enquiry, with the time each was sent.

2. Security
- Anyone (signed in or not) can submit an enquiry, but only as a new unanswered, non-archived record. They cannot read, change or delete enquiries.
- Only admins can read enquiries and replies, and change an enquiry's status or archive state.
- Admins save replies through `admin_reply_to_enquiry`, which checks admin access and records the reply and marks the enquiry answered in one step.
- Replies cannot be deleted from the app. Enquiries cannot be deleted at all; they are archived instead.

3. Counter
- The unanswered count is the number of enquiries with status unanswered that are not archived. It is computed from saved records, so it survives page refreshes.

4. Important notes
- Customers cannot see admin replies in this release.
*/

CREATE TABLE IF NOT EXISTS website_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL CHECK (char_length(btrim(customer_name)) >= 2 AND char_length(btrim(customer_name)) <= 120),
  phone text NOT NULL CHECK (phone ~ '^0[789][01][0-9]{8}$'),
  email text CHECK (email IS NULL OR (char_length(email) >= 5 AND char_length(email) <= 254)),
  category text NOT NULL CHECK (category IN ('General question', 'Order enquiry', 'Pricing', 'Delivery', 'Complaint', 'Other')),
  order_reference text CHECK (order_reference IS NULL OR order_reference ~ '^DPC-(IND|BLK)-[A-Z0-9]{4}-[A-Z0-9]{6}$'),
  message text NOT NULL CHECK (char_length(btrim(message)) >= 10 AND char_length(btrim(message)) <= 2000),
  status text NOT NULL DEFAULT 'unanswered' CHECK (status IN ('unanswered', 'answered')),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS website_enquiries_open_idx ON website_enquiries (status) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS website_enquiries_created_idx ON website_enquiries (created_at DESC);

CREATE TABLE IF NOT EXISTS enquiry_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL REFERENCES website_enquiries(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) >= 1 AND char_length(btrim(body)) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enquiry_replies_enquiry_idx ON enquiry_replies (enquiry_id, created_at);

ALTER TABLE website_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiry_replies ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON website_enquiries TO anon, authenticated;
GRANT SELECT, UPDATE ON website_enquiries TO authenticated;
GRANT SELECT ON enquiry_replies TO authenticated;

DROP POLICY IF EXISTS "anyone_submit_enquiry" ON website_enquiries;
CREATE POLICY "anyone_submit_enquiry" ON website_enquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'unanswered' AND archived_at IS NULL);

DROP POLICY IF EXISTS "admins_select_enquiries" ON website_enquiries;
CREATE POLICY "admins_select_enquiries" ON website_enquiries FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_update_enquiries" ON website_enquiries;
CREATE POLICY "admins_update_enquiries" ON website_enquiries FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_select_enquiry_replies" ON enquiry_replies;
CREATE POLICY "admins_select_enquiry_replies" ON enquiry_replies FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION admin_reply_to_enquiry(p_enquiry_id uuid, p_body text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reply_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM website_enquiries e WHERE e.id = p_enquiry_id) THEN
    RAISE EXCEPTION 'This enquiry no longer exists.' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO enquiry_replies (enquiry_id, body)
  VALUES (p_enquiry_id, btrim(p_body))
  RETURNING id INTO v_reply_id;

  UPDATE website_enquiries
  SET status = 'answered', updated_at = now()
  WHERE id = p_enquiry_id;

  RETURN v_reply_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_reply_to_enquiry(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_reply_to_enquiry(uuid, text) TO authenticated;
