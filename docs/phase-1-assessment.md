# Phase 1 technical assessment

## Summary

The workspace currently does not contain the prototype files `pastor-booking.html` or `schema.sql` referenced in the project brief. Because those files are absent, there is no direct legacy implementation to preserve or migrate. The project therefore starts from a clean architecture while preserving the requested domain model, public-booking pattern, and Supabase-first security approach.

## Technical assessment

### Current state

- No booking UI prototype was found in the current workspace.
- No SQL migration or schema file was found.
- The project has been initialized as a React + TypeScript + Vite application to support a phased build.

### Risks and issues to address

1. Security-first design is mandatory; frontend-only filtering is not acceptable.
2. Duplicate appointment prevention must be enforced by database transactions or edge functions.
3. Availability must be configurable and stored in the database rather than hardcoded in JavaScript.
4. Multi-organisation isolation must be enforced at the database and role levels.
5. Public visitors must be able to submit bookings without reading private records.

### Planned implementation approach

- Create a modular React application with a clear public booking interface and future dashboard routes.
- Use Supabase as the managed backend and security boundary.
- Build a normalised PostgreSQL schema with organisations, branches, pastors, profiles, schedules, blocked dates, bookings, notifications, and audit logs.
- Separate public booking logic from internal admin operations.
- Introduce strict RBAC and policy enforcement before any production deployment.

## Phase roadmap

1. Phase 1 – Audit and project setup
2. Phase 2 – Database schema, migrations, and RLS
3. Phase 3 – Authentication and RBAC
4. Phase 4 – Public booking portal
5. Phase 5 – Pastor dashboard
6. Phase 6 – Administrator dashboard
7. Phase 7 – Availability and calendar
8. Phase 8 – Notifications
9. Phase 9 – Reporting and audit logs
10. Phase 10 – Validation and deployment

## Implementation principles

- Preserve useful booking logic where it exists, but do not carry forward insecure or hardcoded assumptions.
- Keep modules reusable and simple.
- Ensure all sensitive actions are validated in the backend.
- Prefer clear design tokens and responsive UI patterns over template-heavy implementations.
