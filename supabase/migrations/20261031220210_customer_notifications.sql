/*
# Customer notifications for orders and quotations

1. New Tables
- `notifications`: a short message shown to a customer on their dashboard.
  - `user_id` (the customer who receives it, defaults to the signed-in user)
  - `order_id` (the individual order it relates to, removed with the order)
  - `title` and `message` (plain-English text)
  - `read_at` (empty until the customer marks it as read)
  - `created_at`

2. Automation
- A new notification is created when an individual order is placed.
- A new notification is created when an order's status changes (for example Accepted, Ready for Delivery or Cancelled).
- A new notification is created when an admin sends a quotation or revises one (status back to Sent).
- Notifications are written only by these database triggers. Customers cannot create or delete them.

3. Security
- Row level security enabled on `notifications`.
- Customers can read only their own notifications.
- Customers can mark their own notifications as read. Only the `read_at` column can be changed.
- No browser role can insert or delete notifications.
- The trigger functions cannot be called directly by browser roles.

4. Important Notes
- Existing orders do not receive back-dated notifications.
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES individual_orders(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications (user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON notifications TO authenticated;
GRANT UPDATE (read_at) ON notifications TO authenticated;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION notify_order_placed_or_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_message text;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_title := 'Order received';
    v_message := 'We received your ' || NEW.service_title || ' order (' || NEW.reference || ').';
  ELSE
    v_title := 'Order ' || lower(NEW.status);
    v_message := 'Your ' || NEW.service_title || ' order (' || NEW.reference || ') is now ' || lower(NEW.status) || '.';
  END IF;

  INSERT INTO notifications (user_id, order_id, title, message)
  VALUES (NEW.user_id, NEW.id, left(v_title, 120), left(v_message, 500));

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION notify_order_placed_or_status_changed() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_individual_order ON individual_orders;
CREATE TRIGGER trg_notify_individual_order
  AFTER INSERT OR UPDATE OF status ON individual_orders
  FOR EACH ROW EXECUTE FUNCTION notify_order_placed_or_status_changed();

CREATE OR REPLACE FUNCTION notify_quotation_sent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_reference text;
BEGIN
  IF NEW.status <> 'Sent' THEN
    RETURN NEW;
  END IF;

  SELECT o.user_id, o.reference INTO v_user_id, v_reference
  FROM individual_orders o
  WHERE o.id = NEW.order_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, order_id, title, message)
  VALUES (
    v_user_id,
    NEW.order_id,
    'Your quotation is ready',
    'A price quotation for order ' || v_reference || ' is ready. Open My orders to approve, decline or ask a question.'
  );

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION notify_quotation_sent() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_quotation_sent ON quotations;
CREATE TRIGGER trg_notify_quotation_sent
  AFTER INSERT OR UPDATE OF status, amount ON quotations
  FOR EACH ROW EXECUTE FUNCTION notify_quotation_sent();
