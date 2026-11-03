CREATE OR REPLACE FUNCTION public.get_user_organisation_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_org_role(target_org UUID, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.organisation_id = target_org
      AND p.role = ANY(allowed_roles)
      AND p.is_active
  );
$$;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_user_organisation_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_has_org_role(UUID, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_organisation_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_org_role(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organisation members can view their organisations"
ON organisations
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.organisation_id = organisations.id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Organisation members can update their organisations"
ON organisations
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisations.id, ARRAY['super_admin','church_admin'])
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisations.id, ARRAY['super_admin','church_admin'])
);

CREATE POLICY "Users can read their own profile"
ON profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND organisation_id = public.get_user_organisation_id()
  AND role = public.current_profile_role()
);

CREATE POLICY "Visitors can create their own profile"
ON profiles
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND role = 'visitor'
);

CREATE POLICY "Admins can manage organisation profiles"
ON profiles
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
  AND (
    user_id IS DISTINCT FROM auth.uid()
    OR (
      role = public.current_profile_role()
      AND organisation_id = public.get_user_organisation_id()
    )
  )
);

CREATE POLICY "Organisation staff can read org profiles"
ON profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND organisation_id = public.get_user_organisation_id()
);

CREATE POLICY "Organisation admins can manage organisation members"
ON organisation_members
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
);

CREATE POLICY "Organisation staff can read branch data"
ON branches
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND organisation_id = public.get_user_organisation_id()
);

CREATE POLICY "Admins can manage branches"
ON branches
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
);

CREATE POLICY "Admins can update branches"
ON branches
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
);

CREATE POLICY "Pastors and admins can view organisation pastors"
ON pastors
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND organisation_id = public.get_user_organisation_id()
);

CREATE POLICY "Admins can manage pastors"
ON pastors
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
);

CREATE POLICY "Organisation staff can view appointment types"
ON appointment_types
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND organisation_id = public.get_user_organisation_id()
);

CREATE POLICY "Admins manage appointment types"
ON appointment_types
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
);

CREATE POLICY "Public can view bookable organisations"
ON organisations
FOR SELECT
TO anon, authenticated
USING (booking_enabled = TRUE);

CREATE POLICY "Public can view active pastors"
ON pastors
FOR SELECT
TO anon, authenticated
USING (
  is_active = TRUE
  AND EXISTS (
    SELECT 1
    FROM public.organisations o
    WHERE o.id = pastors.organisation_id
      AND o.booking_enabled
  )
);

CREATE POLICY "Public can view active appointment types"
ON appointment_types
FOR SELECT
TO anon, authenticated
USING (
  is_active = TRUE
  AND EXISTS (
    SELECT 1
    FROM public.organisations o
    WHERE o.id = appointment_types.organisation_id
      AND o.booking_enabled
  )
);

CREATE POLICY "Public can create booking requests"
ON bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND scheduled_for > NOW()
  AND char_length(btrim(visitor_name)) >= 2
  AND visitor_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND contact_method IN ('email', 'whatsapp', 'sms')
  AND meeting_mode IN ('physical', 'virtual')
  AND (
    contact_method = 'email'
    OR char_length(regexp_replace(coalesce(visitor_phone, ''), '[^0-9]', '', 'g')) >= 7
  )
  AND EXISTS (
    SELECT 1
    FROM public.organisations o
    WHERE o.id = organisation_id
      AND o.booking_enabled
  )
  AND (
    pastor_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.pastors p
      WHERE p.id = pastor_id
        AND p.organisation_id = organisation_id
        AND p.is_active
    )
  )
  AND (
    appointment_type_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.appointment_types t
      WHERE t.id = appointment_type_id
        AND t.organisation_id = organisation_id
        AND t.is_active
    )
  )
);

CREATE POLICY "Organisation staff can view bookings"
ON bookings
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND organisation_id = public.get_user_organisation_id()
);

CREATE POLICY "Organisation staff can update bookings"
ON bookings
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin','pastor','assistant_pastor','secretary'])
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin','pastor','assistant_pastor','secretary'])
);

CREATE POLICY "Pastors and admins can manage schedules"
ON availability_schedules
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin','pastor'])
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin','pastor'])
);

CREATE POLICY "Pastors and admins can manage schedule breaks"
ON availability_breaks
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.availability_schedules s
    WHERE s.id = availability_breaks.schedule_id
      AND s.organisation_id = public.get_user_organisation_id()
      AND public.user_has_org_role(s.organisation_id, ARRAY['super_admin','church_admin','pastor'])
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.availability_schedules s
    WHERE s.id = availability_breaks.schedule_id
      AND s.organisation_id = public.get_user_organisation_id()
      AND public.user_has_org_role(s.organisation_id, ARRAY['super_admin','church_admin','pastor'])
  )
);

CREATE POLICY "Pastors and admins can manage blocked dates"
ON blocked_dates
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin','pastor'])
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin','pastor'])
);

CREATE POLICY "Organisation staff can read booking history"
ON booking_history
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_history.booking_id
      AND b.organisation_id = public.get_user_organisation_id()
  )
);

