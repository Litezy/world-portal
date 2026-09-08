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
| `/hire`  | `(app)`   | solid sticky ink bar            |
| `/admin` | `(admin)` | console shell — ink sidebar     |

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

Four things the client absorbs. Do not "simplify" them away — each was
verified against the running service, not assumed:

1. **Every 2xx body is wrapped**: `{ success: true, data }`, from the service's
   `TransformInterceptor`. `unwrap()` in `api-client.ts` strips it once so no
   hook ever sees the envelope. Reading `response.data` as the record itself is
   what crashed `/track` before this was fixed.
2. **Validation errors are a 422 carrying a field map** — `{ success: false,
statusCode: 422, message: "Validation failed", errors: { field: [...] } }`.
   The client prefers that map. `parseValidationMessages()` remains only as a
   fallback for the older 400-with-string-array shape.
3. **Decimals are strings** (`"500.00"`). Always `toAmount()` before maths or
   formatting.
4. **`forbidNonWhitelisted: true`** — unknown keys are a 400, and `""` fails
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

| Route                 | Backed by                                        |
| --------------------- | ------------------------------------------------ |
| `/admin/login`        | `POST /auth/test-token` + `GET /profiles/me`     |
| `/admin`              | Derived from the collections below               |
| `/admin/applications` | `/visa-documentation` (+ `/status`, `/evaluate`) |
| `/admin/passports`    | `/passport-application` (+ `/status`)            |
| `/admin/customers`    | Grouped from both application collections        |
| `/admin/settings`     | `/profiles` for the team list                    |

- **The console is a BFF, not a second API client.** Its hooks call
  `internalApi` (fixed same-origin `/api`); the route handlers under
  `src/app/api/admin` are what talk to the World Portal service, via
  `src/server/api/backend.ts`. The access token therefore never reaches the
  browser. Never point a console hook at `api` — that is the public client.
- **The service has no enquiry, customer or stats resource.** Applicants are
  grouped from their applications, and the dashboard figures are derived in
  `/api/admin/stats`. Swap that for a real summary endpoint when one exists.
- **List endpoints return whole collections.** Search and status are the
  service's filters; paging is ours (`paginate()` in `src/server/http.ts`).
- **The visa timeline is reconstructed** from `createdAt` / `evaluatedAt` /
  `updatedAt`. The service keeps no review log, and the UI says so.
- **`src/proxy.ts` is the gate.** It matches `/admin/:path*`, verifies the
  signed cookie and redirects to the login with a `next` param. The console
  layout re-checks the session as defence in depth (it redirects without
  `next` — only reachable if the proxy did not run).
- **The session is an HMAC-signed cookie** (`src/server/auth/session.ts`),
  `httpOnly` + `sameSite=lax`, verified with `timingSafeEqual`. It also carries
  the service's access token. `authenticate()` exchanges the email for a token
  and then proves the account exists and is active via `/profiles/me`.
- **`ADMIN_PASSWORD` and `SESSION_SECRET` have dev defaults that
  `src/config/env.ts` refuses in production.** Deploying without setting them
  fails the build rather than shipping a public password.
- **Roles are the service's, not ours.** `AdminRole` mirrors its `UserRole`
  (`MANAGER` / `STAFF` / `PARTNER`); `RolesGuard` decides what each may read, so
  a 403 from `/admin/team` is a correct answer for a non-manager, not a bug.
- **List state lives in the URL** (`useListParams`) so a filtered view can be
  shared and survives a refresh.

## Hiring a pro, and the basket

`/hire` lists vetted professionals at the destination — photographers, chefs,
barbers, interpreters, fixers. `src/content/professionals.ts` is the data;
`HireBrowser` filters it; a card opens `ProModal` with the full profile.

The basket (`src/features/basket/store.ts`) is deliberately **generic**, not a
"hired pros" list:

```ts
type BasketItemType =
  "pro" | "flight" | "stay" | "car" | "attraction" | "visa" | "passport";
```

Only `pro` can be added today. When flights and stays open, they add a line with
their own `type` and the drawer, the total and the header count all work with no
change. Ids are namespaced (`pro:kenji-watanabe`) so two features can never
collide, and adding an existing id **replaces** rather than duplicates.

- `price: null` means "quoted after review". `basketTotal` skips those rather
  than producing `NaN`, and the drawer says the figure will change.
- Persistence is `localStorage` via zustand `persist`, behind `safeStorage()` —
  it is absent during SSR and in tests, and merely touching it throws in
  Safari's private mode. The basket falls back to memory rather than crashing.
