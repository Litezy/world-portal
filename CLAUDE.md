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

| Route    | Layout   | Header                          |
| -------- | -------- | ------------------------------- |
| `/`      | `(site)` | overlay, scrolls away with hero |
| `/apply` | `(app)`  | solid sticky ink bar            |
| `/track` | `(app)`  | solid sticky ink bar            |

`SiteHeader` takes `variant="overlay" | "solid"`. The overlay variant's type is
white for photography — never pin it over a light page.

## The visa flow starts with a question, not a form

`/apply` opens on `RouteCheck`: origin + destination decide whether this is an
**eVisa**, an **ETA**, a **T.Visa** or **no visa at all**, and everything
downstream branches on that:

- eVisa / ETA — completed online, four steps, document uploads.
- T.Visa — the embassy needs the applicant in person, so the documents step is
  **removed** (not disabled) and the success screen explains the appointment.
- Visa-free — say so and send them to `/start`; do not sell an application.

The ruleset lives in `src/features/visa/requirement.ts` and is deliberately
local: this is the first screen a visitor touches and it must work with the API
down. The backend exposes `/visa-requirement/check` — prefer it when it is up
and keep this as the fallback.

`src/lib/countries.ts` carries search aliases because `Intl.DisplayNames`
returns "Türkiye" and "Czechia" while people type "Turkey" and "Czech
Republic". Someone who cannot find their own country abandons the form.

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

## Non-negotiables

- **Never hardcode colours.** Use semantic tokens (`bg-primary`,
  `text-muted-foreground`, `border-border`) or the `brand-*` / `ink-*` ramps,
  defined once in `src/app/globals.css`. Brand is `#fccc2e` (`--brand-400`).
- **Copy lives in `src/content/landing.ts`**, not in components.
- **Server Components by default.** `"use client"` only where it is needed —
  the header, hero, journey, flights-hotels, FAQ, logo, and the motion
  primitives.
- **One schema per form.** The zod schema in `src/validations` is used by both
  the client form and the API route.
- **`cn()` for every className.**

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

## Never hand-write a `-webkit-` prefix in globals.css

Writing `backdrop-filter` followed by `-webkit-backdrop-filter` makes Lightning
CSS emit **only** the legacy alias, which Chrome ignores — every glass surface
then silently stops blurring and looks merely translucent. Declare the standard
property alone and let the build add prefixes from browserslist. This was live
and unnoticed for several rounds.

## Motion safety — read before touching an animation

`useGsap` refuses to build in two cases, and both exist for a reason:

- **`prefers-reduced-motion`.** Every animated component must already render
  correctly in its final state, because the animation may never run.
- **Hidden tab.** Background tabs throttle `requestAnimationFrame` to a stop.
  A `from({ autoAlpha: 0 })` built there paints its hidden state and never
  ticks out of it, leaving a blank section for anyone who opens the page in a
  background tab. Setup is deferred until `visibilitychange`.

Same rule for the WebGL layers: they mount through `useIdleMount`, which waits
for `requestIdleCallback` **and** for the tab to be visible, because rIC never
fires in a background tab. Anything behind it must be pure decoration.

Journey steps are **scrubbed, not fired once** — `once: true` leaves a section
frozen when you scroll back up. `e2e/motion.spec.ts` asserts a step goes
0 → 1 → 0 as you scroll down and back.

If you add a reveal, add it through `Reveal`/`useGsap` so it inherits both.
`e2e/smoke.spec.ts` has a regression test that hero copy is visible.

**Do not remove `HashScroll`** (`components/motion/hash-scroll.tsx`).
`html { scroll-behavior: smooth }` cancels the browser's _initial_ anchor jump
during load, so `/#visas` would silently open at the hero. It redoes the jump
after layout settles and refreshes ScrollTrigger, since everything below the
anchor has just moved.

## Where things go

| Adding…                       | Put it in                               |
| ----------------------------- | --------------------------------------- |
| A generic, reusable primitive | `src/components/ui` + export from index |
| A scroll or reveal behaviour  | `src/components/motion`                 |
| A new page section            | `src/components/sections` + the barrel  |
| Copy or an image reference    | `src/content/landing.ts`                |
| A query or mutation           | `src/features/<feature>/api`            |

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
- There is **no passport endpoint** on the World Portal API. `/passport` posts
  to this app's own `app/api/passport-enquiry/route.ts`, which validates with
  the same schema and returns a `WPP-` reference. When a real endpoint lands,
  repoint the mutation and delete that file.
- `/services/[slug]` sets `dynamicParams = false`, so an unknown slug 404s
  rather than being rendered on demand.
- Anything that toggles a list in state (the planner's extras) must use a
  functional `setState` — two clicks inside one React batch otherwise both read
  the same stale array and the second discards the first.
- `next typegen` runs as part of `pnpm typecheck`, so a clean checkout
  typechecks without a build. Next 16 removed `next lint`.
