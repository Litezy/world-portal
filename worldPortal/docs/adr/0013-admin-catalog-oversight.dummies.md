# ADR 0013 for Dummies: Admin Oversight for Agencies & Professionals

* **Status:** Proposed (Awaiting User Approval)
* **Date:** 2026-09-13
* **What is this document?** A simple, plain-English summary of ADR 0013.

---

## What is the goal?
Right now, travellers can hire professionals and agencies on the website. But the **Admin Team (`/admin`)** doesn't have a place to look at **ALL the Agencies** and **ALL the Professionals** in one screen to verify their documents and approve them.

This change gives administrators a complete, searchable control panel to view every Agency and Professional on the platform and verify them with one click.

---

## What are we building?

1. **Admin Agency Management (`/admin/agencies`)**:
   - A list of all agencies showing their business name, registration number, country, staff count, and status badge.
   - An "Approve / Verify" button to approve unverified agencies.

2. **Admin Professionals Management (`/admin/professionals`)**:
   - A list of all hire professionals showing their portrait, title, city, rate per hour, completed jobs, and verification badge.
   - A toggle switch to mark professionals as "Verified".

3. **Backend API Endpoints**:
   - `GET /api/agency`: Lists all agencies with search and filters.
   - `PATCH /api/agency/:id/verify`: Updates an agency's verification status.
   - `GET /api/hire/professionals/admin`: Lists all professionals for admins.
   - `PATCH /api/hire/professionals/:id/verify`: Toggles professional verification.

---

## How will this be tested?
- Automated test suites will verify that backend search and status toggle endpoints work without errors.
- Visual checks will confirm that `/admin/agencies` and `/admin/professionals` render cleanly on mobile phones, tablets, and desktops.
