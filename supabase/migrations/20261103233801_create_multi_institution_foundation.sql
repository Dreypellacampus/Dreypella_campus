/*
# Create the multi-institution foundation

1. New tables
- `institutions` stores administrator-controlled institutions, their type, town, location, optional logo, and active state.
- `institution_admins` assigns an authenticated user to one institution as an institution administrator.

2. Existing profile changes
- Adds `customer_category`, `institution_id`, `level_of_study`, and `institution_submission` to `profiles`.
- Existing free-text institution data is retained. Only profiles whose existing text clearly contains LAUTECH are linked to the seeded LAUTECH record.

3. Existing order changes
- Adds institution IDs, historical institution-name snapshots, customer categories, and user ownership to bulk orders.
- Adds institution ID, historical institution-name snapshot, and customer category to individual orders.
- Existing order IDs and references remain unchanged. Existing records that cannot be safely matched remain unassigned for later Main Admin review.

4. Security
- Public users may read only active institutions for registration and public coverage display.
- Main administrators manage every institution and institution administrator assignment.
- Institution administrators can read and update only records assigned to their institution.
- Customer order ownership remains enforced by auth.uid().
- A database trigger derives new order institution context from the authenticated profile and never trusts a client-supplied institution ID.
- Institution administrators cannot change their own assignment through the table API.

5. Compatibility
- LAUTECH is seeded as the first institution.
- Existing text fields and records are preserved for backwards compatibility and review.
- No paid service, payment gateway, or external dependency is introduced.
*/

CREATE TABLE IF NOT EXISTS public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 160),
  institution_type text NOT NULL CHECK (institution_type IN ('University', 'Polytechnic', 'College of Education', 'Other')),
  location text NOT NULL CHECK (char_length(btrim(location)) BETWEEN 2 AND 160),
  town text NOT NULL CHECK (char_length(btrim(town)) BETWEEN 2 AND 120),
  logo_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS institutions_name_lower_key ON public.institutions (lower(btrim(name)));
CREATE INDEX IF NOT EXISTS institutions_active_name_idx ON public.institutions (active, lower(name));

CREATE TABLE IF NOT EXISTS public.institution_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE RESTRICT,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS institution_admins_institution_idx ON public.institution_admins (institution_id, active);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS customer_category text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level_of_study text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institution_submission text;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_customer_category_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_customer_category_check CHECK (customer_category IS NULL OR customer_category IN ('LAUTECH student', 'Student of another institution', 'Ogbomoso resident', 'Worker/professional', 'Business/other customer'));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_level_of_study_length CHECK (level_of_study IS NULL OR char_length(level_of_study) <= 80);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_institution_submission_length CHECK (institution_submission IS NULL OR char_length(institution_submission) <= 160);
CREATE INDEX IF NOT EXISTS profiles_institution_idx ON public.profiles (institution_id);

ALTER TABLE public.individual_orders ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL;
ALTER TABLE public.individual_orders ADD COLUMN IF NOT EXISTS institution_name_snapshot text;
ALTER TABLE public.individual_orders ADD COLUMN IF NOT EXISTS customer_category text;
ALTER TABLE public.individual_orders ADD CONSTRAINT individual_orders_category_length CHECK (customer_category IS NULL OR char_length(customer_category) <= 80);
CREATE INDEX IF NOT EXISTS individual_orders_institution_created_idx ON public.individual_orders (institution_id, created_at DESC);

ALTER TABLE public.bulk_orders ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.bulk_orders ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL;
ALTER TABLE public.bulk_orders ADD COLUMN IF NOT EXISTS institution_name_snapshot text;
ALTER TABLE public.bulk_orders ADD COLUMN IF NOT EXISTS customer_category text;
ALTER TABLE public.bulk_orders ADD CONSTRAINT bulk_orders_category_length CHECK (customer_category IS NULL OR char_length(customer_category) <= 80);
CREATE INDEX IF NOT EXISTS bulk_orders_institution_created_idx ON public.bulk_orders (institution_id, created_at DESC);

INSERT INTO public.institutions (name, institution_type, location, town)
VALUES ('LAUTECH', 'University', 'Ogbomoso', 'Ogbomoso')
ON CONFLICT DO NOTHING;

UPDATE public.profiles p
SET institution_id = i.id,
    customer_category = COALESCE(p.customer_category, 'LAUTECH student')
FROM public.institutions i
WHERE lower(trim(coalesce(p.institution, ''))) LIKE '%lautech%'
  AND lower(trim(i.name)) = 'lautech'
  AND p.institution_id IS NULL;

UPDATE public.individual_orders o
SET institution_id = p.institution_id,
    institution_name_snapshot = i.name,
    customer_category = COALESCE(o.customer_category, p.customer_category)
FROM public.profiles p
JOIN public.institutions i ON i.id = p.institution_id
WHERE o.user_id = p.id
  AND o.institution_id IS NULL;

UPDATE public.bulk_orders o
SET institution_id = p.institution_id,
    institution_name_snapshot = i.name,
    customer_category = COALESCE(o.customer_category, p.customer_category)
FROM public.profiles p
JOIN public.institutions i ON i.id = p.institution_id
WHERE o.user_id = p.id
  AND o.institution_id IS NULL;

