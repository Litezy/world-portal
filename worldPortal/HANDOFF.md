# World Portal — Project Handoff & Roadmap

> Status snapshot as of 2026-08-28, written for the Worldstreet team to pick
> up development from here. It covers what exists across both repos today,
> known gaps/tech debt, and the backlog of new work requested — including
> Vivid AI assistance, email delivery, real account-based auth, and the
> flights/hotels/tourism package services.

Two repos make up the product:
- **`worldPortal`** — NestJS + Prisma/PostgreSQL API. Full endpoint-by-endpoint
  reference lives in [`llms.txt`](./llms.txt) (repo root) — read that before
  touching any route. Architecture decisions are in [`docs/adr/`](./docs/adr/).
- **`world-portal-frontend`** — Next.js marketing site + applicant flows +
  admin console. Conventions, gotchas, and the current API contract are in its
  [`CLAUDE.md`](../world-portal-frontend/CLAUDE.md) — that file is kept
  current by whoever last touched the code and is the source of truth for
  frontend specifics, not duplicated here.

---

## 1. What's done

### Backend (`worldPortal`)

- **Profiles** — CRUD + role management (`MANAGER`/`STAFF`/`PARTNER`), soft
  delete, `GET /profiles/me`.
- **Document upload** — pluggable S3/Cloudinary provider, single generic
  `POST /upload` used by every module that needs a document URL.
- **Visa Requirement lookup** — cached passthrough of a third-party RapidAPI
  service (passports, destinations, visa check, visa map).
- **Visa Documentation** — full lifecycle: public submission → admin cost
  evaluation (with optional 50% installment) → payment → `UNDER_REVIEW` →
  `APPROVED`/`REJECTED`. Public tracking by `applicationNo`.
- **Payments** — transaction initiate/confirm, surcharged refunds, configurable
  markup/service-fee/refund-surcharge percentages. No real payment gateway
  wired in yet — `checkoutUrl` is always `null`; whatever collects money today
  is external to this API.
- **Passport Application** (new this session) — modeled directly on the
  Nigeria Immigration Service e-Passport data form, with the same
  submit → review → approve/reject lifecycle as visa documentation, plus the
  three required document uploads (birth certificate, NIN, white-background
  photo). No cost/payment step on this one yet.
- **Global response envelope** (new this session) — every response is now
  `{ success, data }` on success or `{ success, statusCode, message, errors?
  }` on failure, including proper `422`s with field-keyed validation errors.
  Applied via one global interceptor + exception filter
  (`src/common/`) — no per-controller code needed for it.
- **Auth** — a **mock/dev system only**. `POST /auth/test-token` mints a JWT
  for any email; `ExternalAuthGuard` decodes (does not cryptographically
  verify) it; `RolesGuard` checks the decoded identity against a `Profile`
  row. There is no real login, no password, no registration flow, and
  `EXTERNAL_AUTH_SERVICE_URL` in `.env` is unused dead config. See
  [`llms.txt` §2](./llms.txt) for the full mechanics — this is the single
  biggest thing standing between this backend and a real launch.
- **Dev-only conveniences**: `TEST_MANAGER_TOKEN` in `.env` (a long-lived mock
  token for quick testing), a `POST /auth/test-token` shortcut, and the
  service is currently reachable off-machine via a **Cloudflare Quick
  Tunnel** — not a real deployment (see §3 below).

### Frontend (`world-portal-frontend`)

(Condensed from that repo's `CLAUDE.md` — treat that file as authoritative if
anything here goes stale.)

- **Marketing site** (`(site)`) — Visas is the only fully live service section;
  Flights & Hotels and Experiences & Tours render as "coming soon" with a
  waitlist mailto, full layout already in place.
- **`/apply`** — opens on a client-side visa-requirement question
  (`RouteCheck`) that branches into eVisa / ETA / T.Visa / visa-free flows,
  with a local fallback ruleset so the first screen works even if the API is
  down.
- **`/track`** — public status lookup against `GET
  /visa-documentation/:id`.
- **`/passport`** — currently posts to the frontend's **own internal stub**
  (`app/api/passport-enquiry/route.ts`), which fabricates a `WPP-` reference,
  because the real backend endpoint didn't exist when it was built. **That
  endpoint exists now** (`POST /passport-application`, see §2 below) — this
  needs repointing.
