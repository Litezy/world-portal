# Presentation Seed Data Plan: World Portal Database Seeding

* **Document Version:** 2.0.0
* **Date:** 2026-09-13
* **Status:** Approved Specification

---

## 1. Objective

To provide rich, realistic, presentation-ready demo data in the database (`worldPortal`) so that stakeholders, managers, and partners can experience full end-to-end demonstrations across all platform portals.

Instead of running local CLI scripts, seeding will be triggered remotely on-demand via a **single secured REST API endpoint**.

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

### **Response Payload Format**
```json
{
  "success": true,
  "message": "Database presentation seed executed successfully",
  "summary": {
    "agencies": 3,
    "agencyStaff": 3,
    "agencyDocuments": 5,
    "agencyAssignments": 2,
    "agencyPayouts": 1,
    "professionals": 4,
    "visaApplications": 2,
    "passportApplications": 1,
    "bankAccounts": 2
  }
}
```

---

## 3. Seed Data Breakdown

### A. Agency Portal Entities (`Agency`, `AgencyUser`, `AgencyStaff`, `AgencyDocument`, `AgencyAssignment`, `AgencyPayout`)

#### 1. Agency #1: **Apex Security Services** (Verified & Active)
* **Company Profile:**
  * **Slug:** `apex-security-services`
  * **Legal Name:** Apex Security Nigeria Limited (RC-1048291)
  * **Categories:** Security, Escort Services
  * **Location:** Lagos & Abuja, Nigeria
  * **Headline Summary:** "Premium close-protection and event security agency."
  * **Verification Status:** `VERIFIED` | **Listing Status:** `LIVE`
  * **Commission Rate:** 15% (0.15) | **Rating:** 4.9 ★ | **Completed Jobs:** 42
* **Agency User Account:**
  * **Email:** `owner@apexsecurity.ng`
  * **Password:** `Password@2`
  * **Role:** `OWNER`
* **Staff Roster (2 Members):**
  * **Emmanuel Adebayo** — Senior Close Protection Officer (8 yrs exp, Background Checked: Yes, Status: `ASSIGNED`, Languages: English, Yoruba)
  * **Chidi Okafor** — Event Security Specialist (5 yrs exp, Background Checked: Yes, Status: `AVAILABLE`, Languages: English, Igbo)
* **Compliance Documents:**
  * `BUSINESS_REGISTRATION`: Approved (CAC Certificate)
  * `LIABILITY_INSURANCE`: Approved ($1M Coverage)
  * `SECURITY_OPERATING_LICENCE`: Approved
* **Bookings & Financials:**
  * **Active Assignment:** `ASG-APEX-001` — Close protection for VIP Delegation in Lagos ($2,500 Gross, $375 Platform Fee, $2,125 Net to Agency). Status: `IN_PROGRESS`.
  * **Completed Assignment:** `ASG-APEX-002` — Tech Summit Security ($1,800 Gross, $270 Platform Fee, $1,530 Net to Agency). Status: `COMPLETED`.
  * **Settled Payout:** `PAYOUT-APEX-2026-01` — Net $1,530 paid to GTBank (••••4471).

#### 2. Agency #2: **Vanguard Executive Transit** (In Review)
* **Company Profile:**
  * **Slug:** `vanguard-executive-transit`
  * **Legal Name:** Vanguard Mobility Services Ltd (RC-993821)
  * **Categories:** Driving, Chauffeured Transport
  * **Location:** Abuja, Nigeria
  * **Headline Summary:** "Armored SUVs and executive chauffeur services."
  * **Verification Status:** `PENDING` | **Listing Status:** `IN_REVIEW`
* **Agency User Account:**
  * **Email:** `manager@vanguardtransit.ng`
  * **Password:** `Password@2`
  * **Role:** `MANAGER`
* **Staff Member:**
  * **Ibrahim Musa** — Executive Driver (12 yrs exp, Status: `AVAILABLE`, Languages: English, Hausa)
