# ADR 0013: Admin Catalog Oversight for Agencies & Professional Services

* **Status:** Proposed (Awaiting User Approval)
* **Date:** 2026-09-13
* **Author(s):** AI Pair Programmer & Lead System Architect

---

## 1. Context & Problem Statement
The World Portal platform now features 10+ registered Agencies (`Agency` module) and 10+ destination Professionals (`HireModule`). While public consumers can browse verified listings, administrative officers (`/admin`) currently lack central management dashboards to list, review compliance paperwork, search, filter, and approve/verify Agencies and Professional Service providers.

To ensure quality control, platform safety, and seamless onboarding, the admin console requires dedicated oversight hubs for both **Agencies** and **Professional Services**.

---

## 2. Decision Drivers
* **Platform Security & Compliance**: Officers must inspect uploaded agency licenses, tax documents, and staff counts before approving listings.
* **Unified Administrative Oversight**: Provide clear, searchable, paginated table/card interfaces for all Agencies and Professionals regardless of public listing status.
* **Granular Verification Controls**: Enable single-click status updates (`unverified` $\rightarrow$ `pending` $\rightarrow$ `verified` / `rejected`) for Agencies and boolean `isVerified` toggles for Professionals.
* **Mobile-First Responsiveness**: Ensure admin officers can manage agency and professional approvals seamlessly on mobile devices, tablets, and desktop displays.

---

## 3. Architecture & Data Flow

```mermaid
flowchart TD
    AdminUI["Admin Console (world-portal-frontend)\n/admin/agencies & /admin/professionals"]
    BFFProxy["Next.js Route Handlers\n/api/admin/agencies & /api/admin/professionals"]
    NestJSBackend["NestJS Backend (worldPortal :4000)\nAgencyController & HireController"]
    Database[("Neon PostgreSQL\nPrisma Agency & ProfessionalProfile")]

    AdminUI -->|1. Filter & Search Queries| BFFProxy
    BFFProxy -->|2. HTTP GET /api/agency & /api/hire/professionals/admin| NestJSBackend
    NestJSBackend -->|3. Prisma Query (All Records)| Database
    Database -->|4. Unfiltered/Paginated Result| NestJSBackend
    NestJSBackend -->|5. JSON Response| BFFProxy
    BFFProxy -->|6. Render Table/Cards| AdminUI
```

---

## 4. Proposed Changes & Specifications

### 4.1 Backend Module Enhancements (`worldPortal`)
1. **`AgencyController` (`src/agency/agency.controller.ts`)**:
   - `GET /api/agency`: Admin endpoint returning all agencies with filters (`status`, `verification`, `search`, `page`, `limit`).
   - `PATCH /api/agency/:id/verify`: Admin endpoint updating `verification` status (`unverified`, `pending`, `verified`, `rejected`) and `listingStatus`.
2. **`HireController` (`src/hire/hire.controller.ts`)**:
   - `GET /api/hire/professionals/admin`: Admin endpoint returning all professionals (both verified and unverified) with pagination.
   - `PATCH /api/hire/professionals/:id/verify`: Admin endpoint updating `isVerified` boolean flag.

### 4.2 Frontend Admin Console Enhancements (`world-portal-frontend`)
1. **Admin Navigation (`src/config/navigation.ts` & `src/components/admin/mobile-nav.tsx`)**:
   - Add **Agencies** (`/admin/agencies`) and **Professionals** (`/admin/professionals`) links to the Admin navigation sidebar and mobile menu drawer.
2. **Agencies Overview & Management Hub (`src/app/(admin)/admin/agencies/page.tsx`)**:
   - Table/Card list showing Agency Name, Legal Name, Country/Cities, Category Tags, Staff Count, Verification Badge, and Quick Actions (Verify/Reject/View Documents).
3. **Professionals Directory & Moderation Hub (`src/app/(admin)/admin/professionals/page.tsx`)**:
   - Table/Card list showing Professional Name, Title, Profession Category, Location, Hourly Rate, Completed Jobs, Verification Status Toggle, and Rating.

---

## 5. Consequences & Verification Plan

### Positive Impacts
* Admin officers gain 100% real-time visibility over all registered Agencies and Professionals.
* One-click verification workflows streamline seller onboarding and compliance verification.

### Automated & Manual Verification
1. **NestJS Unit Tests**: Add test suites for `GET /api/agency` admin search and `PATCH /api/agency/:id/verify`.
2. **Frontend Type Checks**: `npx tsc --noEmit` on `world-portal-frontend`.
3. **Runtime Verification**: Test admin views at `http://localhost:3000/admin/agencies` and `http://localhost:3000/admin/professionals`.
