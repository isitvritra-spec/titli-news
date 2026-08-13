# Bite-Size Feed

A swipe-through feed of real Indian gender data and feminism news — a mobile app (Expo) and a website (Next.js), sharing one self-hosted backend (no third-party CMS account required).

## Stack

| Layer | Choice |
|---|---|
| Mobile | React Native + Expo (SDK 57), TypeScript |
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

### Running the mobile app

```bash
cd apps/mobile
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your machine's LAN IP (shown by `expo start`
# as "Network:", and by the Next.js dev server the same way) — not
# localhost, since the phone/simulator is a separate device on the network.

pnpm start
```

## Deployment note: this needs a persistent disk

The SQLite database (`apps/web/data/bitefeed.db`) and uploaded images (`apps/web/public/uploads/`) are plain files on disk. That's the whole point of the self-hosted, no-external-account design — but it means this **cannot** be deployed to a plain serverless platform (e.g. Vercel's standard functions), since those don't persist filesystem writes between requests.

What does work:
- A small persistent VPS (Railway, Render, Fly.io, a DigitalOcean droplet, your own server) running `pnpm build && pnpm start`, with `apps/web/data/` and `apps/web/public/uploads/` on a persistent volume.
- A Docker container with a mounted volume for those two paths.

If you'd rather deploy to serverless hosting later, that's a config change, not a rewrite: swap `apps/web/lib/db/client.ts` to a hosted Postgres/SQLite-compatible service (e.g. Turso, Neon) and `apps/web/lib/images.ts` to an object storage bucket (e.g. S3-compatible storage) — the rest of the app (queries, API routes, both frontends) doesn't need to change, since they only go through those two files.

## Editorial workflow

1. Read the source RSS feeds / government data releases yourself (no in-app aggregator — that's intentionally out of scope, see the original brief).
2. Sign in at `/admin`, write the card (the word counter enforces the ~60-word target; provenance fields are required before you can publish).
3. Publish. The website updates within seconds (the admin API calls `revalidatePath` on every write); the mobile app picks it up on next foreground/pull-to-refresh.
