# Titli MVP UI Testing

This walkthrough verifies the finite edition, local personalization, corrections, and editorial analytics without requiring a user account or external CMS.

## 1. Start the apps

Install, migrate, and optionally seed a fresh local database:

```bash
pnpm install
pnpm --filter web db:migrate
pnpm --filter web db:seed
```

Only run `db:seed` for a fresh development database. Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in `apps/web/.env`, then start the backend:

```bash
pnpm --filter web dev
```

Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to `http://<your-LAN-IP>:3000` for a phone, or `http://localhost:3000` for an emulator. Start Expo in another terminal:

```bash
pnpm --filter mobile start
```

Press `w` for the browser, or scan the QR code with Expo Go. If Expo's online dependency check is unavailable, use:

```bash
pnpm --filter mobile exec expo start --offline
```

## 2. First launch

Clear the app's local data before this test.

1. Confirm the promise, source-transparency, and topic-selection onboarding screens appear.
2. Confirm the final button stays disabled until three topics are selected.
3. Select at least three topics and enter Today without creating an account.
4. Confirm the first three cards retain the editor's order on this first session.

State and language are intentionally not requested yet. Titli should only ask once regional or translated content can use those answers.

## 3. Daily edition

1. Confirm Today contains seven cards and each card shows its position, role, source, and progress.
2. Open **Picked for you** and confirm the reason is plain language.
3. Tap **Less like this** on a non-mandatory card and confirm the message changes to “Your next edition will adjust.”
4. Save a card, share one, open a detail page, and open a source link.
5. Swipe through card seven and confirm the caught-up screen appears.
6. Leave before completion on a fresh edition, restart the app, and confirm it resumes on the same card with the same order.

## 4. Learned ranking

Behavior affects the next edition version, never the edition currently being read.

1. On one topic, save a card, open its detail/source, or dwell for at least eight seconds.
2. Quickly skip cards from a topic you want to reduce, or use **Less like this**.
3. Publish the next day's edition, or republish the local edition as a new version from `/admin/editions`.
4. Restart or refresh the mobile app.
5. Confirm positively weighted topics move earlier among flexible positions and reduced topics move later.
6. Confirm the Anchor remains first, Another Lens remains penultimate, the Lift remains last, and mandatory/high-distress cards do not move.
7. Open **Picked for you** and confirm reasons such as “Because you follow Work & Money” or “More on Health & Wellness, shaped by your reading.”

## 5. Corrections

1. Open `/admin`, edit a published card, and add a correction note and timestamp.
2. Save the card and republish the edition if needed.
3. Confirm **Corrected** appears on the reader card.
4. Open the detail view and confirm the correction note and date are visible above the headline.
5. Remove the correction note in admin and confirm its timestamp and reader notice are removed together.

## 6. Editorial analytics

Open `/admin/analytics` after generating reader activity.

1. Confirm completion counts each reader/edition once, even after multiple app opens.
2. Confirm median cards read, topic diversity, source diversity, and primary-source share are populated.
3. Confirm source cards and source-open counts appear by trust tier.
4. Confirm direct **Less like this** feedback is counted.
5. Confirm corrected edition cards appear in the correction log and link back to their detail pages.

## 7. Automated checks

Run these before release:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter mobile exec expo export --platform web
```

Expected result: all tests and type checks pass, the Next.js production build completes, and Expo exports its web bundle without an error.
