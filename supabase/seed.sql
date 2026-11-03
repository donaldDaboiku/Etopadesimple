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
  ('c3333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'daniel.okafor@grace.example', 'Pastor Daniel Okafor', '+233 20 100 0003', 'pastor', TRUE),
  ('c4444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'ama.mensah@grace.example', 'Ama Mensah', '+233 20 100 0004', 'secretary', TRUE),
  ('c5555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', 'ruth.owusu@grace.example', 'Ruth Owusu', '+233 20 100 0005', 'church_admin', TRUE)
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
