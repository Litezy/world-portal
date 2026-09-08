# World Portal

Single-page site for a travel & visa agency, built to a supplied video
reference. Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4,
GSAP + Three.js.

Brand colour is **#fccc2e**. Cards and buttons use a water-glass treatment —
blurred, saturated backdrop, a specular top edge, and stacked shadows for a
slight 3D lift.

## The three services

The page sells three things, each with its own section and its own CTA:

| Section                 | Sells                 | Covers                      |
| ----------------------- | --------------------- | --------------------------- |
| **Visas**               | comfort and ease      | eVisa · Consular Visa · ETA |
| **Flights & Hotels**    | speed and reliability | quotes in hours, held fares |
| **Experiences & Tours** | curation and quality  | packages, guides, access    |

**How It Works** sits between them and describes the one process behind all
three. **Contact** routes on which service you pick.

## The hero

Two columns over the hero photograph: the pitch on the left — badge, two-tone
heading, lead paragraph and the two CTAs — with a destination forecast card at
the bottom right. The photograph carries a displacement shader; nothing else in
the hero is WebGL.

**That card is placeholder copy, not a weather feed.** It reads from
`hero.forecast` in `src/content/landing.ts` — there is no weather API here and
the numbers never refresh. Reword it like any other line on the page.

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

| Route                 | What it is                                         |
| --------------------- | -------------------------------------------------- |
| `/`                   | The landing page — every section, in reading order |
| `/apply`              | The visa application form                          |
| `/track`              | Track an application by reference                  |
| `/start`              | Trip planner — origin, destination, what you hold  |
| `/passport`           | Passport enquiry                                   |
| `/hire`               | Hire a pro at your destination                     |
| `/admin/login`        | Console sign-in                                    |
| `/admin`              | Dashboard — KPIs, activity, pipeline               |
| `/admin/enquiries`    | Enquiry list and detail                            |
| `/admin/applications` | Visa application list, detail and stage timeline   |
| `/admin/customers`    | Customer list                                      |
| `/admin/settings`     | Profile, notifications, sign out                   |

Sign in with an email that has an active Profile on the backend — its
`prisma/seed.ts` creates `manager@loveworld.com` — and the console password
from `.env.example`. Both defaults are **refused in production**: set
`ADMIN_PASSWORD` and `SESSION_SECRET` before deploying or the build fails.

## Scripts

| Command          | What it does                                         |
| ---------------- | ---------------------------------------------------- |
| `pnpm dev`       | Dev server (Turbopack)                               |
| `pnpm build`     | Production build                                     |
| `pnpm start`     | Serve the production build                           |
| `pnpm typecheck` | Regenerate route types, then `tsc --noEmit`          |
| `pnpm lint`      | ESLint (`lint:fix` to autofix)                       |
| `pnpm format`    | Prettier write (`format:check` to verify)            |
| `pnpm test`      | Vitest unit tests (`test:watch`, `test:coverage`)    |
| `pnpm test:e2e`  | Playwright end-to-end (`test:e2e:ui` for the runner) |
| `pnpm validate`  | typecheck + lint + format check + tests              |

First Playwright run on a fresh machine needs browsers:
`pnpm exec playwright install`.

## Project structure

```
src/
├─ app/
│  ├─ (site)/             # The page — shares the header/footer layout
│  ├─ (app)/              # Standalone pages — apply, start, passport, hire
│  ├─ (admin)/            # The console — login + the signed-in shell
│  ├─ api/                # Route handlers (booking, health, admin)
│  ├─ layout.tsx          # Root layout: fonts, metadata, providers
│  ├─ opengraph-image.tsx # Dynamically generated OG card
│  ├─ error.tsx           # Error boundary
│  ├─ not-found.tsx       # 404
│  ├─ sitemap.ts robots.ts
│  └─ globals.css         # Design tokens + Tailwind entry
├─ components/
│  ├─ ui/                 # The component kit — import from "@/components/ui"
│  ├─ sections/           # One file per page section, in reading order
│  ├─ layout/             # SiteHeader, SiteFooter
│  ├─ common/             # Logo, pictograms, JsonLd, Analytics, brand icons
│  └─ providers/          # Theme, react-query, tooltip, toaster
├─ config/                # site.ts, navigation.ts, env.ts
├─ content/               # landing.ts — every string and image on the page
├─ features/              # Vertical slices: <feature>/{components,api}
├─ hooks/                 # Reusable client hooks
├─ lib/                   # utils, api-client, query-client, seo, fonts
├─ types/                 # Domain types (Destination, VisaService, …)
└─ validations/           # Zod schemas, shared between client and API routes
```

