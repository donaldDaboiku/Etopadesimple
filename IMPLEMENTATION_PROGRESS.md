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

### Next work

- Phase 4: connect the public booking portal to the database.
- Phase 5-10: dashboards, notifications, availability logic, live reports, testing, and deployment.

The local password is a stand-in until Supabase Auth is connected. It does not replace row-level security.