* **Compliance Documents:**
  * `FLEET_INSURANCE`: Approved
  * `DRIVER_LICENCES`: In Review (Pending admin check)

#### 3. Agency #3: **Lagos Culinary & Event Chefs** (Draft Listing)
* **Company Profile:**
  * **Slug:** `lagos-culinary-chefs`
  * **Legal Name:** Lagos Culinary Group Ltd
  * **Categories:** Catering, Chef Services
  * **Verification Status:** `UNVERIFIED` | **Listing Status:** `DRAFT`

---

### B. Hire Professionals Directory (`ProfessionalProfile`, `HireBooking`, `ProfessionalRating`)

#### 1. **Aya Kobayashi** (Tokyo, Japan)
* **Title:** Senior Private Guide & Translator
* **Category:** `interpreting` / `tour_guide`
* **Hourly Rate:** $65.00/hr | **Rating:** 4.9 ★ | **Completed Jobs:** 38 | Verified: Yes
* **Languages:** English, Japanese

#### 2. **Bruno Ferreira** (Rio de Janeiro, Brazil)
* **Title:** Executive Chauffeur & Security Driver
* **Category:** `driving`
* **Hourly Rate:** $50.00/hr | **Rating:** 4.8 ★ | **Completed Jobs:** 52 | Verified: Yes
* **Languages:** English, Portuguese, Spanish

#### 3. **Elena Marousi** (Athens, Greece)
* **Title:** Personal Security & Escort Specialist
* **Category:** `security`
* **Hourly Rate:** $85.00/hr | **Rating:** 5.0 ★ | **Completed Jobs:** 24 | Verified: Yes
* **Languages:** English, Greek

#### 4. **Sipho Ndlovu** (Johannesburg, South Africa)
* **Title:** Event Logistics Coordinator & Chef
* **Category:** `catering` / `events`
* **Hourly Rate:** $45.00/hr | **Rating:** 4.7 ★ | **Completed Jobs:** 19 | Verified: Yes
* **Languages:** English, Zulu

---

### C. Visa & Passport Applications (`VisaDocumentation`, `PassportApplication`, `PaymentTransaction`)

#### 1. Visa Application #1: **John Doe** (`VISA-2026-8812`)
* **Applicant:** John Doe (`john.doe@example.com`)
* **Destination:** United Kingdom (Tourist Visa)
* **Status:** `EVALUATED` | **Total Amount:** $850.00 | **Amount Paid:** $0.00 | **Balance Due:** $850.00

#### 2. Visa Application #2: **Sarah Smith** (`VISA-2026-9041`)
* **Applicant:** Sarah Smith (`sarah.smith@example.com`)
* **Destination:** United Arab Emirates (Business Visa)
* **Status:** `APPROVED` | **Total Amount:** $1,200.00 | **Amount Paid:** $1,200.00 | **Balance Due:** $0.00

#### 3. Passport Application #1: **David Ojukwu** (`PASS-2026-4410`)
* **Applicant:** David Ojukwu (`david@example.com`)
* **Category:** `FRESH` (10-Year, 64-Page Booklet)
* **Status:** `EVALUATED` | **Total Amount:** ₦120,000.00

---

### D. Bank Accounts for Direct Payments (`BankAccount`)

1. **Zenith Bank** — Operations USD Account
   * Account Name: World Portal Global Ltd
   * Account Number: 5070192834 | Swift: ZEIBNGLA
2. **GTBank** — Operations NGN Account
   * Account Name: World Portal Services Nigeria
   * Account Number: 0129485763

---

## 4. Implementation Steps

1. **Create `SeedModule`, `SeedController`, `SeedService`** in `worldPortal/src/seed/`.
2. Expose `POST /api/seed` validating `secretCode === 'WORLD_PORTAL_SEED_2026_SECURE'`.
3. Hash passwords using `bcrypt.hash('Password@2', 10)` for default accounts.
4. Execute database upserts and return execution summary.