**Features are vertical slices.** A feature owns its components, its queries and
its mutations. Anything two features both need moves up into `components/ui`,
`hooks/` or `lib/`.

## Design tokens

All colour, radius, shadow and font values live as CSS custom properties in
`src/app/globals.css`. Components only ever reference the semantic layer
(`bg-primary`, `text-muted-foreground`, `border-border`), never raw hex — so
rebranding means editing the `--brand-*` ramp in one file and everything
follows.

The site renders light-only, matching the reference. Dark tokens are defined
and `next-themes` is wired up, so enabling a toggle is a one-line change.

### Type

| Role    | Family            | Where                                             |
| ------- | ----------------- | ------------------------------------------------- |
| Sans    | Plus Jakarta Sans | Everything by default                             |
| Display | Playfair Display  | Italic only — heading accents, numerals, DISCOVER |

Every section heading is two-tone: a sans lead plus a serif-italic accent
(`Places You'll` + _`Visit`_). `SectionHeading` encapsulates that pattern —
pass `lead` and `accent` rather than styling spans by hand.

## Water glass

Four CSS classes in `globals.css`, each pairing with `.glass-3d` for the
hover-lift and press:

| Class            | Use                                              |
| ---------------- | ------------------------------------------------ |
| `.glass`         | Light glass — cards, the booking form, the offer |
| `.glass-dark`    | Dark-tinted glass over bright photography        |
| `.glass-primary` | The yellow action button                         |
| `.glass-ink`     | The near-black action button                     |

Each layers a blurred + saturated backdrop, a vertical fill gradient, a
specular top edge (`inset 0 1px 0`), and stacked outer shadows. The `::after`
adds the diagonal light streak. Keep the sheen low-contrast — anything
stronger bands visibly across a large surface.

`.glass-3d` also carries the hover state: the surface lifts and brightens
while a specular band sweeps across it (`::before`), as though the light
source moved. It is disabled under `prefers-reduced-motion`.

## Motion

Two libraries, each doing the job it is actually good at.

**GSAP + ScrollTrigger** drives everything tied to scroll position:

| Where            | What                                                      |
| ---------------- | --------------------------------------------------------- |
| Every image      | `ParallaxImage` — drifts against the scroll               |
| Section content  | `Reveal` — slides up on entry, optionally staggered       |
| Hero             | Intro timeline: copy column staggers, then the card       |
| How It Works     | Per-step arrival + a rail that fills with scroll progress |
| Flights & Hotels | Two rows sliding opposite ways, scrubbed to scroll        |
| FAQ              | Height, word cascade and the brand rule wipe              |
| Logo             | The plane's departure and return loop                     |

**Three.js** does two things:

- `hero-webgl.tsx` — a scroll- and pointer-reactive displacement shader over
  the hero photograph.
- `journey-webgl.tsx` — the route trail drawn behind How It Works.

Both are dynamically imported, mounted on idle, paused off-screen, and skipped
without WebGL. Everything they draw is decoration layered over markup that is
already correct, so no-WebGL, reduced motion and pre-hydration all render the
real page.

Images deliberately stay real `<img>` tags rather than WebGL planes: parallax
via transforms is GPU-cheap and keeps LCP, SEO and alt text intact, which
textured quads would all cost.

### The rule that matters

These animations hide content before revealing it, so `useGsap` enforces two
guarantees:

