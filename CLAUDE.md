@AGENTS.md

# World Portal — working notes

Single-page site for a travel & visa agency, built to a video reference. Read
`README.md` for the full tour; this file is what matters when changing code.

## What the page sells

Three services, each with its own section and its own CTA:

1. **Visas** (`#visas`) — eVisa, **T.Visa (Traditional Visa)**, ETA. **The only
   live service.** Sold on comfort and ease.
2. **Flights & Hotels** (`#flights-hotels`) — _coming soon._ Speed and reliability.
3. **Experiences & Tours** (`#experiences`) — _coming soon._ Curation and quality.

The two coming-soon sections keep their full layout; only the CTA changes, via
`sections/coming-soon.tsx` (a "Launching soon" notice plus a waitlist mailto).
Do not link them into flows that do not exist.

`#journey` ("How it works") is the one process behind all three. `#contact` has
**no form** — it routes to `/apply` and `/track`. **Packages** and
**Testimonials** are parked: components and content still exist, JSX commented
out in `app/(site)/page.tsx`.

## Routes and layouts

| Route    | Layout    | Header                          |
| -------- | --------- | ------------------------------- |
| `/`      | `(site)`  | overlay, scrolls away with hero |
| `/apply` | `(app)`   | solid sticky ink bar            |
| `/track` | `(app)`   | solid sticky ink bar            |
| `/admin` | `(admin)` | console shell — ink sidebar     |

`SiteHeader` takes `variant="overlay" | "solid"`. The overlay variant's type is
white for photography — never pin it over a light page.

## The API contract — read before touching the visa flow

Base URL lives in `NEXT_PUBLIC_API_URL` and **includes the `/api` prefix**. It
is a Cloudflare Quick Tunnel whose host changes on every restart, so it is never
hardcoded anywhere but `.env.local`.

Three quirks the client already absorbs. Do not "simplify" them away:

1. **Validation errors are a 400 with `message` as a string array** — no
   `errors` object, never a 422. `parseValidationMessages()` rebuilds per-field
   errors from class-validator's property-prefixed text. Without it the form
   cannot highlight fields and a toast reads as one comma-joined sentence.
2. **Decimals are strings** (`"500.00"`). Always `toAmount()` before maths or
   formatting.
3. **`forbidNonWhitelisted: true`** — unknown keys are a 400, and `""` fails
   every `@IsUrl()`/`@IsDateString()` field. `toApiPayload()` strips blanks and
   empty arrays. Never add a key the DTO does not declare.

Documents upload one at a time to `POST /upload` (field name `file`, 10MB,
PDF/JPG/PNG/WEBP) _before_ submission; the returned `url` goes into the matching
`*Url` field. `GET /visa-documentation/:id` is deliberately public — never add
an auth header to it.

## The admin console

`/admin` is the other half of the product: the desk where the enquiries the
site collects are worked. It reuses the same tokens, the same UI kit and the
same two-tone headings — a console, not a second design language.

| Route                 | What it is                                    |
| --------------------- | --------------------------------------------- |
| `/admin/login`        | Split photo/form sign-in                      |
| `/admin`              | KPI row, 7-day chart, service split, pipeline |
| `/admin/enquiries`    | Incoming requests from the site, + detail     |
| `/admin/applications` | Visa files, stage timeline, + detail          |
| `/admin/customers`    | Everyone who has applied or travelled         |
| `/admin/settings`     | Profile, notification prefs, sign out         |

- **The console calls this app, not the backend.** Its hooks use `internalApi`
  (fixed `/api` base), never `api` — which points at `NEXT_PUBLIC_API_URL` and
  would 404 every console screen once the tunnel URL is set.
- **`src/proxy.ts` is the gate.** It matches `/admin/:path*`, verifies the
  signed cookie and redirects to the login with a `next` param. The console
  layout re-checks the session as defence in depth (it redirects without
  `next` — only reachable if the proxy did not run).
- **The session is an HMAC-signed cookie** (`src/server/auth/session.ts`),
  `httpOnly` + `sameSite=lax`, verified with `timingSafeEqual`. There is no
  user table yet; `authenticate()` checks one set of env credentials.
- **`ADMIN_PASSWORD` and `SESSION_SECRET` have dev defaults that
  `src/config/env.ts` refuses in production.** Deploying without setting them
  fails the build rather than shipping a public password.
- **`src/server/data/store.ts` is an in-memory stub.** Every function mirrors a
  call the real backend will expose — swap the bodies, keep the signatures. It
  resets when the server restarts, and does not survive across serverless
  instances.
- **Anything time-sensitive is computed server-side.** `overdue` ships as a
  field on the application rather than being derived in a component, because
  `Date.now()` during render breaks the React Compiler purity rule.
- **List state lives in the URL** (`useListParams`) so a filtered view can be
  shared and survives a refresh.

## Non-negotiables

- **The app is light-only and forces it.** `ThemeProvider` sets
  `forcedTheme="light"`, because `localhost:3000` is shared with every other
  local project and a stale `theme` in localStorage otherwise renders screens
  in a mode none were designed against. Drop it in the same change that mounts
  a toggle — and check the fields first.
- **A field's fill is `bg-field`, never a fixed light value.** `--field` /
  `--field-focus` move with `--foreground`; `bg-ink-50` plus `text-foreground`
  is how you get near-white text on a near-white input.
