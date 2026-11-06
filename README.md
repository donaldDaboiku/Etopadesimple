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

Phase 10 validation is complete. Tests, lint, and the production build pass, and Hosting is set up for the single-page app. The app is not deployed. Local development uses the Firebase emulators. A dedicated Firebase project is required before deploy. The signed-in Google account’s existing Firebase project is a different app, so ETOPADE is not deployed there.

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

Run the app with `npm run dev` in a second terminal. The emulators use the local project id `etopade-demo`. To use a dedicated cloud project later, set `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`.

## Production build

```bash
npm run build
npm run preview
```

Vite reads the Firebase web config at build time. A build without `VITE_FIREBASE_PROJECT_ID` keeps talking to the local emulators, so it is not a cloud deploy.

## Deploy

Copy `.env.example` to `.env` and fill in the web config for a dedicated Firebase project. Then build and deploy Hosting and the Firestore rules to that project:

```bash
npm run build
npx -y firebase-tools@latest deploy --only hosting,firestore:rules --project <project-id>
```

Do not deploy to `etopade-demo`. That id exists only for the emulators. After the first deploy, enable Google sign-in for the project and add the Hosting domain to the authorized domains.

## Security notes

- Never expose a Firebase admin credential in frontend code.
- The prototype security rules in `firestore.rules` need review before the app is shared widely.
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
