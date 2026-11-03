# ETOPADE implementation progress

## Phase 1 – Discovery and project structure

Status: complete

### Completed

- Verified the workspace did not contain the referenced prototype files `pastor-booking.html` and `schema.sql`.
- Created the Vite + React + TypeScript project structure.
- Established the ETOPADE design system with navy and gold visual direction.
- Documented the audit findings and phased delivery plan.

### Key findings

- The original prototype files are absent in this workspace; therefore, no existing booking logic was available to migrate directly.
- The current project needed a clean architecture to satisfy the requested multi-church SaaS requirements.
- Security and backend constraints must be treated as first-class priorities, not frontend-only filters.

## Phase 2 – Database schema, constraints, and RLS

Status: complete

### Completed

- Created a PostgreSQL schema covering organisations, branches, profiles, pastors, appointment types, bookings, availability, blocked dates, records, follow-ups, notifications, templates, settings, and audit logs.
- Added UUID primary keys, foreign keys, timestamps, status constraints, and indexes.
- Added row-level-security policies for organisation-level isolation and staff/admin access.
- Added a seed dataset for a starter church organisation and default booking settings.
- Added migration files in `supabase/migrations` and a readable schema reference in `supabase/schema.sql`.

## Phase 3 – Authentication and role-based access

Status: complete

### Completed

- Staff sign-in checks the church directory instead of letting a visitor choose a role.
- Pastors see their own report. Secretaries and church administrators see the church-wide report.
- Reports stay hidden on the public pages and on the login page.
- A secretary and a church administrator were added to the seed data.

## Phase 4 – Public booking portal

Status: complete

### Completed

- A public request is stored as a pending booking row for Grace Fellowship, with pastor, category, visitor, and time.
- The same pastor and time cannot be stored twice.
- Pastor and secretary reports read those rows instead of sample figures.

### Next work

- Phase 5: pastor dashboard.
- Phase 6-10: administrator tools, availability, notifications, deployment.

Bookings are stored on this device until a Supabase project is connected. The row matches the `bookings` table. The local password is still a stand-in until Supabase Auth is connected.
