# Presentation Seed Data Plan: World Portal Database Seeding

* **Document Version:** 3.0.0
* **Date:** 2026-09-13
* **Status:** Approved Specification

---

## 1. Objective

To provide rich, realistic, presentation-ready demo data in the database (`worldPortal`) so that stakeholders, managers, and partners can experience full end-to-end demonstrations across all platform portals.

Instead of running local CLI scripts, seeding is triggered remotely on-demand via a **single secured REST API endpoint**.

---

## 2. Seeding REST API & Authorization Specification

### **Endpoint:** `POST /api/seed`
* **Access:** Public REST endpoint protected by an Authorization Secret Code.
* **Default Account Passwords:** `Password@2` (all seeded user and agency accounts).

### **Authorization Secret Code**
> [!IMPORTANT]
> **Secret Code:** `WORLD_PORTAL_SEED_2026_SECURE`
> 
> To trigger the seeding process, pass this exact secret code in the JSON request body.

### **Request Payload Format**
```json
{
  "secretCode": "WORLD_PORTAL_SEED_2026_SECURE"
}
```

---

## 3. Comprehensive Demo Data Breakdown (10+ Agencies & 10+ Professionals)

### A. Agency Portal Entities (10 Registered Agencies)

1. **Apex Security Services** (`apex-security-services`) — Security (Lagos, Nigeria) | Status: `VERIFIED` & `LIVE`
2. **Vanguard Executive Transit** (`vanguard-executive-transit`) — Driving (Abuja, Nigeria) | Status: `PENDING` & `IN_REVIEW`
3. **Lagos Culinary & Event Chefs** (`lagos-culinary-chefs`) — Catering (Lagos, Nigeria) | Status: `UNVERIFIED` & `DRAFT`
4. **Horizon Escort & Logistics** (`horizon-escort-logistics`) — Logistics (Lagos, Nigeria) | Status: `VERIFIED` & `LIVE`
5. **Tokyo Diplomatic Interpreters** (`tokyo-diplomatic-interpreters`) — Interpreting (Tokyo, Japan) | Status: `VERIFIED` & `LIVE`
6. **Santorini Sunset Events** (`santorini-sunset-events`) — Events (Santorini, Greece) | Status: `VERIFIED` & `LIVE`
7. **Sahara Adventure Guides** (`sahara-adventure-guides`) — Tour Guide (Marrakech, Morocco) | Status: `VERIFIED` & `LIVE`
8. **Cape Town Childcare Specialists** (`capetown-childcare-specialists`) — Childcare (Cape Town, South Africa) | Status: `VERIFIED` & `LIVE`
9. **Riviera Medical & Wellness Escorts** (`riviera-medical-escorts`) — Medical (Nice, France) | Status: `VERIFIED` & `LIVE`
10. **Highland Pure Cleaning & Sanitation** (`highland-pure-cleaning`) — Cleaning (Edinburgh, UK) | Status: `VERIFIED` & `LIVE`

---

### B. Hire Professionals Directory (10+ Professionals)

1. **Elena Marousi** (Santorini, Greece) — Photographer ($280/shoot, 4.9 ★)
2. **Kenji Watanabe** (Tokyo, Japan) — Street & Documentary Photographer ($240/walk, 4.8 ★)
3. **Putu Ardana** (Bali, Indonesia) — Cinematic Travel Videographer ($390/half-day, 4.9 ★)
4. **Marina Castro** (Rio de Janeiro, Brazil) — Event & Lifestyle Videographer ($340/half-day, 4.8 ★)
5. **Hicham Benali** (Marrakech, Morocco) — Private Chef & Culinary Guide ($210/dinner, 5.0 ★)
6. **Aya Kobayashi** (Tokyo, Japan) — Senior Private Guide & Translator ($65/hr, 4.9 ★)
7. **Bruno Ferreira** (Rio de Janeiro, Brazil) — Executive Chauffeur & Security Driver ($50/hr, 4.8 ★)
8. **Dimitra Kalogeri** (Athens, Greece) — Personal Security Specialist ($85/hr, 5.0 ★)
9. **Lerato Khumalo** (Johannesburg, South Africa) — Event Logistics Coordinator & Chef ($45/hr, 4.7 ★)
10. **Omar Chraibi** (Casablanca, Morocco) — Business Interpreter & Cultural Liaison ($75/hr, 4.9 ★)

---

### C. Visa & Passport Applications

* **Visa Application #1:** John Doe (`VISA-2026-8812`) — UK Tourist Visa (Evaluated: $850.00)
* **Visa Application #2:** Sarah Smith (`VISA-2026-9041`) — UAE Business Visa (Approved: $1,200.00)
* **Passport Application #1:** David Ojukwu (`PASS-2026-4410`) — NIS e-Passport (Evaluated: ₦120,000)

---

### D. Operations Bank Accounts

* **Zenith Bank (USD Operations):** Account Number `5070192834`
* **GTBank (NGN Operations):** Account Number `0129485763`
