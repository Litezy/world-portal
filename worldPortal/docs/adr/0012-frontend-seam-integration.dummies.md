# ADR for Dummies: 0012 - Connecting Frontend Screens to Backend APIs

* **Status:** Approved
* **Date:** 2026-09-13
* **Target Audience:** Non-technical stakeholders, Product Managers, Operations

---

## 1. What problem are we solving?
Currently, the website screens for the Agency Portal, Professionals Hire directory, and Shopping Cart show temporary mock data stored inside the web app itself.

We are connecting all frontend screens to call the real backend server APIs (`worldPortal`) so that any agency registrations, staff assignments, professional bookings, or payments are saved directly in the real database.

## 2. What is changing?
* **Agency Console:** All agency forms, staff lists, documents, and payout views will fetch and save live data from the database.
* **Hire Directory:** Browsing and searching professionals will load real professionals stored in the database.
* **Cart Checkout:** Travelers paying for bundled packages will submit real payment transactions to the backend payment engine.

## 3. Why are we doing this?
* Provides full end-to-end integration between the website interface and database services.
