# Bite-Size Feed

A swipe-through feed of real Indian gender data and feminism news — a mobile app (Expo) and a website (Next.js), sharing one self-hosted backend (no third-party CMS account required).

## Stack

| Layer | Choice |
|---|---|
| Mobile | React Native + Expo (SDK 54), TypeScript |
| Website | Next.js 16 (App Router), TypeScript, Tailwind v4 |
| Backend | SQLite (via Drizzle ORM) + Next.js API routes, all inside `apps/web` |
| Admin | A password-protected `/admin` section in the website itself |
| Monorepo | pnpm workspaces + Turborepo |

There is no external CMS, database service, or account of any kind to sign up for — everything runs from a local SQLite file and local image uploads.

## Project structure

```
apps/
  web/      Next.js site — public pages, the JSON API, and the admin editor
  mobile/   Expo app — reads the same API over HTTP
packages/
  tokens/       Shared design tokens (colors, type, spacing) — Tailwind preset for both apps
  utils/        Shared pure logic (trend computation, word counting, date formatting)
  api-client/   Shared TypeScript types + an HTTP client apps/mobile (and the admin UI) use
```

`apps/web`'s own Server Components talk to the database directly (`apps/web/lib/db/queries.ts`); the JSON API routes under `apps/web/app/api/` exist for `apps/mobile` and the admin UI's client-side calls.

## First-time setup

```bash
pnpm install

cd apps/web
cp .env.example .env
# Edit .env: set ADMIN_PASSWORD, and ADMIN_SESSION_SECRET (generate with
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

pnpm run db:migrate     # creates apps/web/data/bitefeed.db
pnpm run db:seed        # optional — populates sample cards to try the app with

cd ../..
pnpm --filter web dev   # http://localhost:3000
```

Visit `/admin/login` to sign in and write cards. Visit `/` to see the reading feed.

## Production deployment (Render)

The repository includes a `render.yaml` Blueprint for a paid Render web
service with a 1 GB persistent disk. The disk stores both the SQLite database
and uploaded images under `/var/data`; the startup command runs migrations
before starting Next.js.

1. In Render, create a new Blueprint and connect this GitHub repository.
2. Enter `NEXT_PUBLIC_SITE_URL` and a strong `ADMIN_PASSWORD` when prompted.
   Render generates `ADMIN_SESSION_SECRET` automatically.
3. Deploy, then visit `/api/health` and confirm it returns `{ "status": "ok" }`.
4. Visit `/admin/login` and publish the first production cards.

The initial `onrender.com` URL is enough to launch. When a custom domain is
connected, update `NEXT_PUBLIC_SITE_URL` to its final `https://` URL and
redeploy so metadata, sitemap entries, and sharing URLs use it.

### Running the mobile app

```bash
cd apps/mobile
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your machine's LAN IP (shown by `expo start`
# as "Network:", and by the Next.js dev server the same way) — not
# localhost, since the phone/simulator is a separate device on the network.

pnpm start
```

Sign in to Expo CLI and Expo Go with the same account for phone testing. If Expo's
account service is unavailable, `pnpm start:offline` remains available as a local
fallback.

For the full reader, personalization, correction, and analytics walkthrough, see
[`docs/mvp-ui-testing.md`](docs/mvp-ui-testing.md).

## Quality checks

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter mobile exec expo export --platform web
```

## Deployment note: this needs a persistent disk

The SQLite database and uploaded images are plain files on disk. Locally they
default to `apps/web/data/bitefeed.db` and `apps/web/public/uploads/`. In
production, `STORAGE_ROOT` keeps both under one mounted persistent directory.
This **cannot** be deployed to a plain serverless platform (e.g. Vercel's
standard functions), since those don't persist filesystem writes between
requests.

What does work:
- A small persistent VPS (Railway, Render, Fly.io, a DigitalOcean droplet, your own server) running `pnpm build && pnpm start`, with `STORAGE_ROOT` on a persistent volume.
- A Docker container with `STORAGE_ROOT` on a mounted volume.

If you'd rather deploy to serverless hosting later, that's a config change, not a rewrite: swap `apps/web/lib/db/client.ts` to a hosted Postgres/SQLite-compatible service (e.g. Turso, Neon) and `apps/web/lib/images.ts` to an object storage bucket (e.g. S3-compatible storage) — the rest of the app (queries, API routes, both frontends) doesn't need to change, since they only go through those two files.

## Editorial workflow

1. At 05:30 IST, the authenticated morning job refreshes RSS candidates and creates today's draft edition if needed.
2. Sign in at `/admin`, review the inbox, write and verify cards, then open `/admin/editions`.
3. Fill the seven edition roles. The composer blocks duplicates and warns about source concentration, low topic diversity, adjacent high-distress stories, and weak data placement.
4. Choose **Approve for 07:00 IST** or **Publish now**. The scheduled publisher releases the edition atomically at 07:00 IST.
5. Mobile reads the finite edition from `/api/editions/today`, resumes at the last card, and shows a caught-up state after card seven.

When an editor drafts an RSS candidate, Titli uses the feed image first, then the article's Open Graph image, and finally creates a deterministic branded editorial illustration. Every result is optimized to WebP and stored once on the persistent volume.

Render runs the morning and publishing jobs in UTC (`00:00` and `01:30`, respectively). Both call the persistent web service over authenticated internal endpoints, so the cron processes do not need direct access to the SQLite volume.
