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

| Route     | Layout     | Header                          |
| --------- | ---------- | ------------------------------- |
| `/`       | `(site)`   | overlay, scrolls away with hero |
| `/apply`  | `(app)`    | solid sticky glass bar          |
| `/track`  | `(app)`    | solid sticky glass bar          |
| `/hire`   | `(app)`    | solid sticky glass bar          |
| `/admin`  | `(admin)`  | console shell — ink sidebar     |
| `/agency` | `(agency)` | console shell — its own session |

`SiteHeader` takes `variant="overlay" | "solid"`; the overlay is thinner glass
over the hero. Either way the capsule follows the theme: frosted white with ink
type in light, smoked glass with white type in dark. Nothing in it is a fixed
white.

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

## Applicants sign in with WorldStreet

E-Embassy is a WorldStreet service and has **no login of its own**. It shares
WorldStreet's Clerk instance (same keys), so a WorldStreet user on
`*.worldstreetgold.com` arrives already signed in; a signed-out one is sent to
WorldStreet's `/login` with `redirect_url` back. ADR 0014 in
`worldPortal/docs/adr` has the full design.

- **`src/proxy.ts` dispatches three audiences.** `/admin` and `/agency` (and
  their `/api` proxies) keep their own cookies and never touch Clerk.
  Everything else runs through `clerkMiddleware`; the prefixes in
  `APPLICANT_PROTECTED_PREFIXES` (`src/config/auth.ts`) require a session.
- **Identity is read, never stored.** `useApplicantSession()` wraps Clerk's
  `useUser`; the API keys every applicant record by the Clerk user id. Do not
  reintroduce an applicant store, an email-code login, or an email in a URL.
- **Acting as the applicant means forwarding the session token.** Server
  routes use `applicantBackend()` (`src/server/applicant/backend.ts`); the visa
  submission passes `getToken()` per call. The status lookup and uploads stay
  public — no token.
- **The `(applicant)` layout joins on entry** (`POST /me/join`, idempotent).
  That is the whole onboarding.
- **Signing out is WorldStreet-wide** — it is the same session.
- **Clerk keys are required** to serve any non-console page. Without them
  `next dev` falls back to Clerk's keyless mode (`/.clerk/`, git-ignored).

## Vivid — the voice assistant

Vivid is WorldStreet's voice assistant, copied from Xtreme's integration (ADR
0015). Sira brokers the voice session; the persona and tools go to it on the
mint (`src/app/api/vivid/sira-session`), and tool calls come back over the
session's WebSocket to run in the browser or on `/api/vivid/function`.

- **Only `src/server/vivid/sira.ts` reads `SIRA_API_KEY`.** The mint response
  is scrubbed to what the browser needs; no vendor, model or voice name may
  reach the browser or Vivid's speech. After a build,
  `grep -rioE "gemini|openai|gpt-|kore|fenrir" .next/static` must find nothing.
- **Who may use it is decided in one place,** `hasVividAccess()` in
  `src/server/vivid/access.ts`. Free today; `VIVID_REQUIRE_SUBSCRIPTION=true`
  fails closed until the WorldStreet subscription lookup is written there.
- **Tools live in `src/features/vivid/functions.ts`.** It is bundled for the
  browser and read by the server for the tool list, so it may not import
  server code or touch the DOM at import time. Server tools are stubs there;
  their bodies are in `src/server/vivid/functions.server.ts`.
- **The forms talk to Vivid through the form bridge**
  (`src/features/vivid/form-bridge.ts`). The visa and passport wizards
  register a binding while mounted; field names, labels and options are in
  `features/{visa,passport}/vivid-fields.ts`. Add a field to a wizard → add it
  there too. Passport's step validation is shared with the bridge
  (`passportStepValidation`) so Continue and Vivid never disagree.
- **Submitting is always two calls** — `confirmed=false` returns a read-back
  and sends nothing; only `confirmed=true` submits, through the same
  `submitApplication` the Submit button uses.
