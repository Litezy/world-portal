# ADR 0012: Frontend Seam Integration with NestJS Backend Services

* **Status:** Approved
* **Date:** 2026-09-13
* **Author(s):** Raphael Etta / Antigravity AI

---

## 1. Context & Problem Statement
The backend services for Agency Portal (`worldPortal/src/agency/`), Hire Professionals (`worldPortal/src/hire/`), and Package Checkout (`worldPortal/src/payment/`) have been implemented, tested, and deployed to PostgreSQL.

Currently, the Next.js frontend (`world-portal-frontend`) still reads from local mock fixture files (e.g. `src/server/agency/store.ts` and `src/content/professionals.ts`). We must connect the frontend seams to execute live HTTP requests to the NestJS API endpoints (`http://localhost:3001/api/*`).

## 2. Decision Drivers
* **Architectural Seam Preservation:** Replace internal mock functions in `src/server/agency/store.ts` and `src/server/hire/client.ts` so that no React components, hooks, or page UI files require modifications.
* **Environment Configuration:** Use `serverEnv.BACKEND_API_URL` / `NEXT_PUBLIC_API_URL` (defaulting to `http://localhost:3001/api`) for seamless dev/prod switching.
* **Error Resilience:** Graceful error handling and fallback reporting if backend services are unreachable.

## 3. Proposed Architecture & Seam Integration Details

### Seam 1: Agency Console Store (`world-portal-frontend/src/server/agency/store.ts`)
* Replace in-memory array operations (`db.agencies`, `db.staff`, `db.assignments`, `db.payouts`, `db.documents`) with HTTP `fetch()` calls to NestJS `/api/agency/*` endpoints:
  * `agencyRecord()` -> `GET /api/agency/:id`
  * `overviewOf()` -> `GET /api/agency/:id/overview`
  * `staffOf()` -> `GET /api/agency/:id/staff`
  * `documentsOf()` -> `GET /api/agency/:id/documents`
  * `assignmentsOf()` -> `GET /api/agency/:id/assignments`
  * `payoutsOf()` -> `GET /api/agency/:id/payouts`
  * `addStaff()` -> `POST /api/agency/:id/staff`
  * `uploadDocument()` -> `POST /api/agency/:id/documents`
  * `assignStaff()` -> `POST /api/agency/:id/assignments/:id/assign`

### Seam 2: Hire Directory API (`world-portal-frontend/src/app/api/hire/professionals/route.ts`)
* Connect Next.js API route handler to proxy/fetch from NestJS `GET /api/hire/professionals` and `GET /api/hire/professionals/:id`.

### Seam 3: Cart Package Checkout (`world-portal-frontend/src/features/basket/store.ts`)
* Connect checkout drawer submission to `POST /api/payments/checkout-package`.

## 4. Consequences
* **Positive Impact:** Live end-to-end data flow between Next.js frontend and NestJS backend database.
* **Verification:** E2E testing of Agency onboarding, Hire directory filtering, and Cart package checkout.
