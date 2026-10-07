# Shelfie

A reading tracker with a "Year in Books" wrap: import your Goodreads history, track new reads, see your stats, and share Instagram-ready cards.

Product requirements and the version roadmap live in [docs/requirements.md](docs/requirements.md).

## Stack

- [Next.js](https://nextjs.org) (App Router, Turbopack)
- [Once UI](https://docs.once-ui.com) (`@once-ui-system/core`) for layout, components and theming
- Planned: Postgres + Drizzle, Auth.js, Satori for share cards (see the requirements doc)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

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
