# Book Reads — Product Requirements

Oct 7, 2026 · @Divya Dhiman

## Overview

Book Reads is a multi-user reading tracker that turns a year of reading into a shareable, Spotify-Wrapped-style "Year in Books" and feeds content straight into a book channel. Users import their Goodreads history once, then track all new reading in the app.

**Target users**

- Readers moving off Goodreads who want better stats and a yearly wrap
- Bookstagram / BookTok / BookTube creators who need ready-to-post content
- Casual readers who want a reading goal and a simple log

**Product goals**

1. Import a full Goodreads history in under 2 minutes with no manual cleanup for most rows
2. Make logging a book or progress update take under 10 seconds on a phone
3. Produce a wrap that users want to share: every card is post-ready at Story and feed sizes
4. Build a community rating that replaces outside ratings as the user base grows

**Key decisions**

| Decision | Choice |
| --- | --- |
| Users | Multi-user, with accounts and public/private profiles |
| Devices | Web and phone: responsive PWA first, native app (Expo) later |
| Goodreads | One-time import of history; the app is the tracker afterwards |
| Stack | Next.js (App Router), Postgres, Satori / `@vercel/og` for card images |
| Ratings | Community ratings per work, with outside ratings as a fallback until a book has enough |

## Functional requirements

Eleven modules make up the product. IDs (IMP-1, TRK-3…) are referenced in the roadmap.

### 1. Accounts and profiles (ACC)

- ACC-1 Sign up / sign in with Google and email magic link (Auth.js)
- ACC-2 Profile: display name, username, avatar, bio, channel links (YouTube, Instagram, TikTok)
- ACC-3 Privacy per profile: public, followers only, private; per-book "hide from public" flag
- ACC-4 Account settings: yearly goal, default rating scale (half stars on/off), time zone
- ACC-5 Export all my data (CSV + JSON) and delete my account

### 2. Goodreads import (IMP)

- IMP-1 Upload the Goodreads CSV export, with a short how-to for getting the file
- IMP-2 Parse columns: Title, Author, Additional Authors, ISBN, ISBN13, My Rating, Average Rating, Number of Pages, Year Published, Original Publication Year, Date Read, Date Added, Bookshelves, Exclusive Shelf, My Review, Read Count
- IMP-3 Clean known quirks: `="..."`-wrapped ISBNs, empty Date Read, HTML in reviews, re-reads stored only as a count
- IMP-4 Map shelves: read → Read, currently-reading → Reading, to-read → Want to Read; custom shelves → tags (DNF detected by shelf name)
- IMP-5 Missing Date Read: user picks a rule (use Date Added / leave undated / set manually per book)
- IMP-6 Preview screen before committing: matched, needs review, failed, with counts
- IMP-7 Background job with a progress bar; user can leave the page and get notified when done
- IMP-8 Undo the whole import within 7 days
- IMP-9 Imported ratings count toward community ratings (seeds the rating system)

### 3. Catalog and metadata (CAT)

- CAT-1 Shared catalog of Works (the book) and Editions (a specific ISBN/format)
- CAT-2 Look up books in Open Library first, Google Books second, by ISBN then title + author
- CAT-3 Store cover, description, subjects/genres, page count, first published year, series and position, authors
- CAT-4 Normalise genres to a fixed list of about 40 so stats group cleanly
- CAT-5 Search the catalog by title, author or ISBN; add a missing book by hand
- CAT-6 Users can report or fix wrong metadata (cover, page count, edition); admin review queue
- CAT-7 Cache all outside lookups; respect API rate limits

### 4. Reading tracker (TRK)

- TRK-1 Statuses: Want to Read, Reading, Read, DNF, Paused
- TRK-2 Per read: start date, finish date, format (print / ebook / audio), edition, source (owned, library, ARC, gift, subscription)
- TRK-3 Progress updates in pages, percent or audio minutes, each with a timestamp and optional note
- TRK-4 Re-reads: each read is its own record with its own dates and rating
- TRK-5 Rating (0.5–5, half stars), written review, private notes, favourite quotes with page number
- TRK-6 Custom tags and shelves; mark a book as favourite
- TRK-7 Yearly reading goal with pace indicator ("3 books ahead")
- TRK-8 Library view: filter by status, year, genre, rating, format, tag; sort and search
- TRK-9 Quick log from the home screen: "update progress" and "finish book" in two taps
- TRK-10 Barcode scan to add a book (phone camera)

### 5. Ratings and reviews (RAT)

