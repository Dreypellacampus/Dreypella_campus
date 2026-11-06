/*
# Create customer profiles and individual orders

1. New Tables
- `profiles`: one row per registered customer, keyed by their sign-in account. Holds full name, WhatsApp number, preferred delivery address, institution, department and student status. All but name and WhatsApp are optional.
- `individual_orders`: one row per individual order request sent from the website. Stores the order reference, service, the customer's answers as JSON, the delivery location as JSON, and the status (new requests start as Pending). `user_id` is filled automatically when the order is placed by a signed-in customer and stays empty for guest orders.

2. Security
- RLS enabled on both tables.
- profiles: a signed-in customer can read, create and update only their own profile. Nobody can delete profiles through the API.
- individual_orders: anyone on the website (guest or signed in) can submit an order, but only as Pending and only for themselves or as a guest. Signed-in customers can read only their own orders. Signed-in administrators (listed in `admin_users`) can read all orders. Nobody can update or delete orders through the API.
- Guests cannot read any order through the API, so guest orders are never shown in a history.

3. Notes
- Status changes for individual orders will be added with the admin order management work.
- Profile updates use the same policies as creation, so a customer cannot change another customer's profile.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 120),
  whatsapp text NOT NULL CHECK (whatsapp ~ '^0[789][01][0-9]{8}$'),
  preferred_address text CHECK (preferred_address IS NULL OR char_length(preferred_address) <= 300),
  institution text CHECK (institution IS NULL OR char_length(institution) <= 160),
  department text CHECK (department IS NULL OR char_length(department) <= 160),
  student_status text CHECK (student_status IS NULL OR student_status IN ('Student', 'Not a student')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE TABLE IF NOT EXISTS individual_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE CHECK (reference ~ '^DPC-IND-[A-Z0-9]{4}-[A-Z0-9]{6}$'),
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'Quoted', 'Accepted', 'Processing', 'Ready for Delivery', 'Delivered', 'Cancelled')
  ),
  service_id text NOT NULL CHECK (service_id IN ('buy', 'print', 'get', 'deliver')),
  service_title text NOT NULL CHECK (char_length(service_title) BETWEEN 2 AND 80),
  customer_name text NOT NULL CHECK (char_length(btrim(customer_name)) BETWEEN 2 AND 120),
  whatsapp text NOT NULL CHECK (whatsapp ~ '^0[789][01][0-9]{8}$'),
  details jsonb NOT NULL CHECK (jsonb_typeof(details) = 'object'),
  delivery_location jsonb NOT NULL CHECK (jsonb_typeof(delivery_location) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS individual_orders_user_created_idx ON individual_orders (user_id, created_at DESC);

ALTER TABLE individual_orders ENABLE ROW LEVEL SECURITY;

GRANT INSERT (
  reference, user_id, service_id, service_title, customer_name, whatsapp, details, delivery_location
) ON individual_orders TO anon, authenticated;

GRANT SELECT ON individual_orders TO authenticated;

DROP POLICY IF EXISTS "anyone_submit_individual_order" ON individual_orders;
CREATE POLICY "anyone_submit_individual_order" ON individual_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'Pending'
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "customers_read_own_individual_orders" ON individual_orders;
CREATE POLICY "customers_read_own_individual_orders" ON individual_orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_read_individual_orders" ON individual_orders;
CREATE POLICY "admins_read_individual_orders" ON individual_orders
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));
