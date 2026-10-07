# Shelfie

A reading tracker with a "Year in Books" wrap: import your Goodreads history, track new reads, see your stats, and share Instagram-ready cards.

Product requirements and the version roadmap live in [docs/requirements.md](docs/requirements.md).

## Stack

- [Next.js](https://nextjs.org) (App Router, Turbopack)
- [Once UI](https://docs.once-ui.com) (`@once-ui-system/core`) for layout, components and theming
- Postgres + [Drizzle ORM](https://orm.drizzle.team)
- [Auth.js](https://authjs.dev) (NextAuth v5): email magic links + Google
- Planned: Satori for share cards (see the requirements doc)

## Getting started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL`: a Postgres connection string (Neon or Supabase, pooled URL)
   - `AUTH_SECRET`: generate with `npx auth secret`
   - Optional: `AUTH_RESEND_KEY` for real magic-link emails, `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` for Google sign-in
3. Create the tables: `npm run db:migrate`
4. Start the app: `npm run dev` and open http://localhost:3000

In development without `AUTH_RESEND_KEY`, the sign-in link is printed in the dev server log instead of emailed.

## Deploying (Vercel + Neon)

1. Create a Postgres database on [Neon](https://neon.tech) and copy the **pooled** connection string.
2. Create the tables from your machine: put that string in `.env.local` as `DATABASE_URL`, then `npm run db:migrate`.
3. Import the GitHub repo in [Vercel](https://vercel.com/new) and set these environment variables:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled connection string |
   | `AUTH_SECRET` | a new secret from `npx auth secret` (don't reuse your local one) |
   | `AUTH_RESEND_KEY` | Resend API key, for magic-link emails |
   | `AUTH_EMAIL_FROM` | e.g. `Shelfie <login@yourdomain.com>`; until a domain is verified in Resend, only `onboarding@resend.dev` works and it only delivers to your own Resend account email |
   | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | optional; add `https://<your-domain>/api/auth/callback/google` as a redirect URI |

4. Deploy. Run `npm run db:migrate` against the production database whenever a change adds a migration in `drizzle/`.

## Database

Schema lives in [src/db/schema.ts](src/db/schema.ts) (Drizzle ORM, Postgres). After changing it:

```bash
npm run db:generate   # writes a new SQL migration to drizzle/
npm run db:migrate    # applies pending migrations
npm run db:studio     # browse data
```

## Goodreads import

`/import` takes a Goodreads library export (sample: [docs/samples/goodreads_library_export.csv](docs/samples/goodreads_library_export.csv)):

1. **Upload**: the CSV is parsed ([src/lib/goodreads](src/lib/goodreads)) and every row stored in `import_rows`.
2. **Match**: the browser asks the server to process rows in small batches; each is looked up on Open Library by ISBN, then title + author ([src/lib/catalog/openlibrary.ts](src/lib/catalog/openlibrary.ts)). Leaving the page pauses it; coming back resumes.
3. **Review**: counts, unmatched rows, and a choice for read books without a "date read".
4. **Save**: creates `user_books` and `reads` (re-reads become extra reads); books already in the library are skipped.

Logic lives in [src/lib/import/service.ts](src/lib/import/service.ts). Run the parser and genre tests with `npm test`.

Genres come from Open Library subjects plus readers' shelves, mapped by [src/lib/catalog/genres.ts](src/lib/catalog/genres.ts). After changing the mapping, recompute the catalog:

```bash
npm run catalog:genres -- --dry   # preview changes
npm run catalog:genres            # apply
```

## Year Shelfie (wrap) and share cards

`/wrap` shows a year as story cards (tap, swipe or arrow keys). Each card is a PNG rendered on the server with Satori (`next/og`):

- `GET /api/wrap/:year/:card?size=story|portrait|square` → one card (`&download=1` to save it)
- `GET /api/wrap/:year/zip?size=…` → every card in a zip

Cards are built from the year's reads in [src/lib/wrap/build.ts](src/lib/wrap/build.ts) and drawn in [src/lib/wrap/render.tsx](src/lib/wrap/render.tsx). Books marked hidden never appear on cards. Card fonts come from `@fontsource/fraunces` and `@fontsource/geist`.

## Auth

Auth.js v5 ([src/auth.ts](src/auth.ts)) with database sessions: email magic links (Resend) and Google. Library, Import, Stats and Wrap call `requireUser()` from [src/lib/session.ts](src/lib/session.ts) and redirect to `/signin` when signed out.

## Project layout

```
src/
  app/(main)/          routes: / (landing), /library, /import, /stats, /wrap
  components/shell/    header, phone bottom nav, page placeholder
  components/Providers.tsx   Once UI theme, data-viz, toast and icon providers
  resources/
    once-ui.config.js  theme (brand orange, accent violet, sand neutrals) and fonts (Fraunces + Geist)
    icons.ts           custom icons, registered for type-checked <Icon name>
    seo.js             site URL and per-page metadata
    custom.css         CSS variable overrides
```

`AGENTS.md` holds Once UI's conventions for building UI (use `Row`/`Column`/`Grid` instead of `div`, token props instead of hex colors).

Built from the [Once UI Next.js starter](https://github.com/once-ui-system/nextjs-starter) (MIT, see `LICENSE.once-ui`).
