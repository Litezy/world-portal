# ADR 0010: Unified Basket & Package Checkout Payment Engine

* **Status:** Approved
* **Date:** 2026-09-13
* **Author(s):** Raphael Etta / Antigravity AI

---

## 1. Context & Problem Statement
The frontend introduces a unified shopping basket (`src/features/basket/store.ts`) where travelers can bundle Visa Documentation processing, Agency Services (security, drivers, catering), and Professional Hire bookings into a single traveler package.

Currently, `PaymentTransaction` in `worldPortal` only links to a single `visaDocumentationId` or `passportApplicationId`. We need to expand the payment engine to handle unified package checkout across Visa applications, Agency assignments, and Professional hire bookings.

## 2. Decision Drivers
* **Multi-Item Booking Checkout:** Single unified checkout transaction combining multiple services.
* **Backward Compatibility:** Preserving existing single Visa and Passport payment transaction flows.
* **Audit Trail:** Clear ledger mapping itemized totals to transaction references.

## 3. Proposed Architecture & Design
- Update `PaymentTransaction` in `schema.prisma` with optional relations for `agencyAssignmentId` and `hireBookingId`, plus itemized package metadata (`packageItemsJson`).
- Extend `PaymentService`:
  - `createCheckoutTransaction(dto)` handling multi-item packages.
  - Automatic invoice calculation and receipt generation.

## 4. Consequences & Verification
- **Positive Impact:** Single seamless checkout for travelers booking multiple services.
- **Verification:** Unit tests in `payment.service.spec.ts` covering package transaction creation.