1. Nothing runs under `prefers-reduced-motion` — every component must already
   be correct in its final state.
2. Nothing is built while the tab is hidden. Background tabs throttle
   `requestAnimationFrame` to a stop, so a `from({ autoAlpha: 0 })` would paint
   its hidden state and never tick out of it. Setup waits for
   `visibilitychange`.

Break either and you ship a blank section to somebody.

## The component kit

`src/components/ui` — built on Radix primitives with `class-variance-authority`
for variants and `cn()` (clsx + tailwind-merge) for class composition, so a
caller's `className` always wins over a component default.

Buttons, badges, cards, alerts, inputs, textarea, select, checkbox, radio,
switch, label, form, dialog, drawer, dropdown menu, popover, tooltip, tabs,
accordion, avatar, separator, scroll area, progress, skeleton (+ text/card/list
variants), spinner, empty state, container, section, toaster.

## Forms

`zod` schema in `src/validations` → `@hookform/resolvers/zod` → `react-hook-form`
→ a `react-query` mutation. The same schema validates the API route, so client
and server can never drift. `src/features/booking` is the live implementation,
including honeypot spam protection and mapping server-side field errors back
onto inputs.

## Data fetching

`@tanstack/react-query` with a server-safe client factory (`lib/query-client.ts`),
and an axios instance (`lib/api-client.ts`) that normalises every failure into an
`ApiError` with `status`, `code` and per-field `errors`. 4xx responses are not
retried.

Point `NEXT_PUBLIC_API_URL` at a real backend, or leave it unset to use the
built-in `/api` routes. `POST /api/booking` currently logs and returns a
reference — swap its body for a real mail/CRM call.

## The World Portal API

The visa flow talks to a NestJS backend. Set the base URL — **including the
`/api` prefix** — in `.env.local`:

```
NEXT_PUBLIC_API_URL=https://<host>/api
```

Today that host is a Cloudflare Quick Tunnel, which **changes every time the
tunnel restarts**. It is never hardcoded; without it the client falls back to a
relative `/api` and warns loudly in the console.

Everything the applicant flow touches is public — no auth header anywhere:

| Call                          | Used by                                     |
| ----------------------------- | ------------------------------------------- |
| `POST /upload`                | One call per document, before submitting    |
| `POST /visa-documentation`    | Submit — returns the `applicationNo`        |
| `GET /visa-documentation/:id` | Track by reference (UUID or application no) |

### Three contract quirks the client absorbs

1. **Validation errors are a flat string array on a 400**, not a 422 with an
   `errors` object. `parseValidationMessages()` reconstructs per-field errors
   from class-validator's property-prefixed messages, so the form highlights the
   right inputs and jumps back to the step that owns them — instead of rendering
   `"email must be an email,firstName should not be empty"` as one sentence.
2. **Decimals serialise as strings** (`"500.00"`). Run them through
   `toAmount()` before any maths or formatting; it returns `null` for unset.
3. **`forbidNonWhitelisted: true`** — an unknown key is a 400, and `""` fails
   every `@IsUrl()` / `@IsDateString()` field. `toApiPayload()` strips blanks
   and empty arrays rather than sending them.

All three are covered by tests, so a regression fails the suite rather than
surfacing as a garbled toast.

## Imagery

`public/images/` holds every photograph, referenced from
`src/content/landing.ts`. The four full-bleed backgrounds (hero, Why Bali,
Packages, Contact) are CC-licensed photographs from Wikimedia Commons; check
their attribution requirements before going live, or swap in the agency's own
photography — one edit per entry in the content file.

## The admin console

`/admin` is where the requests the site collects get worked: a dashboard, the
enquiry inbox, visa applications with a stage timeline, customers and settings.
It is built from the same tokens and the same UI kit as the marketing page, so
the two read as one product.

