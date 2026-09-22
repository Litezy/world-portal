# World Portal Backend & Frontend Integration Checklist

* **Document Version:** 5.0.0
* **Date:** 2026-09-13
* **Status:** Active Tracking Document
* **Permanent Path:** [`worldPortal/docs/CHECKLIST.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/CHECKLIST.md)

---

## Phase 1: Agency Portal Backend Module (Priority 1) — **COMPLETED**
- [x] **1.1 Architecture & ADR Documentation**
  - [x] Technical Architecture Decision Record: [`worldPortal/docs/adr/0008-agency-portal-backend-architecture.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/0008-agency-portal-backend-architecture.md)
  - [x] ADR for Dummies: [`worldPortal/docs/adr/0008-agency-portal-backend-architecture.dummies.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/0008-agency-portal-backend-architecture.dummies.md)
  - [x] Index ADR 0008 in [`worldPortal/docs/adr/README.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/README.md)
- [x] **1.2 Database Schema & Prisma Client**
  - [x] Add Agency Enums & Relational Models to [`worldPortal/prisma/schema.prisma`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/prisma/schema.prisma)
  - [x] Run `npx prisma validate` & `npx prisma generate`
- [x] **1.3 DTOs & Validation Schemas (`worldPortal/src/agency/dto/`)**
- [x] **1.4 NestJS Business Logic Layer (`worldPortal/src/agency/agency.service.ts`)**
- [x] **1.5 NestJS REST Controller (`worldPortal/src/agency/agency.controller.ts`)**
- [x] **1.6 Module Integration (`worldPortal/src/app.module.ts`)**
- [x] **1.7 Automated Test Coverage (`agency.service.spec.ts` - 5/5 passed)**

---

## Phase 2: Hire & Professional Services Backend Module — **COMPLETED**
- [x] **2.1 Architecture & ADR Documentation**
  - [x] Technical Architecture Decision Record: [`worldPortal/docs/adr/0009-hire-professional-services-backend-architecture.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/0009-hire-professional-services-backend-architecture.md)
  - [x] ADR for Dummies: [`worldPortal/docs/adr/0009-hire-professional-services-backend-architecture.dummies.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/0009-hire-professional-services-backend-architecture.dummies.md)
  - [x] Index ADR 0009 in [`worldPortal/docs/adr/README.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/README.md)
- [x] **2.2 Prisma Schema Extension**
  - [x] Add `ProfessionalProfile`, `HireBooking`, and `ProfessionalRating` models to [`worldPortal/prisma/schema.prisma`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/prisma/schema.prisma)
  - [x] Run `npx prisma validate` & `npx prisma generate`
- [x] **2.3 NestJS `HireModule` Implementation (`worldPortal/src/hire/`)**
- [x] **2.4 Automated Test Coverage (`hire.service.spec.ts` - 5/5 passed)**

---

## Phase 3: Unified Basket & Booking Checkout Engine — **COMPLETED**
- [x] **3.1 Architecture & ADR Documentation**
  - [x] Technical Architecture Decision Record: [`worldPortal/docs/adr/0010-basket-checkout-payment-engine.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/0010-basket-checkout-payment-engine.md)
  - [x] ADR for Dummies: [`worldPortal/docs/adr/0010-basket-checkout-payment-engine.dummies.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/0010-basket-checkout-payment-engine.dummies.md)
  - [x] Index ADR 0010 in [`worldPortal/docs/adr/README.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/README.md)
- [x] **3.2 Payment System Extension (`worldPortal/src/payment/`)**
- [x] **3.3 Automated Test & Build Verification (`payment.service.spec.ts` - 7/7 passed)**

---

## Phase 4: WorldSpace External API Proxy Integration — **COMPLETED**
- [x] **4.1 Architecture & ADR Documentation**
  - [x] Technical Architecture Decision Record: [`worldPortal/docs/adr/0011-worldspace-api-proxy-integration.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/0011-worldspace-api-proxy-integration.md)
  - [x] ADR for Dummies: [`worldPortal/docs/adr/0011-worldspace-api-proxy-integration.dummies.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/0011-worldspace-api-proxy-integration.dummies.md)
  - [x] Index ADR 0011 in [`worldPortal/docs/adr/README.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/README.md)

---

## Phase 5: Frontend Seam Integration — **COMPLETED**
- [x] **5.1 Architecture & ADR Documentation**
  - [x] Technical Architecture Decision Record: [`worldPortal/docs/adr/0012-frontend-seam-integration.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/0012-frontend-seam-integration.md)
  - [x] ADR for Dummies: [`worldPortal/docs/adr/0012-frontend-seam-integration.dummies.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/0012-frontend-seam-integration.dummies.md)
  - [x] Index ADR 0012 in [`worldPortal/docs/adr/README.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/README.md)
