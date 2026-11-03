# ETOPADE

ETOPADE is a pastoral appointment management platform for churches, pastors, and ministry teams.

## Overview

This project is being built in phased increments to support a public booking portal, pastor dashboards, administration tools, notification workflows, reporting, and secure multi-organisation architecture.

## Stack

- React + TypeScript + Vite
- Supabase PostgreSQL
- Supabase Authentication
- Supabase Row Level Security
- Supabase Edge Functions
- Plain CSS, responsive design, no Tailwind

## Current phase

Phase 4 is complete. Public booking requests are stored as pending rows, and staff reports read those rows. The schema and migrations remain under `supabase/migrations`.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Supabase setup

1. Create a Supabase project.
2. Run the migration files in `supabase/migrations` in order.
3. Apply the seed helper in `supabase/migrations/20261103091000_rls_and_seed.sql` as part of the migration chain.
4. Configure environment variables for the frontend and Edge Functions.

## Security notes

- Never expose service role keys in frontend code.
- Require backend-side validation and RLS policies.
- Validate availability in database transactions to prevent double booking.
- Use notifications through secure backend functions.

## Project phases

1. Phase 1: audit and project initialization
2. Phase 2: schema and RLS design
3. Phase 3: authentication and RBAC
4. Phase 4: public booking portal
5. Phase 5: pastor dashboard
6. Phase 6: administrator dashboard
7. Phase 7: availability and calendar
8. Phase 8: notifications
9. Phase 9: reporting and audit logs
10. Phase 10: validation and deployment

See [IMPLEMENTATION_PROGRESS.md](./IMPLEMENTATION_PROGRESS.md) for the active status.