**Auth.** `src/proxy.ts` guards `/admin/:path*`, verifying an HMAC-signed,
`httpOnly` session cookie and bouncing to the login with a `next` param so you
land back where you were headed. Signing in exchanges the email for a World
Portal access token and then proves the account exists and is active through
`GET /profiles/me`. Authorisation stays the service's: its `RolesGuard` decides
what a MANAGER, STAFF or PARTNER may read.

**Data.** The console is a backend-for-frontend. Its hooks call same-origin
route handlers under `src/app/api/admin`, and those call the World Portal API
through `src/server/api/backend.ts` with the token from the cookie — so the
token never reaches the browser. Visa applications come from
`/visa-documentation`, passports from `/passport-application`, the team from
`/profiles`. The service exposes no customer or stats resource, so applicants
are grouped from their applications and the dashboard figures are derived in
`/api/admin/stats`.

**Charts.** Series colours are tokens (`--chart-1..3`), assigned in a fixed
order and validated for colourblind separation, lightness band and contrast in
both modes. Slot 1 is the brand ramp, which sits below 3:1 on white — so every
chart labels its values, and status is always a tone plus a word, never colour
on its own.

## Hire a pro

`/hire` lists vetted professionals at the destination. The data is
`src/content/professionals.ts`; portraits live in `public/images/pros`, one
`<id>.jpg` per listing.

> **The portraits are stock photographs standing in for the real
> professionals.** Replace each one with a photo of the actual person, taken or
> supplied with their consent, before listing anyone genuinely bookable.

## Posts from WorldSpace

Between Experiences and Contact the page shows a wall of posts from
**WorldSpace**, the sister social platform under the same parent company
(Tsion), where travellers post about trips they have taken. Clicking a post
leaves for WorldSpace in a new tab — the cards are outbound links, not a
lightbox.

> **The posts are placeholders.** WorldSpace has no public API yet, so
> `getWorldSpaceFeed()` in `src/server/worldspace/client.ts` serves the curated
> fixtures in `src/features/worldspace/fixtures.ts` — invented people, captions
> and permalinks over stock photographs already in `public/images`. Set
> `WORLDSPACE_API_URL` and the same function fetches the live feed instead;
> nothing else changes. It never throws and never returns nothing, so a
> WorldSpace outage costs a section of sample photos rather than the home page,
> and the section says so on its face while the posts are placeholders.

## The trip basket

Anything with a price can be put in a basket that follows the traveller across
the site — today that is a hired professional, and the same store already types
flights, stays, cars, attractions, visas and passports.

```
src/features/basket/
├─ store.ts                     # zustand + persist, generic over item type
└─ components/
   ├─ basket-button.tsx         # header entry point + count badge
   └─ basket-drawer.tsx         # line items, running total, "turn this into a trip"
```

Add a line from anywhere:

```ts
useBasketStore.getState().add({
  id: `flight:${offer.id}`, // namespaced — features cannot collide
  type: "flight",
  title: "LOS → NRT · Nov 4",
  price: 940, // null when it is quoted after review
});
```

The drawer, the total and the header badge pick it up with no further work.
It persists to `localStorage`, degrading to memory when that is unavailable
(SSR, tests, Safari private mode), and it is code-split — the chunk loads the
first time someone opens the basket.

## Environment variables

Validated at startup by `src/config/env.ts` — a missing or malformed variable
fails loudly instead of surfacing as a runtime bug. See `.env.example`.

`NEXT_PUBLIC_API_URL` points at the World Portal backend and is what the visa
flow talks to. The admin console does **not** use it: its routes live in this
app, so it calls them through `internalApi` on a fixed same-origin `/api` base.
`ADMIN_PASSWORD` and `SESSION_SECRET` ship with development defaults that are
refused in production.

## Conventions

- Server Components by default; `"use client"` only where interactivity needs it.
- Imports are auto-sorted: `react`/`next` → packages → `@/` → relative.
- Conventional Commits, enforced by commitlint on `commit-msg`.
- Husky runs lint-staged pre-commit and typecheck + tests pre-push.
- CI (`.github/workflows/ci.yml`) runs typecheck, lint, format, unit tests,
  build, then Playwright.
