# ADR 0014: WorldStreet Applicant Authentication

* **Status:** Approved (by the product owner in chat, 2026-09-23)
* **Date:** 2026-09-23
* **Author(s):** AI Agent & Development Team

---

## 1. Context & Problem Statement
E-Embassy is a child service of WorldStreet (`worldstreetgold.com`). Every WorldStreet user should automatically be able to use E-Embassy — onboard and apply — without a second account.

Before this change, applicants had no real identity:
* the frontend "session" was a zustand store in `localStorage` with a fabricated token;
* applicant data was read by email in the URL (`GET /visa-documentation/applicant/:identifier`, same for passports and hire bookings) with no authentication — ADVISORY_REVIEW **AR-03**;
* submissions were gated only by a one-time email code.

WorldStreet already runs a shared Clerk instance that its other services (worldhealth, worldwork, xtreme, prediction, the wallet) use. The reference contract is `worldhealth/docs/worldstreet-service-authentication.md`.

## 2. Decision Drivers
* **One identity across WorldStreet** — the Clerk user id is the only person key; no local passwords, no E-Embassy login page.
* **Close AR-03** — applicant records must be scoped to a verified session, not to an email typed into a URL.
* **Minimal onboarding** — joining is recording that a WorldStreet user has started using E-Embassy (product owner's decision).
* **Consoles unchanged** — `/admin` and `/agency` keep their existing sessions for now (product owner's decision); AR-01 on `ExternalAuthGuard` is left for a follow-up.

## 3. Considered Options
* **Option 1 (Chosen):** Join WorldStreet's Clerk instance. The Next frontend shares the Clerk session cookie on `*.worldstreetgold.com`; the NestJS API verifies the forwarded Clerk session JWT with `@clerk/backend` and keys applicant data by Clerk user id.
* **Option 2:** Clerk satellite mode (as xtreme/prediction do). Rejected for now — satellites are for a *different* root domain; E-Embassy will live on a `worldstreetgold.com` subdomain like worldhealth.
* **Option 3:** Keep email OTP and add an E-Embassy JWT. Rejected — a second identity per person and a login page WorldStreet already owns.

## 4. Proposed Architecture & Design

### Frontend (`world-portal-frontend`)
* `ClerkProvider` in the root layout, `signInUrl` / `signUpUrl` pointing at WorldStreet (`NEXT_PUBLIC_CLERK_SIGN_IN_URL`, default `https://www.worldstreetgold.com/login`).
* `src/proxy.ts` dispatches three audiences: `/admin` and `/agency` (and their `/api` proxies) keep their own HMAC-cookie guards and never touch Clerk; everything else runs through `clerkMiddleware`, and `/applicant`, `/apply`, `/passport` call `auth.protect()` — a signed-out visitor goes to WorldStreet's login with `redirect_url` back.
* `useApplicantSession()` replaces the localStorage store; `WorldStreetSignInDialog` replaces the OTP modal.
* The `(applicant)` layout calls `POST /me/join` server-side on entry.
* New route handlers `GET /api/me/applications`, `GET /api/me/hires` forward the Clerk session token; the email-in-URL handlers are deleted. `POST /api/hire/bookings` and `/api/passport-enquiry` forward the token; the visa submission sends it from the browser.
* The visa and passport forms fill the email from the WorldStreet account (read-only) and drop the OTP step.

### Backend (`worldPortal`)
* `ClerkTokenVerifier` (`@clerk/backend` `verifyToken`, networkless with `CLERK_JWT_KEY`, `CLERK_AUTHORIZED_PARTIES` enforced when set) and `ClerkAuthGuard` → `request.applicant = { clerkUserId }`, read with `@CurrentApplicant()`.
* `ClerkIdentityService` reads name/email per request from Clerk (60 s cache); a Clerk 404 is `null`, anything else rethrows.
* `ApplicantModule` / `ApplicantService`:
  * `join()` — idempotent upsert of `Applicant { clerkUserId @unique, joinedAt, suspended }`, then attaches unowned visa/passport/hire records whose email matches the **verified** WorldStreet email.
  * `requireActiveApplicant()` — the single guard for applicant writes: joins if needed, refuses suspended applicants and accounts without a verified email, returns `{ clerkUserId, email }`.
* `MeModule` — `POST /me/join`, `GET /me`, `GET /me/applications`, `GET /me/applications/:reference`, `GET /me/hires`; all behind `ClerkAuthGuard`, all scoped to the caller.
* `POST /visa-documentation`, `POST /passport-application`, `POST /hire/bookings` now require `ClerkAuthGuard`; the record is stamped with `clerkUserId` and filed under the verified email (the OTP check remains only for owner-less internal calls).
* Removed: `GET /visa-documentation/applicant/:identifier`, `GET /passport-application/applicant/:identifier`, `GET /hire/bookings/applicant/:identifier`.
* Prisma: new `Applicant` model; nullable, indexed `clerkUserId` on `VisaDocumentation`, `PassportApplication`, `HireBooking`.

### Environment
| Service | Variable | Notes |
|---|---|---|
| Frontend | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | WorldStreet's instance; build-time |
| Frontend | `CLERK_SECRET_KEY` | runtime |
| Frontend | `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_WORLDSTREET_URL` | default to the production hub |
| Backend | `CLERK_SECRET_KEY` (and/or `CLERK_JWT_KEY`) | same instance; absent ⇒ every applicant request is refused |
| Backend | `CLERK_AUTHORIZED_PARTIES` | comma-separated E-Embassy origins |

## 5. Consequences
* **Positive Impact:** one WorldStreet login; AR-03 closed for applicants; no applicant passwords or OTP login; records attach to accounts automatically.
* **Negative Impact / Trade-offs:**
  * The app requires Clerk keys to serve any non-console page, including in CI.
  * Signing out ends the WorldStreet session everywhere (it is shared).
  * Applying on behalf of someone with a different email is no longer possible — the application email is the account's.
  * `ExternalAuthGuard` (admin) still decodes without verifying — AR-01 remains open.
  * Database: apply with `prisma db push` (the migration history predates the agency/hire/notification tables).

## 6. Verification & Test Plan
* **Unit Tests (backend):** `clerk-token.verifier.spec`, `clerk-auth.guard.spec`, `applicant.service.spec` (idempotent join, verified-email linking only, suspension, unknown identity), `me.service.spec` (scoping, 404 for other accounts), updated visa controller/service and hire service specs.
* **Unit Tests (frontend):** `config/__tests__/auth.test.ts`, `server/__tests__/proxy.test.ts` (consoles never reach Clerk), `server/__tests__/me-routes.test.ts` (401 without a session, token forwarded, refusals passed through).
* **E2E Tests:** `e2e/worldstreet-auth.spec.ts` (signed-out hand-off, public pages, console login, 401). The signed-in `/apply` specs run when `E2E_CLERK_USER_EMAIL` and the dev instance keys are set (`e2e/support/applicant.ts`) and skip otherwise.