- [x] **5.2 Agency Console Store Seam (`src/server/agency/store.ts`)**
  - [x] Connect `agencyRecord()`, `overviewOf()`, `staffOf()`, `documentsOf()`, `assignmentsOf()`, `payoutsOf()` to `http://localhost:3001/api/agency/*`
- [x] **5.3 Hire Directory Seam (`src/app/api/hire/professionals/route.ts`)**
  - [x] Connect Next.js route handler to `http://localhost:3001/api/hire/professionals`
- [x] **5.4 Cart Package Checkout Seam (`src/app/api/payments/checkout-package/route.ts`)**
  - [x] Connect basket checkout submission to `http://localhost:3001/api/payments/checkout-package`
- [x] **5.5 Remote Data Seeding API (`POST /api/seed`)**
  - [x] API endpoint implemented with secret code `WORLD_PORTAL_SEED_2026_SECURE` and 33 presentation demo records initialized (10 Agencies, 10 Agency Users, 10 Professionals, Staff, Documents, Visa/Passport Applications). Default password: `Password@2`.

---

## Phase 6: Admin Catalog Oversight for Agencies & Professionals — **COMPLETED**
- [x] **6.1 Architecture & ADR Documentation**
  - [x] Technical Architecture Decision Record: [`worldPortal/docs/adr/0013-admin-catalog-oversight.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/0013-admin-catalog-oversight.md)
  - [x] ADR for Dummies: [`worldPortal/docs/adr/0013-admin-catalog-oversight.dummies.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/0013-admin-catalog-oversight.dummies.md)
  - [x] Index ADR 0013 in [`worldPortal/docs/adr/README.md`](file:///Users/ettaraphael/Documents/nest-app/worldportalv2/worldPortal/docs/adr/README.md)
- [x] **6.2 Backend Agency & Professional Admin APIs (`worldPortal/src/agency/` & `src/hire/`)**
  - [x] `GET /api/agency` admin endpoint with pagination, status filters, and search
  - [x] `PATCH /api/agency/:id/verify` endpoint for status updates
  - [x] `GET /api/hire/professionals/admin` endpoint returning all professionals
  - [x] `PATCH /api/hire/professionals/:id/verify` endpoint to toggle verification
- [x] **6.3 Admin Console UI Hubs (`world-portal-frontend/src/app/(admin)/admin/`)**
  - [x] Admin Agencies Management Hub (`/admin/agencies`)
  - [x] Admin Professionals Management Hub (`/admin/professionals`)
  - [x] Navigation sidebar links added to desktop and mobile drawer

---

## Phase 7: End-to-End Backend Integration Checklist (Missing Seams) — **COMPLETED**

### 7.1 Agency Console & Auth Seams (`/api/agency/*`) — **COMPLETED**
- [x] **7.1.1 Agency Registration & Login (`/api/agency/auth/*`)**
  - Connect `registerAgency` to NestJS `POST /api/agency`
  - Connect `authenticateAgency` to query NestJS Agency database
- [x] **7.1.2 Agency Dashboard Overview (`/api/agency/overview`)**
  - Proxy headline overview metrics to NestJS `GET /api/agency/:id/overview`
- [x] **7.1.3 Staff Roster (`/api/agency/staff`)**
  - Proxy staff list & add staff to NestJS `GET/POST /api/agency/:id/staff`
- [x] **7.1.4 Compliance Documents (`/api/agency/listing/documents`)**
  - Proxy document uploads to NestJS `POST /api/agency/:id/documents`
- [x] **7.1.5 Booking Assignments (`/api/agency/assignments`)**
  - Proxy assignments & staff allocation to NestJS `GET /api/agency/:id/assignments` & `POST /api/agency/:id/assignments/:assignmentId/assign`
- [x] **7.1.6 Payout History (`/api/agency/payouts`)**
  - Proxy payouts list to NestJS `GET /api/agency/:id/payouts`

### 7.2 Visa & Passport Applications Admin Seams (`/admin/applications` & `/admin/passports`) — **COMPLETED**
- [x] **7.2.1 Visa Applications Management**
  - Verify proxy to NestJS `GET /visa-documentation` & application decision evaluation
- [x] **7.2.2 Passport Applications Management**
  - Verify proxy to NestJS `GET /passport-application` & bank transfer payment confirmation

### 7.3 OTP Verification Seam (`/api/otp/*`) — **COMPLETED**
- [x] **7.3.1 Mobile OTP Proxy**
  - Connect OTP send & verify routes to NestJS API