- Anything reading the store must gate on `useMounted()`. The store rehydrates
  after mount, so painting a count during SSR flashes the wrong number.
- The drawer is `next/dynamic`, mounted only once the basket is first opened.
  It sits in the header on every page, and the landing page already has a
  Three.js hero competing for the main thread — pulling vaul and the whole
  line-item UI into the first bundle delayed hydration enough that the FAQ
  accordion was still dead to clicks. Keep it lazy.

**The portraits in `public/images/pros` are stock photographs** — Unsplash
models, cast one per listing to match the name, city and trade. They are
placeholders exactly like the names and the rates. Before this page lists
anyone genuinely bookable, swap in a photograph of that person, taken or
supplied with their consent: a stranger's face on a real, chargeable listing is
the one thing here that is not merely placeholder data. `photo` is optional and
`ProAvatar` falls back to a hashed monogram tile without it, so a listing with
no cleared photograph still renders. A unit test asserts every `photo` path
resolves to a file, because a typo'd slug is otherwise a silently broken image.

## WorldSpace — other travellers' posts on the landing page

WorldSpace is the sister platform under the same parent company (Tsion): a
social feed where travellers post about the trips they have taken. The section
between Experiences and Contact borrows a wall of those posts as evidence that
people actually go. Every card is an outbound link that opens the post on
WorldSpace — the section hands the visitor to the other product rather than
trying to keep them here, so do not build a lightbox or a detail route for it.

**There is no WorldSpace API yet.** The whole feature hangs off one seam,
`getWorldSpaceFeed()` in `src/server/worldspace/client.ts`. With
`WORLDSPACE_API_URL` unset it serves the curated posts in
`src/features/worldspace/fixtures.ts`; set it and it fetches the live feed.
Nothing else changes — not the section, not the cards, not the route handler.
The zod schema in that file is the contract with a service nobody has written
yet, so it is the thing that must be reconciled with the real payload. Adapt it
_there_; never widen `WorldSpacePost`, which several places are written against.

**The adapter never throws and never returns an empty feed.** That is a
decision, not an oversight. It renders on the landing page, so an unreachable
WorldSpace, a 500, or a payload that has drifted would otherwise take down
E-Embassy's home page for the sake of a marketing section. Every failure path
warns to the server log and falls back to the fixtures. Do not "improve" it
into a thrown error or an empty state.

`feed.source` (`"live" | "placeholder"`) rides out to the section root as
`data-worldspace-source`, and the placeholder notice is rendered from it — so
the page can never quietly present sample posts as a real feed. That attribute
and `data-worldspace-post` on the cards are what `e2e/worldspace.spec.ts`
locates by; the copy is expected to be rewritten and is not asserted on.

**The photographs are stock images already in this repo, and the people are
invented** — the names, handles, captions and like counts are made up, exactly
like the portraits in `public/images/pros` above, and under the same standing
rule. Before this section shows anything presented as a real person's post, it
must _be_ a real post: the live feed, that person's own photograph, their own
permalink. A unit test asserts every `imageUrl` and every non-null `avatarUrl`
resolves to a file, because a typo'd path is a silently broken image and this
section is nothing but images.

`src/app/api/worldspace/posts/route.ts` is a seam, not dead code. The section
is a Server Component and calls the adapter directly, but a client-side "load
more" needs a same-origin endpoint, and the day WorldSpace requires a key that
key has to stay off the browser — the same BFF rule as the admin console.

Every card links to another origin with `target="_blank"` and
`rel="noopener noreferrer"`. Without `noopener` the opened tab can reach back
through `window.opener`, and there is no reason to hand another origin that.

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
  defined once in `src/app/globals.css`. Brand is `#0050C0` (`--brand-600`,
  aliased as `--primary`) with `#00B8F8` cyan as the secondary swoosh colour.
- **Copy lives in `src/content`**, not in components — `landing.ts` for the
  site, `admin.ts` for the console (including every status label).
- **Server Components by default.** `"use client"` only where it is needed —
  the header, hero, journey, flights-hotels, FAQ, and the motion primitives.
  The logo used to be one and no longer is — its idle animation was removed,
  and with the hooks went the directive.
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

## Swapping an image? Wipe `.next` first

