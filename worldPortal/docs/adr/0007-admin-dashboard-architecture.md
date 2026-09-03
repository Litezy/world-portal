# ADR 0007: Admin Dashboard Architecture, Mobile-First UI & API Specification

* **Status:** Proposed
* **Date:** 2026-09-03
* **Author(s):** AI Pair Programmer & Development Team

---

## 1. Context & Problem Statement
The World Portal platform processes complex visa documentation, passport application forms, cost evaluations, and multi-tier installment payments. Currently, the admin console (`/admin` in `world-portal-frontend`) supports basic application views and derived client-side statistics.

To support operations at scale across managers, processing staff, and agency partners on both mobile devices and desktops, we require a comprehensive **Admin Dashboard Architecture (ARD)**. 

### Core Strategy: **UI First, API Second**
1. **Phase 1: Mobile-Responsive UI & Design System**: Build out complete, high-fidelity responsive screens, drawer navigation, interactive filters, mobile card reflows, and state management using client-side mock/BFF contracts.
2. **Phase 2: Backend API Endpoints & DB Integrations**: Build out backend endpoints in `worldPortal` for real-time analytics, paginated customer CRM, financial ledgers, refund processing, audit logging, and role-based access controls.

---

## 2. Decision Drivers
* **Mobile-First Responsiveness**: Processing staff and managers frequently review urgent applications on mobile devices. The entire admin console must function seamlessly on screens from 320px to 4K displays.
* **UI-First Development Workflow**: Decouple UI development from backend API changes using frontend BFF handlers (`/api/admin/*`) and mock data states, allowing rapid iteration on UX before solidifying backend schemas.
* **Granular Role-Based Access Control (RBAC)**: Support distinct capabilities for `MANAGER`, `STAFF`, and `PARTNER` accounts across both mobile and desktop screens.
* **Enterprise Audit & Compliance**: Maintain immutable review logs for financial evaluations, application status changes, and refund approvals.

---

## 3. Options Considered
* **Option 1 (Chosen):** UI-First Mobile-Responsive Console with BFF Gateway (Next.js `/api/admin/*` proxying to NestJS API) and responsive table-to-card reflows.
* **Option 2:** Desktop-only admin portal (Rejected; staff need mobile access for real-time cost evaluation and approvals on the go).
* **Option 3:** Heavy API-first schema locking prior to UI prototyping (Rejected; leads to rework when UI evaluation workflows require additional metadata fields).

---

## 4. Mobile Responsiveness Design Specification

### Breakpoints & Layout Rules
* **Mobile (`<640px`)**:
  * Sidebar collapses into a slide-over mobile drawer (`Sheet`) triggered by a sticky header menu icon.
  * Multi-column data tables automatically transform into **stacked detail cards** with quick-action swipe/tap buttons.
  * Sticky bottom action bars for high-frequency actions (e.g., Approve, Evaluate Cost, Reject).
  * Filter controls expand inside a bottom sheet modal (`FilterDrawer`).
* **Tablet (`640px - 1024px`)**:
  * Collapsible icon-only sidebar.
  * 2-column KPI card grid.
  * Horizontally scrollable data tables with sticky leftmost indicator column.
* **Desktop (`>1024px`)**:
  * Fixed ink sidebar console shell (`260px`).
  * 4-column KPI grid with interactive chart cards.
  * Full width responsive data tables with column toggles and bulk actions.

---

## 5. Architectural Checklist

### Phase 1: Mobile-Responsive UI & Frontend Components (UI First)

#### 1. Shell & Navigation Infrastructure
- [ ] **Mobile Sidebar Drawer (`src/components/admin/mobile-nav.tsx`)**: Slide-over drawer with backdrop blur, touch-dismiss, and active route indicators.
- [ ] **Sticky Mobile Header (`src/components/admin/mobile-header.tsx`)**: Brand logo, notifications bell, profile avatar, and drawer toggle.
- [ ] **Responsive Container Utility (`Container`)**: Fluid margins and dynamic viewport math.

#### 2. Overview & Analytics Screen (`/admin`)
- [ ] **KPI Summary Grid**: 4 responsive cards (Active Visas, Pending Passports, Pending Evaluations, Revenue/Balances).
- [ ] **Urgent Action Queue**: Mobile-optimized stack of `SUBMITTED` applications requiring evaluation within 24 hours.
- [ ] **Interactive Chart Components**: Revenue breakdown chart and application status pipeline with visual fallback for reduced motion.

