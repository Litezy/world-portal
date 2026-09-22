# ADR 0008: Agency Portal Backend Architecture & Data Store Implementation

* **Status:** Approved
* **Date:** 2026-09-13
* **Author(s):** Raphael Etta / Antigravity AI

---

## 1. Context & Problem Statement
The frontend of World Portal recently introduced a comprehensive **Agency Portal** (`/agency`), allowing service agencies (security, catering, driving, cleaning, tour guiding, etc.) to list their company, upload compliance verification paperwork, manage staff assignments, and track settlements/payouts.

Currently, the frontend interacts with an in-memory mock store (`src/server/agency/store.ts`). All data resets on server restart, and concurrent serverless instances cannot share state. To make the Agency Portal functional in production, we must design and implement a dedicated NestJS `AgencyModule` in `worldPortal`, extend the Prisma database schema, and connect the frontend HTTP client seam to live endpoints.

## 2. Decision Drivers
* **Data Tenancy & Isolation:** Structural isolation ensuring agencies can never query or modify another agency's staff, documents, assignments, or payouts.
* **Seamless Frontend Integration:** Seamlessly drop in backend endpoints into `src/server/agency/store.ts` without modifying React components, forms, or routing handlers.
* **Compliance Verification Workflow:** Secure document storage for business registration, tax certificates, liability insurance, and category-specific licenses.
* **Multi-Currency & Settlement Rules:** Accurate financial tracking of gross booking amounts, platform commission deductions, and net agency payouts.

## 3. Considered Options
* **Option 1: Embed Agency entities directly into existing Profile / User models.**
  * *Drawbacks:* Over-complicates user authorization and confuses personal profiles with corporate/agency legal entities.
* **Option 2: Dedicated Agency Module with relational Prisma models & NestJS Controllers (Selected).**
  * *Pros:* Clear domain boundary, explicit tenant scoping (`agencyId`), extensible schema for service offerings, staff management, and financial payouts.

## 4. Proposed Architecture & Design

### Data Schema (`prisma/schema.prisma`)
Define relational models for Agency management:
* **Enums:**
  * `AgencyVerificationStatus`: `UNVERIFIED`, `PENDING`, `VERIFIED`, `SUSPENDED`
  * `AgencyListingStatus`: `DRAFT`, `SUBMITTED`, `IN_REVIEW`, `LIVE`, `REJECTED`, `PAUSED`
  * `AgencyRole`: `OWNER`, `MANAGER`, `COORDINATOR`
  * `AgencyStaffStatus`: `AVAILABLE`, `ASSIGNED`, `OFF_DUTY`, `INACTIVE`
  * `AssignmentStatus`: `REQUESTED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
  * `AgencyPayoutStatus`: `PENDING`, `PROCESSING`, `PAID`, `ON_HOLD`
* **Models:**
  * `Agency`: Primary entity holding profile, legal name, registration number, country, categories, verification, listing status, commission rate.
  * `AgencyUser`: Authentication user linked to an `Agency` with specific `AgencyRole`.
  * `AgencyDocument`: Compliance documents with status (`MISSING`, `UPLOADED`, `IN_REVIEW`, `APPROVED`, `REJECTED`), expiry date, and reviewer notes.
  * `AgencyServiceOffering`: Offered category services, pricing per unit, lead time, and capacity.
  * `AgencyStaff`: Vetted personnel with status, background check boolean, experience years, and assigned languages.
  * `AgencyAssignment`: Booking assignments linked to travellers and assigned staff.
  * `AgencyPayout`: Financial settlement batches with gross, platform fee, net, and destination account info.

### NestJS Module Architecture (`worldPortal/src/agency/`)
* **`AgencyModule`**: Root feature module declaring controllers, services, and Prisma dependencies.
* **Endpoints Specification:**
  * `POST /api/agency/auth/login` - Authenticate agency user and issue JWT / session token.
  * `GET /api/agency/me` - Fetch profile & tenant context for current authenticated agency user.
  * `GET /api/agency/overview` - Compute real-time headline metrics (open assignments, staff on duty, earned this month, pending payouts, outstanding document count).
  * `GET /api/agency/listing` & `PATCH /api/agency/listing` - Retrieve and update agency listing profile, offerings, and draft status.
  * `GET /api/agency/documents` & `POST /api/agency/documents/upload` - List required paperwork and upload verification files.
  * `GET /api/agency/staff`, `POST /api/agency/staff`, `PATCH /api/agency/staff/:id` - Manage agency staff roster and status.
  * `GET /api/agency/assignments` & `POST /api/agency/assignments/:id/assign` - View bookings and assign staff to traveller requests.
  * `GET /api/agency/payouts` - View payout history and settlement batch details.

## 5. Consequences
* **Positive Impact:** Full multi-tenant data persistence in PostgreSQL, strict access control per agency, seamless frontend cutover, and robust audit trails for compliance document reviews.
* **Trade-offs / Mitigations:** Requires running Prisma migrations on PostgreSQL database.

## 6. Verification & Test Plan
* **Unit Tests:**
  * Test `AgencyService` tenant filter isolation (e.g. verifying Agency A cannot read Agency B's staff).
  * Test commission rate calculation: `netToAgency = gross - (gross * commissionRate)`.
* **E2E Tests:**
  * Complete end-to-end flow: Login -> Submit Listing -> Upload Documents -> Invite Staff -> Assign Staff to Traveller Booking -> Query Overview.