CREATE POLICY "Admins and pastors can manage booking history"
ON booking_history
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_history.booking_id
      AND b.organisation_id = public.get_user_organisation_id()
      AND public.user_has_org_role(b.organisation_id, ARRAY['super_admin','church_admin','pastor','assistant_pastor','secretary'])
  )
);

CREATE POLICY "Pastors and admins can manage follow ups"
ON follow_ups
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin','pastor'])
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin','pastor'])
);

CREATE POLICY "Organisation staff can read notifications"
ON notifications
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin','pastor','assistant_pastor','secretary','read_only_staff'])
);

CREATE POLICY "Organisation staff can create notifications"
ON notifications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin','pastor','assistant_pastor','secretary'])
);

CREATE POLICY "Organisation staff can update notifications"
ON notifications
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin','pastor','assistant_pastor','secretary'])
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin','pastor','assistant_pastor','secretary'])
);

CREATE POLICY "Organisation staff can manage notification templates"
ON notification_templates
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
);

CREATE POLICY "Organisation staff can read settings"
ON application_settings
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND organisation_id = public.get_user_organisation_id()
);

CREATE POLICY "Admins manage application settings"
ON application_settings
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
);

CREATE POLICY "Organisation staff can read audit logs"
ON audit_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND organisation_id = public.get_user_organisation_id()
);

CREATE POLICY "Admins can write audit logs"
ON audit_logs
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_org_role(organisation_id, ARRAY['super_admin','church_admin'])
);

GRANT SELECT ON public.organisations, public.pastors, public.appointment_types TO anon, authenticated;
GRANT INSERT ON public.bookings TO anon, authenticated;

INSERT INTO organisations (id, name, slug, brand_name, logo_url, primary_color, accent_color, booking_enabled)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Grace Fellowship Church',
  'grace-fellowship',
  'Grace Fellowship',
  'https://example.com/logo.png',
  '#102b4d',
  '#9a7a2f',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO branches (id, organisation_id, name, code, location, is_active)
VALUES (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Main Campus',
  'MAIN',
  'Accra, Ghana',
  TRUE
)
ON CONFLICT DO NOTHING;

INSERT INTO appointment_types (id, organisation_id, name, description, is_active)
VALUES
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'Prayer', 'Prayer and intercession support', TRUE),
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'Counselling', 'Pastoral counselling session', TRUE),
  ('55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', 'Spiritual Guidance', 'Spiritual direction and guidance', TRUE),
  ('e1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Marriage counselling', 'Marriage counselling session', TRUE),
  ('e2222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Wedding preparation', 'Wedding preparation meeting', TRUE),
  ('e3333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'Hospital visitation', 'Hospital and home visitation', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, organisation_id, email, full_name, phone, role, is_active)
VALUES
  ('c1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'james.adebayo@grace.example', 'Pastor James Adebayo', '+233 20 100 0001', 'pastor', TRUE),
  ('c2222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'esther.moyo@grace.example', 'Pastor Esther Moyo', '+233 20 100 0002', 'pastor', TRUE),
  ('c3333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'daniel.okafor@grace.example', 'Pastor Daniel Okafor', '+233 20 100 0003', 'pastor', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO pastors (id, organisation_id, profile_id, branch_id, title, is_active)
VALUES
  ('d1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Pastor', TRUE),
  ('d2222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'c2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'Pastor', TRUE),
  ('d3333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'c3333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 'Pastor', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO availability_schedules (
  id, organisation_id, pastor_id, branch_id, appointment_duration_minutes, max_appointments_per_day, minimum_booking_notice_minutes, maximum_days_ahead, time_zone
)
VALUES
  ('f1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'd1111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 30, 8, 30, 90, 'Africa/Accra'),
  ('f2222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'd2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 30, 8, 30, 90, 'Africa/Accra'),
  ('f3333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'd3333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 30, 8, 30, 90, 'Africa/Accra')
ON CONFLICT DO NOTHING;

INSERT INTO notification_templates (id, organisation_id, channel, event_type, subject, body, is_active)
VALUES
  ('66666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111', 'email', 'booking_received', 'New appointment request received', 'We have received your appointment request and will contact you soon.', TRUE),
  ('77777777-7777-4777-8777-777777777777', '11111111-1111-4111-8111-111111111111', 'email', 'booking_confirmed', 'Your appointment has been confirmed', 'Your pastoral appointment request has been confirmed.', TRUE),
  ('88888888-8888-4888-8888-888888888888', '11111111-1111-4111-8111-111111111111', 'email', 'booking_rejected', 'Your appointment request was not approved', 'Your appointment request was reviewed and could not be approved.', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO application_settings (id, organisation_id, key, value)
VALUES
  ('99999999-9999-4999-8999-999999999999', '11111111-1111-4111-8111-111111111111', 'booking.config', '{"defaultDurationMinutes":60,"minimumNoticeMinutes":30,"maximumDaysAhead":90,"allowPhysical":true,"allowVirtual":true}'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'notifications.enabled', '{"email":true,"whatsapp":true,"sms":false}')
ON CONFLICT DO NOTHING;
