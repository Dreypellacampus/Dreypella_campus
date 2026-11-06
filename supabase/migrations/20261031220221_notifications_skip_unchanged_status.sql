/*
# Skip duplicate order notifications

1. Modified Functions
- `notify_order_placed_or_status_changed` now sends a notification only when an order is placed or its status actually changes. Re-saving the same status no longer creates a duplicate notification.

2. Security
- No change to access. The function remains unavailable to browser roles.
*/

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

  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
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