`next/image` caches per **format**, so after replacing a file in `public/` the
JPEG entry can refresh while the **AVIF** one stays stale — and browsers ask for
AVIF. The result is maddening: `curl` returns the new picture, the page shows
the old one, and nothing looks broken. `rm -rf .next/cache` is not enough with a
server running; stop every dev server, `rm -rf .next`, then start one.

## The hero is two columns, and the forecast card is not a feed

The hero was one centred column beneath an oversized WebGL EXPLORE. It is now
side by side: the copy column on the left — badge, a two-tone `SectionHeading`
`h1`, the lead, the two CTAs — carrying `data-hero-stack`, whose children GSAP
staggers; and `HeroForecastCard` (`sections/hero-forecast-card.tsx`) at the
bottom right. `HeroWebgl`, the displacement shader over the photograph, stays.
The wordmark shader does not, so the hero now has **one** canvas rather than
two; `e2e/motion.spec.ts` asserts that count, because a second one reappearing
means a layer got mounted that nobody meant to ship.

**`hero.forecast` is static copy in `src/content/landing.ts`, not weather.**
There is no weather API behind this app and the numbers never refresh — the
place, the temperature, the three metrics and the five-day strip are all
placeholder lines, edited exactly like the rest of the copy. Do not wire the
card to a fetch, a hook or an `/api` route that does not exist, and do not
describe it anywhere as live.

The card is revealed from `autoAlpha: 0`, so the usual rule binds it: it must
already be correct in its final state, because reduced motion and a hidden tab
both mean the tween never runs. Its root carries `data-hero-forecast` — that is
how the e2e guard finds it, so keep the attribute if you restyle the card.

## The journey panel is layered, not a single gradient

One tall multi-stop gradient banded into visible stripes and read as flat. It is
now four layers, and all four matter:

1. a dimmed night photograph (`journey/panel.jpg`) for texture,
2. a soft four-stop wash for the brand colour,
3. two off-centre radial glows so the light has a direction,
4. `.grain`, which dithers the whole thing — remove it and the banding returns.

Step images come from different sources with different casts. `.tint-brand`
pulls their hue toward the palette in `color` blend mode, preserving luminance,
so a warm photograph sits next to a blue button without clashing. Prefer
genuinely cool-toned source images; the tint is a finisher, not a rescue.

## Never hand-write a `-webkit-` prefix in globals.css

Writing `backdrop-filter` followed by `-webkit-backdrop-filter` makes Lightning
CSS emit **only** the legacy alias, which Chrome ignores — every glass surface
then silently stops blurring and looks merely translucent. Declare the standard
property alone and let the build add prefixes from browserslist. This was live
and unnoticed for several rounds; `e2e/glass.spec.ts` now asserts the computed
`backdrop-filter` is never `none`, so it cannot come back.

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

The journey panel is blue top to bottom and every step is light type — there is
no half-way tone flip to keep in sync with the gradient any more. If you
brighten the mid-band, re-check white body copy against it.

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

| Adding…                          | Put it in                               |
| -------------------------------- | --------------------------------------- |
| A generic, reusable primitive    | `src/components/ui` + export from index |
| A scroll or reveal behaviour     | `src/components/motion`                 |
| A new page section               | `src/components/sections` + the barrel  |
| An admin screen                  | `src/features/<feature>` + a route      |
| A backend call the console needs | `src/server/data/store.ts`              |
| Copy or an image reference       | `src/content/landing.ts`                |
| A query or mutation              | `src/features/<feature>/api`            |
| Something bookable, with a price | a `BasketItem` — see the basket section |
| Anything that reads WorldSpace   | `src/server/worldspace/client.ts`       |

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
- The footer's ghosted DISCOVER uses `leading-[0.8]`, which puts a Playfair cap
  baseline exactly on the line-box bottom edge. It is the last of the oversized
  wordmarks: the hero's went when `webgl-wordmark.tsx` was deleted.
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
- A `<button>` vertically centres its own contents, and `display: block` does
  **not** stop it. In a stretched card (`flex-1` inside `h-full`) a short
  profile floats down the middle while its neighbours sit at the top. Give the
  button a flex formatting context — `ProCard` does.
- Nav section links are root-relative (`/#visas`, not `#visas`). A bare hash on
  a page under `(app)` only rewrites the URL, because the section it names
  lives on the landing page.
- `scroll-padding-top` has to clear the **taller** header (6rem from lg up), or
  an anchored element lands under the fixed bar and cannot be clicked.
- `next typegen` runs as part of `pnpm typecheck`, so a clean checkout
  typechecks without a build. Next 16 removed `next lint`.
