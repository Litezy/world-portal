# ADR for Dummies: 0006 - Global Passport & Visa Requirement Data Integration


* **Status:** Approved
* **Date:** 2026-08-27
* **Target Audience:** Non-technical stakeholders, Product Managers, Operations Staff

---

## 1. What problem are we solving?
Travel applicants, partners, and operational staff need accurate, up-to-date information on international visa rules and supported passports. Manually updating visa requirements for over 200 countries is error-prone and time-consuming. We need an automated integration with a global visa intelligence database to look up passports and check visa rules instantly.

## 2. What is changing?
* **Automated Passport List:** World Portal can now fetch the full official list of passports with their country codes (ISO alpha-2, ISO alpha-3, and country name).
* **Instant Visa Requirement Checks:** The portal can query visa policies between any origin passport (e.g. US, UK, Nigeria) and destination country (e.g. Japan, France).
* **Smart Server Caching:** Passport list data is cached on our server so repeated requests do not slow down the app or waste external API quota.

## 3. Why are we doing this?
* **Speed & Accuracy:** Applicants receive immediate feedback on whether they need a visa, e-Visa, or visa-free access.
* **Streamlined Application Workflow:** Reduces manual paperwork review by pre-checking visa rules before application submission.
* **Security:** API keys and external communication are securely handled on the backend server.

## 4. How does it work (in simple terms)?
1. A user selects their passport (e.g., `United States / USA`) and destination country (e.g., `Japan / JPN`).
2. World Portal contacts our backend service, which queries the RapidAPI Visa Requirement service.
3. The system returns official rules (e.g., `Visa Free for 90 days`) directly to the user interface.

## 5. What are the key risks or things to watch out for?
* **External API Key & Quota:** Requires valid RapidAPI subscription keys in environment configuration (`.env`). Server-side caching reduces API calls to ensure high availability.