- **Never hardcode colours.** Use semantic tokens (`bg-primary`,
  `text-muted-foreground`, `border-border`) or the `brand-*` / `ink-*` ramps,
  defined once in `src/app/globals.css`. Brand is `#fccc2e` (`--brand-400`).
- **Copy lives in `src/content`**, not in components — `landing.ts` for the
  site, `admin.ts` for the console (including every status label).
- **Server Components by default.** `"use client"` only where it is needed —
  the header, hero, journey, flights-hotels, FAQ, logo, and the motion
  primitives.
- **One schema per form.** The zod schema in `src/validations` is used by both
  the client form and the API route.
- **`cn()` for every className.**

## Charts

Chart colour is a fourth token group in `globals.css` (`--chart-1..3`,
`--chart-grid`), assigned in order and never cycled. Slot 1 is `--brand-600`;
the set is validated for colourblind separation, lightness and contrast in both
light and dark. If you add a series, re-validate rather than eyeballing a hex.

Because slot 1 sits below 3:1 on white, every chart value carries a visible
label — that is the contrast relief, not decoration. Status is never colour
alone: the badges pair a tone with a word, and an overdue date carries an icon.

## The three design signatures

1. **Two-tone headings** — sans lead + serif-italic accent, always via
   `SectionHeading` (`lead` + `accent`), never hand-rolled spans.
2. **Water glass** — `.glass` / `.glass-frost` / `.glass-dark` /
   `.glass-primary` / `.glass-ink`, each paired with `.glass-3d` for the lift,
   press and the specular sweep on hover. Compose these rather than writing new
   `backdrop-filter` rules; the shadow stack is tuned.
3. **Scroll motion** — `ParallaxImage` for any image, `Reveal` for any block of
   content. Reach for a bespoke ScrollTrigger only when a section genuinely
   needs one (journey, flights-hotels, hero).

## Motion safety — read before touching an animation

`useGsap` refuses to build in two cases, and both exist for a reason:

- **`prefers-reduced-motion`.** Every animated component must already render
  correctly in its final state, because the animation may never run.
- **Hidden tab.** Background tabs throttle `requestAnimationFrame` to a stop.
  A `from({ autoAlpha: 0 })` built there paints its hidden state and never
  ticks out of it, leaving a blank section for anyone who opens the page in a
  background tab. Setup is deferred until `visibilitychange`.

If you add a reveal, add it through `Reveal`/`useGsap` so it inherits both.
`e2e/smoke.spec.ts` has a regression test that hero copy is visible.

**Do not remove `HashScroll`** (`components/motion/hash-scroll.tsx`).
`html { scroll-behavior: smooth }` cancels the browser's _initial_ anchor jump
during load, so `/#visas` would silently open at the hero. It redoes the jump
after layout settles and refreshes ScrollTrigger, since everything below the
anchor has just moved.

## Where things go

| Adding…                          | Put it in                               |
| -------------------------------- | --------------------------------------- |
| A generic, reusable primitive    | `src/components/ui` + export from index |
| A scroll or reveal behaviour     | `src/components/motion`                 |
| A new page section               | `src/components/sections` + the barrel  |
| An admin screen                  | `src/features/<feature>` + a route      |
| A backend call the console needs | `src/server/data/store.ts`              |
| Copy or an image reference       | `src/content/landing.ts`                |
| A query or mutation              | `src/features/<feature>/api`            |

## Layout widths

- `Container size="content"` (1200px) — headings, grids, cards.
- `Container size="panel"` (1420px) — the inset rounded panels (Why Us,
  Journey).
- Full bleed, no container — Hero, Contact, Footer, and the marquee rows.

## Before you call it done

```bash
pnpm validate      # typecheck + lint + format:check + unit tests
pnpm test:e2e      # Playwright — needs `pnpm exec playwright install` once
```

Lint runs the React Compiler rules — no `setState` directly in an effect body,
no ref writes during render, and no `form.watch()` (use `useWatch`). Fix the
pattern rather than disabling the rule.

## Gotchas

- **Fraunces** (the wordmark) is loaded variable, with no `weight` — next/font
  rejects `axes` alongside an explicit weight. Weight and the SOFT/WONK axes
  are set in the `.font-logo` utility.
- `lucide-react` v1 dropped brand icons — social marks live in
  `brand-icons.tsx`, service pictograms in `pictograms.tsx`.
- `.glass-3d` sets `overflow: hidden` for the sweep, so never put a popover or
  dropdown inside one.
- `ParallaxImage` always uses `fill`; passing `width`/`height` makes next/image
  size to its intrinsic box inside the absolutely-positioned inner wrapper and
  the tiles come out ragged.
- The hero DISCOVER is WebGL (`webgl-wordmark.tsx`) layered over a real text
  node that stays correct without it. The footer's still uses `leading-[0.8]`,
  which puts a Playfair cap baseline exactly on the line-box bottom edge.
- `Button` with `asChild` forwards a _single_ child, so `leftIcon`/`rightIcon`
  are dropped — put the icon inside the child element instead.
- `buildMetadata()` omits `title` entirely when a page has none, so the root
  layout's `title.default` applies. Returning a pre-suffixed string double-
  applies the `%s | World Portal` template.
- `next typegen` runs as part of `pnpm typecheck`, so a clean checkout
  typechecks without a build. Next 16 removed `next lint`.
