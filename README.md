# ETOPADE

ETOPADE is a pastoral appointment management platform for churches, pastors, and ministry teams.

## Overview

This project is being built in phased increments to support a public booking portal, pastor dashboards, administration tools, notification workflows, reporting, and secure multi-organisation architecture.

## Stack

- React + TypeScript + Vite
- Firebase Authentication
- Cloud Firestore
- Firebase Security Rules
- Plain CSS, responsive design, no Tailwind

## Current phase

Phase 10 is deployed to Firebase project `etopade` at https://etopade.web.app. The website does not contain a super admin password. Local development still uses the emulators. The first cloud super admin is created with `npm run bootstrap` after you add a service account for `etopade`.

## Local development

```bash
npm install
npm run dev
```

## Firebase emulators

```bash
npm run emulators
npm run seed
```

Run the app with `npm run dev` in a second terminal. The emulators use the local project id `etopade-demo`. The seed creates the local super admin `superadmin@etopade.local` with password `etopade-admin`. That password is for the emulator only.

## Production build

```bash
npm run build
npm run preview
```

Vite reads the Firebase web config at build time. A build without `VITE_FIREBASE_PROJECT_ID` keeps talking to the local emulators, so it is not a cloud deploy.

## Deploy

The production values live in `.env.production.local`, which is not committed. Local `npm run dev` does not load that file, so it stays on the emulators. Sign the CLI into the Google account that owns `etopade`, then build and deploy only that project:

```bash
npx -y firebase-tools@latest login:add donalddaboiku@gmail.com
npm run build
npx -y firebase-tools@latest deploy --only hosting,firestore:rules,auth --project etopade
```

Create the first super admin after Auth and Firestore are deployed. Use a real email and a password that is not committed:

```bash
$env:SUPER_ADMIN_EMAIL = 'you@example.com'
$env:SUPER_ADMIN_PASSWORD = 'a-private-password'
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\path\to\etopade-admin.json'
npm run bootstrap
```

`GOOGLE_APPLICATION_CREDENTIALS` is a Firebase service account JSON for `etopade`. The script refuses `etopade-demo` and any other project. It creates the Auth user and the super admin directory row when they are missing, and it does not print the password.

Do not deploy to `etopade-demo` or to any other Firebase project. `etopade-demo` exists only for the emulators.

## Security notes

- Never expose a Firebase admin credential or the super admin password in frontend code.
- A signed-in person cannot create their own super admin record. The first super admin is created by `npm run bootstrap`.
- A public visitor can create a pending booking and can read pastor names, taken times, and each pastor’s open days. Visitor details stay on the booking document.
- A pastor can read and update only their own bookings.
- Notifications are not public. A pastor reads notices for their own requests. A secretary or church administrator reads the church office notices.
- Activity rows are not public. A pastor reads activity for their own requests. A secretary or church administrator reads the church activity. Visitor email is not stored on an activity row.

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
