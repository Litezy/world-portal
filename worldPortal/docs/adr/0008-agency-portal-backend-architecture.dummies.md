# ADR for Dummies: 0008 - Agency Portal Backend Services & Persistence

* **Status:** Approved
* **Date:** 2026-09-13
* **Target Audience:** Non-technical stakeholders, Product Managers, Operations & Compliance Team

---

## 1. What problem are we solving?
Currently, when a service agency (such as a security firm, driving agency, or catering provider) registers on World Portal, their profiles, staff lists, and documents are only saved temporarily in web browser memory. If the server updates or restarts, everything they entered is lost.

We are building a permanent, secure database service on the backend to store all agency listings, staff accounts, verification paperwork, and financial payouts safely.

## 2. What is changing?
* **For Agencies:** All agency data—listing details, staff rosters, uploaded compliance licenses, and payout history—will be saved permanently.
* **For World Portal Operations:** Staff can verify compliance paperwork (business registration, liability insurance, licenses) in real-time and approve agencies before they go live on the portal.
* **For Travellers:** Bookings for agency services will reliably assign real, vetted agency staff members.

## 3. Why are we doing this?
* **Data Safety & Reliability:** Information won't disappear when the site updates or when multiple users access the system at the same time.
* **Security & Privacy:** Each agency can only see their own staff, bookings, and money—preventing company data leaks.
* **Financial Accuracy:** Automatically calculates platform commission fees and tracks exactly how much money is owed to each agency after completing jobs.

## 4. How does it work (in simple terms)?
Imagine a secure digital filing cabinet with separate locked drawers for every registered agency:
1. **The Registration Drawer:** Keeps the agency's company profile, legal tax details, and offered services.
2. **The Verification Folder:** Stores scanned certificates and licenses. Operations staff check these files and flip a switch from "Pending" to "Verified".
3. **The Staff Roster:** Lists all vetted workers (drivers, guards, chefs) available to take jobs.
4. **The Ledger:** Tracks every traveler booking, automatically calculates World Portal's 15% service cut, and records payout transfers to the agency's bank account.

## 5. What are the key risks or things to watch out for?
* **Document Expiry:** Compliance licenses (like driver's licenses or guard certifications) expire over time. The system needs to flag expired paperwork so agencies don't operate illegally.
* **Bank Details:** Payouts require verified bank account details to ensure funds reach the correct company account.
