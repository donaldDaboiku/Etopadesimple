CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  brand_name TEXT,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#102b4d',
  accent_color TEXT NOT NULL DEFAULT '#9a7a2f',
  booking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'visitor' CHECK (role IN ('super_admin','church_admin','pastor','assistant_pastor','secretary','read_only_staff','visitor')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id),
  UNIQUE (organisation_id, email)
);

CREATE TABLE IF NOT EXISTS organisation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'visitor' CHECK (role IN ('super_admin','church_admin','pastor','assistant_pastor','secretary','read_only_staff','visitor')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','disabled')),
  invited_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, profile_id)
);

CREATE TABLE IF NOT EXISTS pastors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  title TEXT,
  biography TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, name)
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  pastor_id UUID REFERENCES pastors(id) ON DELETE SET NULL,
  appointment_type_id UUID REFERENCES appointment_types(id) ON DELETE SET NULL,
  visitor_name TEXT NOT NULL,
  visitor_email TEXT NOT NULL,
  visitor_phone TEXT,
  contact_method TEXT NOT NULL DEFAULT 'email' CHECK (contact_method IN ('email','whatsapp','sms')),
  meeting_mode TEXT NOT NULL DEFAULT 'physical' CHECK (meeting_mode IN ('physical','virtual')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected','rescheduled','completed','cancelled','no_show')),
  notes TEXT,
  rejection_reason TEXT,
  booking_reference TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 12)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (char_length(btrim(visitor_name)) BETWEEN 2 AND 120),
  CHECK (char_length(visitor_email) <= 254 AND visitor_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CHECK (
    contact_method = 'email'
    OR (
      visitor_phone IS NOT NULL
      AND char_length(regexp_replace(visitor_phone, '[^0-9]', '', 'g')) >= 7
    )
  ),
  CHECK (notes IS NULL OR char_length(notes) <= 1000)
);

CREATE TABLE IF NOT EXISTS availability_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  pastor_id UUID REFERENCES pastors(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  monday BOOLEAN NOT NULL DEFAULT TRUE,
  tuesday BOOLEAN NOT NULL DEFAULT TRUE,
  wednesday BOOLEAN NOT NULL DEFAULT TRUE,
  thursday BOOLEAN NOT NULL DEFAULT TRUE,
  friday BOOLEAN NOT NULL DEFAULT TRUE,
  saturday BOOLEAN NOT NULL DEFAULT FALSE,
  sunday BOOLEAN NOT NULL DEFAULT FALSE,
  opening_time TIME NOT NULL DEFAULT '09:00:00',
  closing_time TIME NOT NULL DEFAULT '17:00:00',
  appointment_duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (appointment_duration_minutes IN (15,30,45,60,90,120)),
  max_appointments_per_day INTEGER NOT NULL DEFAULT 8 CHECK (max_appointments_per_day > 0),
  minimum_booking_notice_minutes INTEGER NOT NULL DEFAULT 30 CHECK (minimum_booking_notice_minutes >= 0),
  maximum_days_ahead INTEGER NOT NULL DEFAULT 90 CHECK (maximum_days_ahead > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  time_zone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (opening_time < closing_time)
);

CREATE TABLE IF NOT EXISTS availability_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES availability_schedules(id) ON DELETE CASCADE,
  break_date DATE,
  weekday SMALLINT CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  pastor_id UUID REFERENCES pastors(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  reason TEXT,
  is_all_day BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS booking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  actor_id UUID,
  previous_status TEXT,
  next_status TEXT NOT NULL CHECK (next_status IN ('pending','confirmed','rejected','rescheduled','completed','cancelled','no_show')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  pastor_id UUID NOT NULL REFERENCES pastors(id) ON DELETE CASCADE,
  follow_up_date DATE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','missed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp','sms')),
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed')),
  payload JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp','sms')),
  event_type TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, channel, event_type)
);

CREATE TABLE IF NOT EXISTS application_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  actor_id UUID,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branches_org ON branches(organisation_id, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_org_role ON profiles(organisation_id, role);
CREATE INDEX IF NOT EXISTS idx_organisation_members_org ON organisation_members(organisation_id, role, status);
CREATE INDEX IF NOT EXISTS idx_pastors_org_branch ON pastors(organisation_id, branch_id, is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_org_pastor_status ON bookings(organisation_id, pastor_id, status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_bookings_date_window ON bookings(organisation_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_availability_schedules_org_pastor ON availability_schedules(organisation_id, pastor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_follow_ups_org_pastor ON follow_ups(organisation_id, pastor_id, follow_up_date);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_org_pastor ON blocked_dates(organisation_id, pastor_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_notifications_booking ON notifications(booking_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_templates_org ON notification_templates(organisation_id, channel, event_type);
CREATE INDEX IF NOT EXISTS idx_application_settings_org_key ON application_settings(organisation_id, key);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs(organisation_id, created_at DESC);

-- NOW() is not immutable, so a CHECK constraint cannot enforce a future slot.
CREATE OR REPLACE FUNCTION public.bookings_require_future_slot()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.scheduled_for <= NOW() THEN
    RAISE EXCEPTION 'Appointment must be scheduled in the future';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_future_slot ON bookings;
CREATE TRIGGER bookings_future_slot
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION public.bookings_require_future_slot();

-- ponytail: blocks the same pastor at the same instant. Overlapping durations that start at different times still pass.
-- Upgrade path: store a tstzrange and exclude overlapping ranges.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_one_active_slot'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_one_active_slot
      EXCLUDE USING gist (
        pastor_id WITH =,
        scheduled_for WITH =
      )
      WHERE (status IN ('pending', 'confirmed', 'rescheduled'));
  END IF;
END $$;