- **Vivid's mark is WorldStreet's gold dot globe** (`vivid-globe.tsx` +
  `globe-draw.ts`, ported from the hub's `components/vivid/VividGlobe.tsx`),
  on every surface: the pill, the corner button and the live capsule. Don't
  bring back a shader orb or invent a blue mark (Owen, 2026-11-08: "the vivid
  logo at the bottom is not correct"). One 2D canvas; it turns faster and
  its dots swell with the voice when `active` + `getAudioLevels` are passed,
  stops off-screen and when `still`, and holds one frame under reduced
  motion. Two local changes from the hub: `backdrop` is a night-blue coin
  (`--brand-950`, drawn in CSS, the same in both themes) instead of stone,
  and the front dots warm to pale gold (`#FDE68A`) instead of near-white,
  which read grey-blue on navy at 1x.
- **On the landing page (md and up) Vivid is the Ask Vivid pill**
  (`vivid-ask-pill.tsx`), adapted from WorldStreet's Ask Vivid dock. It sits
  at the bottom centre, arrives once the hero has scrolled away, and cycles
  the prompts in `content/vivid.ts`. The whole pill is one button that starts
  the same voice session as the corner button (there is no text chat here).
  Keep the prompts to things Vivid's tools can actually do.
- **Phones and every other page keep the corner button** (60px globe). On
  the landing page's phones it waits, like the pill, for the hero to pass
  (`use-landing-scroll.ts`, shared by both), so it never covers the paper
  plane or its arrival card. Elsewhere it is always there.
- **Vivid is hidden on `/admin` and `/agency`**, and needs
  `Permissions-Policy: microphone=(self)` from `next.config.ts`.

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

## The agency side — the businesses that staff the trip

`/hire` sells one professional. `/agency` is the other end of that: a whole
service business — a security firm, a caterer, a driver, a cleaning company —
lists itself on the platform and staffs the jobs travellers book. It is a third
audience on a site that already has two, which is why `#agency` on the landing
page is a pitch to a business owner and reads differently from everything
around it: the traveller is not the reader of that band.

End to end, one job goes:

1. the agency lists itself — profile, the services it sells, the paperwork;
2. a traveller adds one of those services to their package and pays for the
   whole trip up front;
3. the booking lands in the agency's dashboard as an `AgencyAssignment`;
4. the agency puts its own `AgencyStaff` against it before the start date —
   the traveller's contact details are released only at that point;
5. the job completes, and the platform settles the agency on a fixed run
   through an `AgencyPayout`, minus the commission agreed on the listing.

Money is never typed in twice: `platformFee + netToAgency === gross` on every
assignment, and a payout's totals are the sums over the assignments it batches.
A unit test asserts both, so add a job by giving it a `gross` and let the
fixture builders derive the rest.

**There is no agency API.** Like WorldSpace, the whole feature hangs off one
seam — `src/server/agency/store.ts` — and every screen goes through the route
handlers rather than talking to anything directly. The catch is that the store's
writes are **in memory**: assigning staff, uploading a document or submitting a
listing survives navigation and dies on the next `next dev` restart. That is
fine for a demo and a trap in a bug report, so check whether the server was
restarted before chasing a "lost" assignment. Swap the store, not the screens,
when a real service exists.

**The agency session is a different cookie from the admin one, and the two must
never cross.** `/admin` is E-Embassy staff; `/agency` is an outside business
that must not see the admin desk or another agency's assignments. `src/proxy.ts`
guards both prefixes in two independent branches — each reads only its own
cookie and verifies it with only its own verifier, so an admin cookie cannot
authenticate `/agency/*` and an agency cookie cannot authenticate `/admin/*`.
Do not merge those branches into one "is there a session" check, and do not let
either fall through into the other. `/agency/login` and `/agency/signup` are
public by necessity — an agency that has not listed yet has no session — and
both bounce a signed-in agency to `/agency`, exactly as `/admin/login` does.

**The required documents are derived, never hardcoded.** What an agency must
file is a function of the categories it picked:
`documentsForCategories()` in `src/features/agency/catalog.ts` unions
`baseDocuments` with each category's extras, de-duplicates them (a guide, a
childcare provider and a medic all want `first_aid_certificate`, and it is
asked for once) and returns them in catalog order so the checklist never
reshuffles between renders. `requiredDocumentsFor()` is the subset that blocks
submission. A screen that lists document kinds of its own goes stale the moment
a category is added — ask the catalog.

**The fixture agencies are invented, under the same standing rule as
`public/images/pros`.** The trading names, legal names, registration numbers,
licence numbers, staff, travellers and jobs in
`src/features/agency/fixtures.ts` are all made up for design. No real company's
registration number and no real person's name or licence belongs in that file.
The two portraits it uses are stock images already shipped here, reused only
for the name they were already cast against. When real agencies sign up they
arrive through the store, and that file is deleted rather than edited.

## Non-negotiables

- **Light, dark and system themes; light is the default** (Owen, 2026-11-08:
  "change the website to light mode"). The header's toggle drives next-themes,
  which sets both `.dark` (this app's tokens) and `data-theme` (the design
  system's). Every screen has to work in both.
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

## The WorldStreet design system (landing page)

The landing page (`(site)` layout: header, sections, footer) is on the
WorldStreet design system, in E-Embassy's own colours.

- **`src/ds/` is vendored. Never edit it.** Refresh it with `pnpm ds:sync` and
  check it with `pnpm ds:check`. Both expect the WorldStreet workspace layout,
  with `design-system/` two folders up. It is excluded from eslint and
  prettier.
- **Its CSS is opt-in.** `globals.css` imports only the tokens and the `.cx-*`
  components, which restyle nothing until a screen uses them. Its `theme.css`
  is deliberately not imported, because it would redefine shared utilities
  (`bg-primary`, `bg-muted`, `rounded-lg`…) under the admin and visa screens.
  The non-colliding subset (`bg-ember`, `rounded-card`, `shadow-cta`,
  `text-h1`…) is declared in the `@theme` block.
- **`data-brand="e-embassy"`** (`src/app/e-embassy-brand.css`) re-colours the
  system blue: `--cx-ember` is `#0050C0`, the secondary is cyan `#00B8F8`,
  text on blue is white, and icon gradients run cyan → blue. Plus a HINT of
  WorldStreet gold (Owen, 2026-11-08): `--ee-gold` #EAB308 as `bg-gold`,
  `text-gold-ink` (#A16207 on light, 4.9:1), `bg-gold-wash`. Accents only, at
  most one gold touch per section (a dot, a rule, a star, a marker stroke),
  never a button fill or a large area. Blue stays the action colour.
- **No dark islands** (Owen, 2026-11-08: "some parts are still dark mode").
  The header, Journey, Agency, Contact and the footer used to pin
  `data-theme="dark"` and stayed dark on the light page. They now follow the
  page theme: pale sky (`bg-brand-50`, white scrims) with ink type in light,
  the old night treatment behind `dark:` in dark. Don't pin a section dark
  again; give it a light face and put its dark look behind `dark:`. Copy that
  sits directly on a photograph (the journey stage's flight path) stays white.
  The Experiences deck's ink, blue and navy cards are a colour rhythm, not a
  dark section.
- **Icon gradients resolve where they are defined.** `<IconDefs brand="e-embassy" />`
  therefore lives inside the brand wrapper in `app/(site)/layout.tsx`. Outside
  it (the `(app)` pages), a gradient-tone icon paints nothing, so use
  `tone="white"` there or add the defs inside that layout's own brand wrapper.
- **Fonts:** Manrope (the system's face) for all sans text, with a single ₦
  glyph from Noto Sans loaded in the root layout. Playfair italic stays as the
  accent, and Fraunces stays for the wordmark.
- **The logo is vector** (`components/common/logo.tsx`). The wings are
  redrawn from the original artwork (the PNGs and
  `E-EMBASSY_MAIN_AW.svg` in `public/images` are raster and now unused),
  and the wordmark is live Manrope text. The wing paths live once in
  `logo-geometry.ts`, which also feeds the share image. `src/app/icon.png` and
  `apple-icon.png` are rendered from the same paths (blue tile, white and cyan
  wings). Each `Logo` takes its gradient ids from `useId`, because a shared id
  resolves to the first copy in the document, and when that copy is hidden
  the wings paint nothing.
- **Headless screenshots look wrong for glass.** Headless Chrome reports
  `prefers-reduced-transparency: reduce`, so the system's glass renders nearly
  solid there. Emulate `no-preference` before judging it.

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

## The hero, and the forecast card is not a feed

The hero is "Cleared for take-off": an inset rounded panel where a visa
application floats in a bright late-morning sky above the cumulus, beside the
copy, gets stamped APPROVED, folds into a paper plane as the visitor scrolls
and flies through the cloud to the Maldives. The copy column (badge, a two-tone `SectionHeading` `h1`, the
lead, the two CTAs) carries `data-hero-stack`, with `HeroForecastCard`
(`sections/hero-forecast-card.tsx`) under it. `hero.jpg` stays in `public/`
because the admin and agency login pages use it.

**One clock.** With motion on, the section is a tall track (260vh from lg,
180vh below) with a sticky panel. One rAF loop in `hero.tsx` reads one scroll
progress p and hands it to both the DOM planes (`applyScene` in
`motion/hero-scene.ts`: sky, far cloud band, copy, card, near wisps, lagoon,
transform and opacity only) and the paper (`motion/hero-paper.tsx`, the hero's
**one** canvas), so the two can never drift. Everything is a pure function of
p, which is what makes scrolling back up unfold the plane into the form again.
The beats live in `TIMELINE` in `hero-scene.ts`. The loop runs only while the
panel is on screen and the tab is visible, and the paper mounts through
`useIdleMount` and fades in on its first frame. `e2e/motion.spec.ts` asserts the
canvas count, because a second one appearing means a layer got mounted that
nobody meant to ship.

**The paper is rigid pieces, not a cloth.** `hero-paper-folds.ts` clips the A4
sheet along each flat crease (Sutherland–Hodgman) and reflects the moving side;
animated, those pieces turn about the crease by 0 to π, which equals the
reflection, so pose and bookkeeping agree. The keel and wings are a half → wing
transform hierarchy on top. Its print (the form, the logo wings, the stamp) is
drawn at runtime in `hero-paper-texture.ts`; the stamp lands as a decal 0.6 s
after the canvas appears, then is baked into the texture. The `APPROVED` stamp
sits low on the right of the sheet on purpose: that is the right wing's top
once folded.

**One daylight world (2026-11-08).** Every plate is one shoot: late morning,
the sun high and out of frame to the upper left, soft cumulus. The paper is
lit to match in `hero-paper.tsx`: a warm-white sun from the upper left, sky
blue from above, cloud bounce from below, soft shading between the folds
(`shadeFolds`, from per-vertex fold data in `pieceGeometry`), aerial haze with
distance and a white contrail with sky-cyan edges. If a plate changes, keep
its light and cloud type, or the paper stops belonging in it. The world is the
same in both themes. Only the copy changes: navy (`brand-950`) on a pale-sky
scrim in light, white on a navy scrim in dark. The chip, the secondary CTA and
the forecast card are theme-following glass (`.glass .glass-frost`, no
`cx-glass-dark`). The chip's dot is the hero's one gold touch.

**Images.** `hero/sky-day.jpg` is the opening sky and the LCP image, and
`hero/lagoon-day.jpg` is the arrival. Both were generated with Antigravity at
its 1376 × 768 limit, upscaled 2× with sharp (Lanczos3 plus a light sharpen)
to 2752 × 1536, and saved at q88 and q77 (both ≤ 400 KB). Both render with
`quality={90}`, which `images.qualities` in `next.config.ts` has to list (Next
16 coerces unlisted qualities). The old plate was 1376 px at 96 KB, served at
q75 and stretched 2.2× on a 1536 px laptop at DPR 2: that was the softness.
The cloud plates are greyscale luminance masks (Chrome 120+, Safari 15.4+;
plain mist without them). The far band is SCREENED over the sky's shade
colour, because a multiply turns daylight cumulus grey. `near-*.jpg` are
pre-blurred copies, so no CSS blur runs per frame. Below lg the lagoon's crop
slides to 72%, and `LAGOON.focus` in `hero-paper.tsx` must match that.
`LAGOON.glide` is where the flight ends, in the plate's own pixels: open water
inside the villas' arc, never on a roof or under the copy. Move it with the
picture.

**Below lg** the copy clears before the launch and the card returns at the
arrival as a short caption (its detail columns hidden). **Reduced motion** has
no pin and no extra height: the base CSS is the complete static scene, and
`hero/paper-plane-day.webp` stands in for the paper. That still is rendered
from the scene itself (`window.__heroPaperStill(4800, 3200)`, development
only, then trimmed), and the same still flies a simple 2D path when WebGL
fails. Re-render it under a new filename if the paper's look changes. The Ask Vivid pill (and, on phones, Vivid's corner button)
waits until the hero's bottom edge is above the middle of the viewport
(`features/vivid/components/use-landing-scroll.ts`), since `scrollY` alone no
longer says the hero has gone.

**`hero.forecast` is static copy in `src/content/landing.ts`, not weather.**
There is no weather API behind this app and the numbers never refresh — the
place, the temperature, the three metrics and the five-day strip are all
placeholder lines, edited exactly like the rest of the copy. Do not wire the
card to a fetch, a hook or an `/api` route that does not exist, and do not
describe it anywhere as live.

The card is revealed from opacity 0 (a CSS rise on load, and below lg the
scroll's arrival), so the usual rule binds it: it must already be correct in
its final state, because reduced motion means neither ever runs. Its root carries `data-hero-forecast` — that is
how the e2e guard finds it, so keep the attribute if you restyle the card.

## Intro, Why us, Passports, Visas: one device each

Owen (2026-11-08) wants the scroll to feel like a sequence of different
experiences, so no two neighbours use the same trick. Each section's markup is
its finished state (reduced motion, no JS); the motion only rewinds and replays
it, scrubbed or state-driven, so every effect reverses on the way back up. Each
has one gold touch.

- **Intro — depth planes** (`intro-route.tsx`). Keep the four photographs and
  their labels: Owen rejected replacing them. Each photo is a plane with its own
  drift (`STEPS[].drift`, px across the section's pass; bigger reads nearer, and
  carries the deeper shadow), plus the kit's `TiltCard` and a hover lift. From
  lg the rail between the labels draws segment by segment and lights each node;
  it ends on a gold dot at "Stay". Below lg: half the drift, nodes light as
  each photo arrives, no rail.
- **Why us — kinetic type** (`why-us.tsx` + `why-us-motion.tsx`). The photo
  cell asks (the two-tone heading); `whyUs.body` answers, set big, one span per
  word, inking from 14% to full opacity as it scrolls through. `whyUs.bodyMark`
  gets the gold marker stroke; it must occur in `body` (a unit test checks).
  The four reason cards settle into the row. The eyebrow on the photo stays
  `.glass-frost-dark`: `e2e/glass.spec.ts` asserts it.
- **Passports — sticky split** (`passports.tsx`, `passports-specimen.tsx` and
  its CSS module, `passports-motion.tsx`). A specimen passport (HTML/SVG, no
  images; "Specimen" on its face, aria-hidden with a description) is sticky
  beside the three situations from lg; each one crossing 60% of the viewport
  sets `data-stage` 1–3 (photo and details type in; dates roll forward and the
  gold chip glints; a new number and the "Issued" stamp). Below lg it plays the
  stages by its own position. Stage transitions are CSS, transform, opacity and
  clip-path only. Its paper uses the brand ramp, which does not flip in dark.
  The values live in `passports.specimen` and are sample data.
- **Visas — the deck** (`visas.tsx` + `visas-picker.tsx`). The destination pills
  are resolved **on the server** by `resolveVisaRoute` (the same ruleset as
  `/apply`), for the passport in `visas.picker.passport`; the picker states
  nothing of its own. The list avoids the ruleset's ETA countries, which are
  wrong for a Nigerian passport (a unit test keeps it that way); the ETA card is
  reached from the deck. Choosing deals that visa's card to the front; a
  visa-free trip lays a "No visa needed" slip over the deck. The deck also takes
  clicks on the cards behind, a horizontal swipe and the arrow buttons. The
  picked pill carries the gold dot. No pin.

## "How it works" is a pinned demo

From lg up, with motion on, `#journey` is about 360vh tall with a sticky panel.
One example trip (Lagos → Dubai, `journey.demo` in `landing.ts`, all sample
data, always labelled "Example trip") plays through the four steps on
mock-ups (`journey-mockups.tsx`, `journey-stage.tsx`), scrubbed by scroll so
scrolling back rewinds it. Below lg and under reduced motion the steps stack,
each mock-up in its final state. The mock-ups are rendered twice (stage and
stacked), one copy always hidden. The Ask Vivid pill steps aside while the
section is on screen (`use-landing-scroll.ts` measures `#journey`).

The panel follows the theme: a daylight sky panel with ink type in light
(lifted off the paper on a soft navy shadow), the night-blue panel with white
type in dark. The mock-ups are kit cards and follow it too: white cards in
light, dark cards in dark. Its one gold touch is the dot beside the
destination code at the end of the flight path.

## The journey panel is layered, not a single gradient

One tall multi-stop gradient banded into visible stripes and read as flat. It is
now four layers, and all four matter:

1. a photograph for texture: the hero's daylight sky (`hero/sky-day.jpg`,
   `journey.backgroundDay`) in light, a dimmed night sky (`journey/panel.jpg`)
   in dark. Each theme hides the other's, so only one is fetched,
2. a soft four-stop wash for the brand colour,
3. two off-centre radial glows so the light has a direction,
4. `.grain`, which dithers the whole thing — remove it and the banding returns.

Step images come from different sources with different casts. `.tint-brand`
pulls their hue toward the palette in `color` blend mode, preserving luminance,
so a warm photograph sits next to a blue button without clashing. Prefer
genuinely cool-toned source images; the tint is a finisher, not a rescue.

## Flights & hotels to the footer: one device each

The second half of the same score (Owen, 2026-11-08). Same rules as the first
half: the markup is the finished state, every effect is scrubbed or
state-driven so it rewinds, transforms/opacity/clip-path only, no pins, no new
canvases, one gold touch each. The section files stay Server Components; the
motion lives in a small client file beside each (`<section>-*.tsx`).

- **Flights & hotels — the tear** (`flights-hotels-stage.tsx`). A boarding
  pass (window-seat photo, `flightsHotels.stage.pass`) tears away along a
  perforated edge as you scroll, and the room key for the same example trip is
  underneath (same Lagos → Dubai trip as `journey.demo`, labelled "Example
  booking"). One progress value sets the pass's `clip-path` polygon, the curl
  shadow riding the tear, the hotel photo's settle and the seat → room rail.
  The tickets use container queries: wide on the stage, tall in half width.
  Reduced motion shows the two tickets side by side. Gold: the "held" dot.
- **Experiences — sticky deck** (`experiences-stack.tsx`). Each card is a
  sticky `<li>` a few px lower than the last, so it slides over the previous
  one, which eases back and dims. The triggers are measured from the list plus
  each card's natural offset, never from the sticky `<li>` (a stuck element
  reports where it is stuck). Reduced motion is a flat 2-up grid. Gold: the
  marker stroke under the heading's last word (`ExperiencesMarker`).
- **WorldSpace — velocity columns** (`worldspace-columns.tsx`). Eight posts:
  4 columns from xl, 3 at lg, 2 at sm (posts 7–8 are `hidden xl:block`), the
  swipe row on a phone. Each column drifts at its own speed and direction, and
  every card leans with scroll speed and settles when the page stops. The drift
  is on a `[data-ws-drift]` wrapper inside each `<li>`; the cards are still the
  plain server-rendered links. The section clips itself (`overflow-hidden`).
  Gold: the placeholder notice's info icon.
- **Agency — a light you carry** (`agency-spotlight.tsx`,
  `agency-figures.tsx`). A brand light follows the pointer over the island
  (screen-blended in dark, a faint normal-blend cyan pool in light, where a
  screen blend vanishes and a multiply turns muddy), and `[data-magnetic]`
  wrappers make the two CTAs lean toward it
  (the wrapper moves, never the `.cx-btn`, whose own transforms stay). With
  touch the light drifts down the band with scroll instead. The figures roll in
  like an odometer; their numbers are derived (`allCategories.length`, the free
  listing, `baseDocuments.length`) and their labels are
  `agencySection.figures` in `content/agency.ts`. Gold: the "0" fee.
- **Contact — kinetic close** (`contact-kinetic.tsx`). The headline is split
  into masked words (`KineticWords`, passed as `SectionHeading`'s `lead` and
  `accent`) that rise into place; a gold star lands after "go."; then the
  card lifts and the six service doors arrive one by one. The star is raised
  with a relative offset, not `vertical-align`, so its line is no taller.
- **FAQ — the calm beat.** Nothing moves on its own. The open row's index is
  gold, closed questions rest at 80% ink, and `faq.more` offers WhatsApp.
- **Footer — the bookend** (`motion/site-footer-plane.tsx`). A plane drawn
  from the logo's wings glides in over the last ~440px of scroll along a dotted
  contrail and lands on the top bar of the ghost EXPLORE's final E, where a
  gold runway light comes on. It is anchored inside the wordmark at
  `bottom: calc(100% - 0.15em)` (the cap line) and `right: 6.5%`, so changing
  `siteConfig.wordmark` or its type means re-aiming it. Reduced motion: the
  plane is simply parked there, light on.

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

The journey panel is one tone top to bottom in each theme (pale sky with ink
type in light, blue with white type in dark), so there is no half-way tone flip
to keep in sync with the gradient. If you change the mid-band of either wash,
re-check that theme's body copy against it.

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
| Anything the agency side reads   | `src/server/agency/store.ts`            |
| A document an agency must file   | `src/features/agency/catalog.ts`        |

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