- RAT-1 One rating per user per work (per read for re-reads; the latest counts toward the community score)
- RAT-2 Community score per work using a Bayesian average (see Ratings system)
- RAT-3 Rating distribution bars (5★ to 1★) and counts of ratings and reviews
- RAT-4 Outside rating shown with its source until the community score is trusted
- RAT-5 Reviews: spoiler tag, like, comment, report
- RAT-6 "You vs. everyone": your rating beside the community score

### 6. Reading stats (STA)

- STA-1 Volume: books and pages per year and month, average length, longest and shortest
- STA-2 Pace: average days per book, fastest read, streaks, busiest month, a calendar heatmap
- STA-3 Taste: rating distribution, average rating, top genres, top authors, new vs. repeat authors, series progress
- STA-4 Mix: format split, fiction vs. non-fiction, publication decade, owned vs. borrowed
- STA-5 Hot takes: books where your rating differs most from the community
- STA-6 Year-over-year comparison and all-time stats
- STA-7 Stats filterable by year and date range

### 7. Year in Books wrap (WRP)

- WRP-1 Story-style card sequence, tap or swipe through, one stat per card
- WRP-2 Cards: total books + pages, top genre, reader personality, top author, top-rated book, hot take, fastest read, longest read, busiest month, goal result, cover collage, summary
- WRP-3 Reader personality: rule-based archetypes from genre mix, pace and rating habits (e.g. "The Thriller Binger", "The Generous Rater")
- WRP-4 Wrap for any past year, plus a "year so far" wrap from July onwards
- WRP-5 Wrap release moment: available from 1 December, with a notification
- WRP-6 Three to five colour themes; optional palette taken from the user's top cover
- WRP-7 Monthly mini-wrap (books finished, pages, favourite of the month)

### 8. Share cards and export (SHR)

- SHR-1 Render every card to PNG on the server (Satori)
- SHR-2 Sizes: 9:16 1080×1920 (Stories, Reels, Shorts, TikTok), 4:5 1080×1350 and 1:1 1080×1080 (feed), 16:9 1920×1080 (YouTube)
- SHR-3 Download one card or all cards as a zip
- SHR-4 Phone: share directly with the Web Share API (Instagram, WhatsApp, etc.)
- SHR-5 Public wrap page at `/u/<username>/wrap/<year>` with Open Graph preview images
- SHR-6 Hide chosen books or stats before sharing
- SHR-7 MP4 slideshow export of the wrap (later version)

### 9. Channel content tools (CH)

- CH-1 Caption and script generator for the wrap, monthly wrap-ups and top-N lists
- CH-2 Hashtag suggestions and a YouTube description with the book list
- CH-3 Content cards: currently reading, TBR, top 5, quote card, single-book review card
- CH-4 Affiliate link fields per book (Bookshop.org, Amazon), included in descriptions
- CH-5 Embeddable widget: currently reading and recent reads for link-in-bio or a website
- CH-6 Direct posting or scheduling to YouTube / Instagram (later version)

### 10. Social (SOC)

- SOC-1 Follow other readers; followers and following lists
- SOC-2 Activity feed: started, finished, rated, reviewed
- SOC-3 See friends' ratings on a book page
- SOC-4 Reading challenges and buddy reads (later version)
- SOC-5 Block and report users

### 11. Platform and admin (PLT)

- PLT-1 Installable PWA with offline progress logging that syncs later
- PLT-2 Notifications: import done, wrap ready, goal milestones (email + web push)
- PLT-3 Admin: metadata fix queue, reported reviews and users, import job monitor
- PLT-4 Product analytics on key funnels (import, first log, wrap share)

## Ratings system

Ratings are stored per work and shown as a weighted community score once a book has 10 or more ratings; before that, an outside rating is shown with its source.

**Why per work:** all editions of a book (hardcover, paperback, ebook, audio) share one score, as on Goodreads. Editions are grouped by their Open Library work ID.

**Community score (Bayesian average)** — pulls books with few ratings toward the site mean so one 5★ cannot top the charts:

```latex
\text{score} = \frac{C \cdot m + \sum r_i}{C + n}
```

`m` = site-wide mean rating, `C` = confidence threshold (start at 10), `n` = the book's rating count, `r_i` = each rating. Stored in `work_rating_stats` and updated on every rating write.

**Outside rating sources (fallback)**

