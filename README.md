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

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

| Route      | What it is                                               |
| ---------- | -------------------------------------------------------- |
| `/`        | Placeholder home page — replace once the UI is chosen    |
| `/contact` | Working reference form (zod → RHF → react-query → toast) |

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
│  ├─ api/                # Route handlers (booking, health)
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
| Hero             | Intro timeline, then the wordmark drifts                  |
| How It Works     | Per-step arrival + a rail that fills with scroll progress |
| Flights & Hotels | Two rows sliding opposite ways, scrubbed to scroll        |
| FAQ              | Height, word cascade and the brand rule wipe              |
| Logo             | The plane's departure and return loop                     |

**Three.js** does two things, both in the hero:

- `hero-webgl.tsx` — a scroll- and pointer-reactive displacement shader over
  the hero photograph.
- `webgl-wordmark.tsx` — the oversized DISCOVER. The word is rasterised into a
  2D canvas using the real Playfair webfont, then revealed through a shader:
  a bottom-up wipe, liquid displacement that is violent at the wipe front and
  settles to an idle drift, and a chromatic split that scales with it.

Both are dynamically imported, mounted on idle, paused off-screen, and skipped
without WebGL. The wordmark renders twice on purpose — a real text node that is
always correct, plus the WebGL plate that fades over it once its texture is
ready — so no-WebGL, reduced motion and pre-hydration all show real type.

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

## Environment variables

Validated at startup by `src/config/env.ts` — a missing or malformed variable
fails loudly instead of surfacing as a runtime bug. See `.env.example`.

## Conventions

- Server Components by default; `"use client"` only where interactivity needs it.
- Imports are auto-sorted: `react`/`next` → packages → `@/` → relative.
- Conventional Commits, enforced by commitlint on `commit-msg`.
- Husky runs lint-staged pre-commit and typecheck + tests pre-push.
- CI (`.github/workflows/ci.yml`) runs typecheck, lint, format, unit tests,
  build, then Playwright.