CREATE OR REPLACE FUNCTION public.sync_customer_institution_context()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_institution public.institutions;
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    IF NEW.institution_id IS NOT NULL THEN
      SELECT * INTO v_institution FROM public.institutions WHERE id = NEW.institution_id AND active;
      IF NOT FOUND THEN RAISE EXCEPTION 'Selected institution is not available'; END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NOT NULL THEN
    SELECT p.institution_id, p.customer_category, i.name
    INTO NEW.institution_id, NEW.customer_category, NEW.institution_name_snapshot
    FROM public.profiles p
    LEFT JOIN public.institutions i ON i.id = p.institution_id
    WHERE p.id = NEW.user_id;
  END IF;

  IF NEW.institution_id IS NULL THEN
    NEW.customer_category := COALESCE(NEW.customer_category, 'Ogbomoso resident');
    NEW.institution_name_snapshot := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_institution ON public.profiles;
CREATE TRIGGER trg_sync_profile_institution
BEFORE INSERT OR UPDATE OF institution_id ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_customer_institution_context();

DROP TRIGGER IF EXISTS trg_sync_individual_order_institution ON public.individual_orders;
CREATE TRIGGER trg_sync_individual_order_institution
BEFORE INSERT ON public.individual_orders
FOR EACH ROW EXECUTE FUNCTION public.sync_customer_institution_context();

DROP TRIGGER IF EXISTS trg_sync_bulk_order_institution ON public.bulk_orders;
CREATE TRIGGER trg_sync_bulk_order_institution
BEFORE INSERT ON public.bulk_orders
FOR EACH ROW EXECUTE FUNCTION public.sync_customer_institution_context();

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_admins ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.institutions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.institutions TO authenticated;
GRANT SELECT ON public.institution_admins TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.institution_admins TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.individual_orders TO anon, authenticated;
GRANT SELECT, INSERT ON public.bulk_orders TO anon, authenticated;

DROP POLICY IF EXISTS institutions_public_read_active ON public.institutions;
CREATE POLICY institutions_public_read_active ON public.institutions FOR SELECT TO anon, authenticated USING (active);
DROP POLICY IF EXISTS institutions_main_admin_read_all ON public.institutions;
CREATE POLICY institutions_main_admin_read_all ON public.institutions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));
DROP POLICY IF EXISTS institutions_assigned_admin_read ON public.institutions;
CREATE POLICY institutions_assigned_admin_read ON public.institutions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.institution_admins ia WHERE ia.user_id = auth.uid() AND ia.active AND ia.institution_id = institutions.id));
DROP POLICY IF EXISTS institutions_main_admin_insert ON public.institutions;
CREATE POLICY institutions_main_admin_insert ON public.institutions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));
DROP POLICY IF EXISTS institutions_main_admin_update ON public.institutions;
CREATE POLICY institutions_main_admin_update ON public.institutions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));
DROP POLICY IF EXISTS institutions_main_admin_delete ON public.institutions;
CREATE POLICY institutions_main_admin_delete ON public.institutions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS institution_admins_main_admin_read ON public.institution_admins;
CREATE POLICY institution_admins_main_admin_read ON public.institution_admins FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()) OR user_id = auth.uid());
DROP POLICY IF EXISTS institution_admins_main_admin_insert ON public.institution_admins;
CREATE POLICY institution_admins_main_admin_insert ON public.institution_admins FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));
DROP POLICY IF EXISTS institution_admins_main_admin_update ON public.institution_admins;
CREATE POLICY institution_admins_main_admin_update ON public.institution_admins FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()) AND user_id <> auth.uid()) WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()) AND user_id <> auth.uid());
DROP POLICY IF EXISTS institution_admins_main_admin_delete ON public.institution_admins;
CREATE POLICY institution_admins_main_admin_delete ON public.institution_admins FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS institutions_admin_read_assigned_orders ON public.individual_orders;
CREATE POLICY institutions_admin_read_assigned_orders ON public.individual_orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.institution_admins ia WHERE ia.user_id = auth.uid() AND ia.active AND ia.institution_id = individual_orders.institution_id));
DROP POLICY IF EXISTS institutions_admin_update_assigned_orders ON public.individual_orders;
CREATE POLICY institutions_admin_update_assigned_orders ON public.individual_orders FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.institution_admins ia WHERE ia.user_id = auth.uid() AND ia.active AND ia.institution_id = individual_orders.institution_id)) WITH CHECK (EXISTS (SELECT 1 FROM public.institution_admins ia WHERE ia.user_id = auth.uid() AND ia.active AND ia.institution_id = individual_orders.institution_id));
DROP POLICY IF EXISTS institutions_admin_read_assigned_bulk_orders ON public.bulk_orders;
CREATE POLICY institutions_admin_read_assigned_bulk_orders ON public.bulk_orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.institution_admins ia WHERE ia.user_id = auth.uid() AND ia.active AND ia.institution_id = bulk_orders.institution_id));
DROP POLICY IF EXISTS institutions_admin_update_assigned_bulk_orders ON public.bulk_orders;
CREATE POLICY institutions_admin_update_assigned_bulk_orders ON public.bulk_orders FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.institution_admins ia WHERE ia.user_id = auth.uid() AND ia.active AND ia.institution_id = bulk_orders.institution_id)) WITH CHECK (EXISTS (SELECT 1 FROM public.institution_admins ia WHERE ia.user_id = auth.uid() AND ia.active AND ia.institution_id = bulk_orders.institution_id));

REVOKE EXECUTE ON FUNCTION public.sync_customer_institution_context() FROM PUBLIC, anon, authenticated;