#### 3. Visa Processing Hub (`/admin/applications`)
- [ ] **Mobile Filter Drawer**: Bottom sheet filter inputs (Status, Payment Status, Category, Country, Date range).
- [ ] **Responsive Application Table / Cards**: Data table on desktop; reflows into touch-friendly cards on mobile screens.
- [ ] **Cost Evaluation Sheet**: Slide-up sheet to set total cost (`totalAmount`) and toggle 50% installment permissions (`allowInstallment`).
- [ ] **Document Inspector Modal**: Side-by-side or stacked image preview for Passport Data Page, 6-Month POF, and Photos with pan/zoom on touch devices.
- [ ] **Rejection / Decision Modal**: Quick-select rejection reason template with officer verification notes.

#### 4. Passport Operations Hub (`/admin/passports`)
- [ ] **e-Passport Verification Cards**: Clear display of NIN, eye color, height, Next-of-Kin, and booklet type.
- [ ] **Document Attachment Carousel**: Mobile touch-swipe carousel for Birth Certificate, NIN document, and Passport Photo.
- [ ] **Batch Export Action**: Mobile & desktop trigger to export application records to CSV/PDF.

#### 5. Financials & Payment Operations (`/admin/finance`)
- [ ] **Payment Transaction Ledger**: Mobile list of transaction references, payment options (`FULL` vs `HALF_INSTALLMENT`), and gateway status.
- [ ] **Refund Approval Workflow**: Process refund requests with dynamic 15% surcharge calculation preview.
- [ ] **Platform Fee Config Panel**: Inputs for Partner Markup %, Service Fee %, and Refund Surcharge %.

#### 6. Customer 360 CRM (`/admin/customers`)
- [ ] **Unified Customer Directory**: Mobile searchable list of applicants with total spending and submission history.
- [ ] **Applicant Detail View**: Expandable list of all historic visa & passport applications tied to applicant email/phone.
- [ ] **Customer Notes System**: Add and view internal officer notes.

#### 7. Team & RBAC Management (`/admin/settings`)
- [ ] **Staff & Partner Table**: Responsive list showing user roles (`MANAGER`, `STAFF`, `PARTNER`) and active toggle status.
- [ ] **Role Assignment Modal**: Restrict high-risk actions (Refund approval, Cost evaluation) to `MANAGER` role.

---

### Phase 2: Backend API & Service Specification (API Second)

#### 1. Analytics & Overview Endpoints
- [ ] `GET /api/admin/stats/overview`
  - Returns aggregate counts, pending evaluation queue size, total revenue, and average processing metrics.
- [ ] `GET /api/admin/stats/charts`
  - Returns daily time-series metrics for application volume and revenue distribution.

#### 2. Visa Documentation Operations Endpoints
- [ ] `GET /api/visa-documentation` (Enhanced)
  - Add server-side pagination (`page`, `limit`), sorting, and multi-field filters.
- [ ] `POST /api/visa-documentation/:id/evaluate`
  - Validate manager/staff credentials, update cost fields (`totalAmount`, `allowInstallment`), set `status = EVALUATED`, and enqueue applicant email notification.
- [ ] `PATCH /api/visa-documentation/:id/status`
  - Handle final transition (`APPROVED`/`REJECTED`), update `rejectionReason`, `verificationNotes`, and log audit entry.

#### 3. Passport Application Operations Endpoints
- [ ] `GET /api/passport-application` (Enhanced)
  - Paginated list endpoint with filter options for NIN, passport category, and status.
- [ ] `PATCH /api/passport-application/:id/status`
  - Update status (`UNDER_REVIEW` $\rightarrow$ `APPROVED`/`REJECTED`) with notes.

#### 4. Financial Operations & Refund Endpoints
- [ ] `GET /api/payments/transactions`
  - List payment transactions linked to visa applications and profiles.
- [ ] `GET /api/payments/config` & `PATCH /api/payments/config`
  - Read and update dynamic fees (`partnerMarkupPercentage`, `serviceFeePercentage`, `refundSurchargePercentage`).
- [ ] `POST /api/payments/refunds/:id/process`
  - Process refund requests, calculate net refund after surcharge deduction, and update transaction state.

#### 5. Customer & Audit Trail Endpoints
- [ ] `GET /api/customers`
  - Paginated list aggregating profiles, visa applications, and passport forms.
- [ ] `GET /api/audit-logs`
  - Query audit events by user, action type, or date range.

---

## 6. Consequences & Verification
* **Positive Impact**:
  * 100% mobile-responsive admin operations allow staff to perform urgent cost evaluations and approvals anywhere.
  * Clear UI-first milestone guarantees UX approval before backend contracts are finalized.
* **Test & Verification Plan**:
  * **Frontend Mobile Testing**: Automated Playwright E2E tests across viewport widths (`375px` iPhone SE, `390px` iPhone 14, `768px` iPad, `1440px` Desktop).
  * **Backend Unit & E2E Tests**: NestJS unit tests verifying RBAC permissions (`RolesGuard`) and Prisma query constraints.