| Source | Data | Notes |
| --- | --- | --- |
| Goodreads CSV | Average Rating column | Free, one-time snapshot, imported books only |
| Hardcover.app API | Average + count | Free GraphQL API with token; closest to Goodreads coverage |
| Open Library | `/works/{id}/ratings.json` | Open and free, smaller sample |
| Google Books | `averageRating`, `ratingsCount` | Missing for many titles |

Goodreads is not scraped: it breaks their terms of service.

**Display rule**

1. Community count ≥ 10 → show community score, count and distribution
2. Otherwise → show the outside rating labelled with its source ("4.1 · via Hardcover") plus "Be one of the first to rate this"
3. Always show the viewer's own rating and friends' ratings if any

**Integrity:** one rating per user per work, edits replace the old value, rate limits on new accounts, reported reviews go to the admin queue. A nightly job refreshes outside ratings for recently viewed works.

## Non-functional requirements

| Area | Requirement |
| --- | --- |
| Performance | Pages load in under 2 s on 4G; a share card renders in under 1.5 s; a 1,000-row import finishes in under 2 min |
| Mobile | Every screen works at 360 px width; touch targets ≥ 44 px; installable PWA |
| Offline | Progress updates and finishes queue offline and sync when back online |
| Scale | Design for 10k users and 1M user-book rows in year one without re-architecture |
| Privacy | Private profiles and hidden books never appear on public pages, share links or feeds; uploads (CSV) deleted after import |
| Security | Auth via Auth.js sessions; row-level ownership checks on every write; rate limits on auth, import and rating endpoints |
| Data rights | Full export (CSV/JSON) and account deletion; GDPR-style consent for emails |
| Accessibility | WCAG 2.1 AA: contrast, keyboard navigation, alt text on cards (stat in words) |
| Reliability | Imports and card rendering run as retryable background jobs; daily Postgres backups |
| Legal | Use only official APIs for metadata and ratings; cover images used per provider terms; no Goodreads scraping |
| Observability | Error tracking (Sentry), job dashboards, analytics on the import → first log → wrap share funnel |

## Version roadmap

Four versions. The MVP proves the core loop (import → stats → shareable wrap); each later version is gated by the exit criteria below it.

### MVP (v0.1) — Import and wrap

Goal: a Goodreads user can sign up, import, and share a wrap.

| Module | Features |
| --- | --- |
| Accounts | ACC-1 sign-in, ACC-2 basic profile, ACC-3 public/private |
| Import | IMP-1 to IMP-7 (upload, parse, clean, shelves, missing dates, preview, background job) |
| Catalog | CAT-1 to CAT-3, CAT-7 (Open Library + Google Books enrichment, caching) |
| Tracker | TRK-1, TRK-2, TRK-5 (statuses, dates, rating and review), TRK-8 library view |
| Stats | STA-1, STA-3, STA-7 (volume, taste, year filter) |
| Wrap | WRP-1, WRP-2 (core cards), WRP-4 past years |
| Share | SHR-1, SHR-2 (9:16 and 1:1), SHR-3 download |

Exit criteria: 20 test users import successfully with ≥ 90% of books matched; wrap renders for every imported year.

### v1 — Daily tracker

Goal: users log new reading in the app instead of Goodreads.

| Module | Features |
| --- | --- |
| Tracker | TRK-3 progress updates, TRK-4 re-reads, TRK-6 tags, TRK-7 goal, TRK-9 quick log |
| Catalog | CAT-4 genre normalisation, CAT-5 search + manual add, CAT-6 metadata fixes |
| Ratings | RAT-1 to RAT-4 (community score, distribution, outside fallback), IMP-9 seed from imports |
| Stats | STA-2 pace + heatmap, STA-4 mix, STA-5 hot takes, STA-6 year over year |
| Wrap | WRP-3 reader personality, WRP-6 themes, WRP-7 monthly mini-wrap |
| Share | SHR-2 all sizes, SHR-4 Web Share, SHR-5 public wrap page, SHR-6 hide books |
| Accounts | ACC-4 settings, ACC-5 export + delete, IMP-8 undo import |
| Platform | PLT-1 PWA + offline, PLT-2 notifications |

Exit criteria: 50% of imported users log at least one new book within 30 days.

### v2 — Creator tools and social

Goal: the app produces channel content and grows through sharing.

