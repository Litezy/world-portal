# Master Implementation Plan: Frontend Seam Integration

* **Document Version:** 1.0.0
* **Date:** 2026-09-13
* **Author(s):** Raphael Etta / Antigravity AI
* **Status:** Proposed for Approval
* **Target ADR:** [`docs/adr/0012-frontend-seam-integration.md`](./adr/0012-frontend-seam-integration.md)

---

## 1. Context & Objectives

Now that the NestJS backend services (`AgencyModule`, `HireModule`, `PaymentModule` package engine) are fully implemented, tested, and deployed to PostgreSQL, we must connect the frontend seam layers in `world-portal-frontend` so that the UI operates on live database records.

---

## 2. Integration Seam Roadmap

### Seam 1: Agency Console Data Seam (`src/server/agency/store.ts`)
Update internal store methods to execute HTTP `fetch()` requests against `http://localhost:3001/api/agency/*`:
1. `agencyRecord(agencyId)` -> `GET /api/agency/:id`
2. `overviewOf(agencyId)` -> `GET /api/agency/:id/overview`
3. `staffOf(agencyId)` -> `GET /api/agency/:id/staff`
4. `documentsOf(agencyId)` -> `GET /api/agency/:id/documents`
5. `assignmentsOf(agencyId)` -> `GET /api/agency/:id/assignments`
6. `payoutsOf(agencyId)` -> `GET /api/agency/:id/payouts`
7. `addStaff(agencyId, data)` -> `POST /api/agency/:id/staff`
8. `uploadDocument(agencyId, data)` -> `POST /api/agency/:id/documents`
9. `assignStaff(agencyId, assignmentId, staffIds)` -> `POST /api/agency/:id/assignments/:id/assign`

### Seam 2: Hire Professionals Directory Seam (`src/app/api/hire/professionals/route.ts`)
Connect the Next.js API route to proxy queries to NestJS `GET /api/hire/professionals` and `GET /api/hire/professionals/:id`.

### Seam 3: Cart Package Checkout Seam (`src/features/basket/store.ts`)
Connect the basket checkout submission to `POST /api/payments/checkout-package`.

---

## 3. Verification Plan
- E2E testing of `/agency` screens fetching live database records.
- E2E testing of `/hire` directory browsing live professionals.
- E2E testing of Cart Package Checkout.
