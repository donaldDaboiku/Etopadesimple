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
- A pastor cannot open another pastor’s booking rows. The database policy uses the same split.
- Reports stay hidden on the public pages and on the login page.
- A secretary and a church administrator were added to the seed data.

## Phase 4 – Public booking portal

Status: complete

### Completed

- A public request is stored as a pending booking row for Grace Fellowship, with pastor, category, visitor, and time.
- The same pastor and time cannot be stored twice.
- Pastor and secretary reports read those rows instead of sample figures.

## Phase 5 – Pastor dashboard

Status: complete

### Completed

- A pastor signs in to their own dashboard and can confirm or decline a pending request.
- A confirmed time stays blocked. A declined time can be requested again.
- Another pastor, a secretary, and a church administrator cannot open that dashboard or decide those requests.

## Phase 6 – Administrator dashboard on Firebase

Status: complete

### Completed

- Replaced the Supabase plan with Firebase Authentication and Cloud Firestore.
- A church administrator signs in with Google and adds a pastor or secretary by Gmail.
- That person signs in with the same Gmail and receives only the role that was stored.
- Public booking requests are written to Firestore. A pastor still confirms or declines only their own requests.

## Phase 7 – Availability and calendar

Status: complete

### Completed

- Each pastor’s working days, times, and blocked dates are stored in Firebase instead of a single hardcoded list.
- The public booking page shows a month calendar. Closed days and blocked dates cannot be requested, and only that pastor’s hours are offered.
- A pastor sets those hours on their dashboard. Saving writes the schedule, and Firestore rejects a request outside it.

## Phase 8 – Notifications

Status: complete

### Completed

- A new request writes a notification for that pastor and one for the church office.
- Confirming or declining writes an office notification.
- Each person dismisses a notification for themselves. A pastor does not see another pastor’s notices.

## Phase 9 – Reporting and audit logs

Status: complete

### Completed

- Church and pastor reports count pending, confirmed, and declined requests, and still show how many are scheduled today.
- A secretary or church administrator also sees those counts for each pastor.
- Each new request, confirmation, and decline is stored as an activity row. A pastor sees only their own rows.

## Phase 10 – Validation and deployment

Status: validation complete, deployment blocked on project access

### Completed

- Tests, lint, and the production build pass.
- Firebase Hosting is configured to serve the built app and send every address to `index.html`.
- The production web config is stored for Firebase project `etopade`. Local development still uses the emulators.

### Next work

- Sign the Firebase CLI into the Google account that owns `etopade`, or grant the current CLI account access. Then deploy Hosting, Auth, and Firestore rules to `etopade` only.

Local development uses the Firebase emulators under the project id `etopade-demo`. Prototype security rules are in `firestore.rules` and should be reviewed before the app is shared widely.