| Module | Features |
| --- | --- |
| Channel | CH-1 captions + scripts, CH-2 hashtags + descriptions, CH-3 content cards, CH-4 affiliate links |
| Social | SOC-1 follow, SOC-2 activity feed, SOC-3 friends' ratings, SOC-5 block/report |
| Ratings | RAT-5 review likes/comments/spoilers, RAT-6 you vs. everyone |
| Wrap | WRP-5 December wrap release with notification |
| Tracker | TRK-10 barcode scan |
| Platform | PLT-3 admin tools, PLT-4 analytics |

Exit criteria: 25% of wraps are shared or downloaded; community scores cover the top 1,000 works.

### v3 — Video and distribution

Goal: one-tap publishing to the channel.

| Module | Features |
| --- | --- |
| Share | SHR-7 MP4 wrap slideshow (Puppeteer or Remotion) |
| Channel | CH-5 embeddable widget, CH-6 direct posting / scheduling to YouTube and Instagram |
| Social | SOC-4 challenges and buddy reads |
| Platform | Native app (Expo) if PWA limits show up (push on iOS, camera, widgets) |

## Tech architecture and data model

One Next.js app handles UI, API and card rendering; slow work runs as background jobs so pages never wait on outside APIs.

&#91;embedded content: system architecture · 9 parts\]

Imports, metadata lookups and rating refreshes go through the job queue; the card renderer writes PNGs to storage and returns a share link.

**Stack**

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router), TypeScript |
| UI | Tailwind CSS + shadcn/ui; Recharts for stats charts |
| Database | Postgres (Neon or Supabase) with Drizzle ORM |
| Auth | Auth.js: Google + email magic link |
| Background jobs | Inngest or Trigger.dev (works on Vercel) |
| Storage | S3-compatible (Cloudflare R2) |
| Card images | Satori / `@vercel/og`; Remotion or Puppeteer for v3 video |
| Hosting | Vercel |
| Monitoring | Sentry (errors), PostHog (analytics) |

**Data model**

| Table | Key fields | Purpose |
| --- | --- | --- |
| users | id, email, username, name, avatar, privacy, timezone | Accounts and profiles |
| works | id, ol\_work\_id, title, description, first\_published, genres\[\], series, series\_pos | One row per book, shared by all editions |
| editions | id, work\_id, isbn13, format, pages, cover\_url, publisher | A specific printing / format |
| authors, work\_authors | id, name, ol\_author\_id | Many-to-many authors |
| user\_books | user\_id, work\_id, status, favourite, tags\[\] | A user's relationship to a book |
| reads | id, user\_book\_id, edition\_id, started\_at, finished\_at, format, source, rating, review | One row per read (re-reads = more rows) |
| progress\_updates | read\_id, value, unit, note, created\_at | Progress log |
| quotes | user\_book\_id, text, page | Saved quotes |
| goals | user\_id, year, target | Yearly goal |
| work\_rating\_stats | work\_id, count, sum, dist\_1…dist\_5, bayes\_score | Cached community rating |
| external\_ratings | work\_id, source, avg, count, fetched\_at | Outside fallback ratings |
| imports, import\_rows | user\_id, status, counts / raw row, match result | Import job and review screen; enables undo |
| follows, activities | follower\_id, followee\_id / user\_id, type, work\_id | Social graph and feed |
| wraps | user\_id, year, stats\_json, theme, card\_urls\[\] | Cached wrap per user per year |

## Open questions and risks

**Open questions**

- [ ] App name and brand (affects card design and share URLs)
- [ ] Which channel platforms come first for content tools: Instagram, YouTube or TikTok?
- [ ] Free vs. paid: is anything premium (themes, video export, advanced stats)?
- [ ] Hosting: Vercel + managed Postgres (Neon / Supabase), or one provider for all?
- [ ] Is Hardcover's API terms-compatible with a public multi-user app at our scale?

**Risks**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Poor metadata matches on import | Wrong covers and genres ruin the wrap | Two-source lookup, review screen, user fixes (CAT-6) |
| Missing Date Read in Goodreads exports | Books land in the wrong year | Explicit rule choice at import (IMP-5), bulk date editing |
| Few community ratings early on | Ratings look empty | Seed from imported ratings (IMP-9), outside fallback (RAT-4) |
| Outside API limits or shutdowns | Enrichment stalls | Caching, multiple sources, background retry |
| Cover image licensing | Takedown requests | Use provider-hosted covers per their terms; allow user uploads |
| iOS PWA limits (push, camera) | Weaker phone experience | Plan Expo native app in v3 |
| Wrap only matters in December | Low engagement rest of year | Monthly mini-wraps, year-so-far wrap, content tools |
