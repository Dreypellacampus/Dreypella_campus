/*
# Order status history and cancellation reasons

1. New Tables
- `order_status_events`: a timestamped log of every status an individual order has had.
  - `order_id` (references individual_orders.id, cascades on delete)
  - `status` (the status set at that moment)
  - `reason` (the cancellation reason, when the status is Cancelled)
  - `created_at` (when the change happened)

2. Modified Tables
- `individual_orders.cancellation_reason` (text, up to 500 characters). Required whenever the status is Cancelled.

3. Automation
- A trigger writes a status event whenever an order is created or its status changes, so the history cannot be skipped.
- Existing orders receive one event for their current status.

4. Security
- Row level security enabled on `order_status_events`. Only admins can read it.
- Customers can read the cancellation reason on their own orders (column-level grant).
- Admins can set the cancellation reason (column-level grant).
- The trigger function is not callable by any browser role.
*/

ALTER TABLE individual_orders
  ADD COLUMN IF NOT EXISTS cancellation_reason text CHECK (char_length(cancellation_reason) <= 500);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'individual_orders_cancellation_reason_required'
  ) THEN
    ALTER TABLE individual_orders
      ADD CONSTRAINT individual_orders_cancellation_reason_required
      CHECK (status <> 'Cancelled' OR (cancellation_reason IS NOT NULL AND btrim(cancellation_reason) <> ''));
  END IF;
END $$;

GRANT UPDATE (cancellation_reason) ON individual_orders TO authenticated;
GRANT SELECT (cancellation_reason) ON individual_orders TO authenticated;

CREATE TABLE IF NOT EXISTS order_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES individual_orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_status_events_order_idx ON order_status_events (order_id, created_at);

ALTER TABLE order_status_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON order_status_events TO authenticated;

DROP POLICY IF EXISTS "admins_select_order_status_events" ON order_status_events;
CREATE POLICY "admins_select_order_status_events" ON order_status_events FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION record_individual_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_events (order_id, status, reason)
    VALUES (NEW.id, NEW.status, NEW.cancellation_reason);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION record_individual_order_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_individual_order_status ON individual_orders;
CREATE TRIGGER trg_individual_order_status
  AFTER INSERT OR UPDATE OF status ON individual_orders
  FOR EACH ROW EXECUTE FUNCTION record_individual_order_status();

INSERT INTO order_status_events (order_id, status, reason, created_at)
SELECT o.id, o.status, o.cancellation_reason, o.created_at
FROM individual_orders o
WHERE NOT EXISTS (SELECT 1 FROM order_status_events e WHERE e.order_id = o.id);