- **`/admin` console** — full BFF architecture: browser talks only to the
  frontend's own `/api/admin/*` route handlers, which hold the backend access
  token server-side and proxy to World Portal. Covers login, applications
  (visa docs), passports, a derived customers view, and team settings.
  Session is an HMAC-signed, `httpOnly` cookie; login itself works by taking
  a fixed `ADMIN_EMAIL`/`ADMIN_PASSWORD` pair, exchanging it for a mock token
  via the backend's `/auth/test-token`, then confirming via `/profiles/me`
  that a real, active `Profile` exists for that identity.
- **Trip planner** (`src/features/trip`) — a client-side-only wizard
  (passport/visa questions → recommended next steps for flights/hotels/
  experiences). No backend calls; those extras route to the "coming soon"
  sections since there's nothing to book yet.

---

## 2. Immediate, low-effort follow-ups (do these first)

1. **Repoint `/passport` on the frontend to the real backend endpoint.**
   `POST /passport-application` now exists with the exact same lifecycle the
   frontend's stub was faking. Swap the mutation, delete
   `app/api/passport-enquiry/route.ts`, and reconcile field names against
   [`llms.txt` §4.7](./llms.txt).
2. **Decide what to do with the unused Clerk keys.** `worldPortal/.env` has
   real-looking `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   values, but nothing in either repo uses Clerk — the admin console ended up
   with a homegrown session-cookie + shared-password scheme instead (see §1).
   Either adopt Clerk properly for the real auth work in §4, or remove the
   dead keys so nobody wastes time investigating them.
3. **Swagger response types don't reflect the new envelope.** `@ApiResponse`
   `type:` annotations across the backend controllers still document the raw
   (unwrapped) resource shape. Cosmetic, but worth a pass so Swagger's UI
   isn't misleading anyone testing directly against it.

---

## 3. Known gaps / tech debt (full detail in `llms.txt` §6)

- **No real authentication.** Covered in depth in §4 below — this is the
  load-bearing gap.
- **No production hosting.** Both apps currently only run on a developer's
  machine; the backend is reachable externally only via an ephemeral
  Cloudflare Quick Tunnel URL that changes on restart. Needs a real host
  (Railway/Render/Fly/AWS/etc.), a CI/CD pipeline, and env var management
  before this can be handed to real users.
- **No real payment gateway.** `payments/initiate` always returns
  `checkoutUrl: null`. Whatever actually collects money today is a manual/
  external process. Needs Paystack/Flutterwave/Stripe (Paystack or
  Flutterwave are the natural fit given the Nigeria-specific NIN/passport
  context) wired into the confirm step.
- **No real background jobs / email dispatch.** `REDIS_HOST`/`REDIS_PORT` are
  configured and BullMQ is referenced in comments, but nothing actually
  enqueues or processes a job — the "email notification" step after cost
  evaluation is a log line. See §5 for the actual email-service ask.
- **CORS is wide open** (`origin: true`) and JWT signatures aren't verified —
  both are fine for the current dev/demo phase but must be tightened before
  any public launch (allowlist real frontend origins; verify tokens against
  whatever real auth provider gets chosen in §4).
- **No admin-facing enquiry/customer/stats resource.** The console derives
  "customers" from applications and computes dashboard stats on the fly
  client-side (frontend `/api/admin/stats`) because the backend has no such
  resource. Worth a real backend endpoint once there's a clearer picture of
  what the team actually wants to see.
- **No review/audit log.** Application status timelines are reconstructed
  from `createdAt`/`evaluatedAt`/`updatedAt` — there's no actual history of
  who changed what and when beyond the single `reviewedBy`/`evaluatedBy`
  fields.
- **Document uploads aren't organized or verified.** Every upload (visa docs,
  passport docs) lands in one flat Cloudinary folder with no
  category/service tagging, and nothing checks that a "photo" upload is
  actually a compliant photo (white background, visible face, etc.) — this
  was discussed earlier in the project and intentionally deferred; revisit
  if photo-quality complaints come up in practice.
- **No pagination anywhere.** Every list endpoint returns its full result set;
  fine at current data volumes, will need addressing before either dataset
  grows large.

---

## 4. Requested new work

### 4.1 Vivid AI integration (visa & passport application assistance)

No code, config, or dependency for this exists in either repo yet — this is
a clean-slate integration. Before implementation starts, the team needs to
pin down:
- What "Vivid AI" actually is (product/vendor name, API docs, auth model,
  pricing) — nothing in this codebase currently references it, so this needs
  sourcing from whoever specified the requirement.
- What "assist" means concretely: a chat widget answering questions during
  `/apply`/`/passport`? Auto-filling form fields from a scanned document?
  Reviewing uploaded documents before submission? Each implies a very
  different integration shape (frontend-only widget vs. a new backend module
  proxying the AI service, similar to how `visa-requirement` proxies
  RapidAPI today).
- Where it plugs into the existing flows without disrupting the
  local-first `RouteCheck` fallback logic the frontend deliberately built for
  when the backend (or a third-party service) is unavailable.

### 4.2 Email service

Nothing is wired up. The backend already has the exact seam for it: the
`evaluateVisaCost` step in `visa-documentation.service.ts` already logs "would
enqueue email notification" at the point a real send should happen. Two
implementation paths:
- **Direct send** — simplest: pick a provider (Resend, Postmark, SES), call it
  synchronously from that same spot.
- **Real queue** — use the `REDIS_HOST`/`REDIS_PORT` config that's already
  sitting unused, actually install and wire up BullMQ, and process email jobs
  asynchronously with retries. More correct for production (an email
  provider hiccup shouldn't fail the cost-evaluation request), more work.
Either way, needs templates for at minimum: cost-evaluation notice, payment
confirmation, and approval/rejection notices — currently applicants only find
out about status changes by polling `GET /visa-documentation/:id` or
`GET /passport-application/:id`.

### 4.3 Real authentication supporting account types

This is the most consequential piece of remaining work. Today: `MANAGER`,
`STAFF`, `PARTNER` exist only as a `role` column on `Profile`, populated
manually via `POST /profiles`, with identity asserted by a mock JWT that
carries no real credential. Needed:
- A real signup/login flow (password or magic-link) per account type, with
  the right one gating access to the right console features (`RolesGuard`
  already exists and works — it just needs a trustworthy identity behind it).
- A decision on **build vs. buy**: adopt the already-provisioned-but-unused
  Clerk keys (fastest path to real auth, but a vendor dependency and a
  rework of how `ExternalAuthGuard` resolves identity), or build real
  password/JWT auth in-house (more control, more work: hashing, email
  verification, password reset, session/refresh token handling — none of
  which exists today).
- Once real accounts exist, `PARTNER` accounts presumably need self-service
  registration (agencies signing up), while `MANAGER`/`STAFF` are probably
  invite-only — that distinction isn't designed yet.

### 4.4 Flights, hotels, and full tourism packages

Frontend UI already has placeholders for all of this (`(site)` "coming soon"
sections, the `src/features/trip` planner that already asks the right
qualifying questions and just has nowhere to send the answers yet). Backend
has nothing — no models, no endpoints, no third-party integration. This is
effectively 2-3 new backend modules (flights, hotels, and a
"package"/bundling layer on top) each needing a real provider decision
(e.g., Amadeus or Duffel for flights, Booking.com/Expedia-style affiliate or
direct hotel APIs) before any code gets written. Suggest scoping this as its
own workstream rather than bolting onto the visa/passport modules — it's a
different domain with different partners and pricing models.

### 4.5 Anything else

The gaps in §3 aren't blocking a demo, but several of them (real auth, real
payment, real hosting, CORS lockdown) **are** blocking a real launch — worth
treating "make this production-ready" as its own tracked piece of work
alongside the net-new features above, not an afterthought once new features
land.

---

## 5. Where to look next

- **API contract, every endpoint, every gotcha**: [`llms.txt`](./llms.txt)
  (backend repo root) — kept in sync with the code, not aspirational.
- **Frontend conventions, routes, and its own gotchas**:
  `world-portal-frontend/CLAUDE.md`.
- **Why things were built the way they were**: `docs/adr/` in this repo
  (profile/account management, S3 upload service, visa documentation
  workflow, payment transaction management, pluggable storage, visa
  requirement integration — each has a technical version and a plain-language
  "for dummies" version).
