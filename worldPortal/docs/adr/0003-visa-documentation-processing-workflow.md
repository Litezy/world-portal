# ADR 0003: Visa Documentation, Evaluation & Payment Processing Workflow

* **Status:** Approved
* **Date:** 2026-08-27
* **Author(s):** AI Agent & Development Team

---

## 1. Context & Problem Statement
Visa application processing requires a multi-stage flow:
1. **Application Submission (Public & Registered):** Any user—including guest applicants, partners, or staff—can submit a visa application with applicant personal information, passport metadata, and required S3 document URLs. Initial status: `SUBMITTED`, payment status: `PENDING_EVALUATION`.
2. **Admin Evaluation & Cost Allocation:** An Admin/Manager evaluates the submitted application and allocates processing cost (`totalAmount`, `allowInstallment`). Application status updates to `EVALUATED` and payment status to `AWAITING_PAYMENT`.
3. **Email Notification Queue (Exponential Backoff):** An automated email notification is queued via BullMQ (`visa-notification-queue`) with exponential backoff retries (`attempts: 5`, `backoff: { type: 'exponential', delay: 2000 }`) notifying the applicant that their application cost has been evaluated and is ready for payment.
4. **Payment Record Initiation & Confirmation (`src/payment` integration + BullMQ Exponential Backoff):**
   - **Initiate Payment (`POST /api/visa-documentation/:id/initiate-payment`):** Applicant selects payment option (`FULL` or `HALF_INSTALLMENT`). Payment initiation and gateway dispatch jobs are processed via BullMQ (`visa-payment-queue`) with exponential backoff retries (`attempts: 5`, `backoff: { type: 'exponential', delay: 2000 }`) to gracefully retry transient network or payment provider errors. Returns transaction reference & payment URL/success response.
   - **Confirm Payment (`POST /api/visa-documentation/:id/confirm-payment`):** Upon payment confirmation, system updates `amountPaid`, `balanceDue`, sets `paymentStatus` (`PARTIALLY_PAID` or `FULLY_PAID`), and **automatically transitions application `status` to `UNDER_REVIEW`**.

## 2. Decision Drivers
* **BullMQ Queues with Exponential Backoff:** All background jobs for payment gateway initiation and applicant email notifications are processed through BullMQ queues with exponential backoff (`attempts: 5`, `backoff: { type: 'exponential', delay: 2000 }`).
* **Domain Terminology:** Use **`applicant`** consistently across API contracts, documentation, and database schemas.
* **Payment Initiation Response:** `POST /api/visa-documentation/:id/initiate-payment` generates a payment transaction reference and returns a success payload (`{ success: true, transactionRef, amount, paymentOption, checkoutUrl }`).
* **Integration with Payment Service (`src/payment`):** In accordance with project architecture guidelines, payment record initiation, confirmation, and fee calculations are delegated to the payment domain lifecycle (`src/payment`).
* **Public Guest Submissions:** `POST /api/visa-documentation` is publicly accessible to support guest submissions from non-registered applicants. `profileId` is optional (`String?`).
* **Automatic Status Transition:** On confirmed payment (`PARTIALLY_PAID` or `FULLY_PAID`), automatically transition `status` from `EVALUATED` to `UNDER_REVIEW`.
* **API-Driven Payment Options:** Expose `totalAmount`, `amountPaid`, `balanceDue`, `allowInstallment`, and minimum required deposit via API so the frontend dynamically renders full vs half installment UI controls.
* **Admin Cost Allocation Endpoint:** `POST /api/visa-documentation/:id/evaluate` (`MANAGER`, `STAFF`) to set processing cost and trigger applicant email notification via BullMQ queue.
* **Role-Based Access Control (RBAC):**
  - **Public / All Users:** `POST /api/visa-documentation` (Public submission for applicants and partners), `POST /api/visa-documentation/:id/initiate-payment`, `POST /api/visa-documentation/:id/confirm-payment`.
  - **Staff / Managers:** `GET /api/visa-documentation` (List/search all applications), `POST /api/visa-documentation/:id/evaluate` (Allocate costs), `PATCH /api/visa-documentation/:id/status` (Update final status `APPROVED`/`REJECTED` & notes).

## 3. Considered Options
* **Option 1 (Chosen):** BullMQ background queue with exponential backoff (`attempts: 5`, `backoff: { type: 'exponential', delay: 2000 }`) for payment initiation & email notification jobs with automated status transition to `UNDER_REVIEW` upon confirmed payment.
* **Option 2:** Synchronous gateway calls without retry queues (Rejected; synchronous calls fail during temporary network glitches or gateway timeouts).

## 4. Proposed Architecture & Design

### Data Model (Prisma Schema - `prisma/schema.prisma`)
```prisma
enum VisaDocumentStatus {
  SUBMITTED
  EVALUATED
  UNDER_REVIEW
  APPROVED
  REJECTED
}

enum PaymentStatus {
  PENDING_EVALUATION
  AWAITING_PAYMENT
  PARTIALLY_PAID
  FULLY_PAID
  REFUNDED
}

enum PaymentOption {
  FULL
  HALF_INSTALLMENT
}

enum VisaCategory {
  TOURIST
  BUSINESS
  STUDENT
  WORK
  TRANSIT
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

model VisaDocumentation {
  id                          String             @id @default(uuid())
  applicationNo               String             @unique
  profileId                   String?            // Optional link for registered applicants / partners
  
  // Applicant Personal Information
  firstName                   String
  lastName                    String
  email                       String
  phone                       String
  dateOfBirth                 DateTime
  gender                      Gender             @default(MALE)
  nationality                 String
  residenceAddress            String
  
  // Passport Details
  passportNumber              String
  passportIssueDate           DateTime
  passportExpiryDate          DateTime
  passportIssuingAuthority     String?
  
  // Travel & Visa Application Details
  targetCountry               String
  visaCategory                VisaCategory       @default(TOURIST)
  intendedArrivalDate         DateTime
  intendedDepartureDate       DateTime
  purposeOfVisit              String
  
  // Required Document Attachments (S3 URLs)
  passportDataPageUrl         String             // Datapage International Passport
  passportPhotoWhiteBgUrl     String             // Passport photo on white background
  proofOfFunds6MonthsUrl      String             // 6 months POF
  
  // Optional Document Attachments (S3 URLs)
  businessRegistrationCertUrl String?            // Business document and certificate
  taxCertificateUrl             String?            // Tax Certificates if available
  marriageCertificateUrl        String?            // Marriage certificate if available
  childrenBirthCertUrls         String[]           @default([]) // Children birth certificates if available
  landedPropertyDocUrls         String[]           @default([]) // Landed property if available
  previousVisasScanUrls         String[]           @default([]) // Previous visas scans if available
  supportingDocUrls             String[]           @default([]) // Additional supporting documents
  
  // Admin Cost Evaluation & Payment Allocation
  totalAmount                 Decimal?           @db.Decimal(10, 2)
  amountPaid                  Decimal            @default(0.00) @db.Decimal(10, 2)
  balanceDue                  Decimal            @default(0.00) @db.Decimal(10, 2)
  allowInstallment            Boolean            @default(false)
  selectedPaymentOption       PaymentOption?
  paymentStatus               PaymentStatus      @default(PENDING_EVALUATION)
  evaluatedBy                 String?
  evaluatedAt                 DateTime?
  
  // Processing Lifecycle & Audit
  status                      VisaDocumentStatus @default(SUBMITTED)
  verificationNotes           String?
  rejectionReason             String?
  createdBy                   String             // Email or profile of person creating entry
  reviewedBy                  String?
  createdAt                   DateTime           @default(now())
  updatedAt                   DateTime           @updatedAt

  profile Profile? @relation(fields: [profileId], references: [id], onDelete: SetNull)

  @@index([profileId])
  @@index([status])
  @@index([paymentStatus])
  @@index([passportNumber])
  @@index([applicationNo])
  @@index([email])
}
```

### Module Structure (`src/visa-documentation`)
1. **`VisaDocumentationModule`**: Registers controller, service, Prisma dependency, and BullMQ queues (`visa-payment-queue`, `visa-notification-queue`).
2. **`VisaDocumentationController`**:
   - `POST /api/visa-documentation` - **Public Endpoint**: Submit visa application (Guest applicants, partners, staff)
   - `GET /api/visa-documentation` - Protected: Search/list visa applications (`MANAGER`, `STAFF`, `PARTNER`)
   - `GET /api/visa-documentation/:id` - Fetch detailed application by ID or applicationNo
   - `POST /api/visa-documentation/:id/evaluate` - Protected: Admin cost evaluation & queue applicant email notification (`MANAGER`, `STAFF`)
   - `POST /api/visa-documentation/:id/initiate-payment` - Initiate payment transaction record (`FULL` or `HALF_INSTALLMENT`) queued with exponential backoff
   - `POST /api/visa-documentation/:id/confirm-payment` - Confirm payment transaction & **auto-transition status to `UNDER_REVIEW`**
   - `PATCH /api/visa-documentation/:id/status` - Protected: Update final status (`APPROVED`, `REJECTED`) & notes (`MANAGER`, `STAFF`)
3. **`VisaDocumentationService`**: Handles public guest application creation, tracking code generation (`VISA-2026-XXXX`), admin evaluation, payment record initiation & confirmation with automatic status transition to `UNDER_REVIEW`, and BullMQ email notification / payment queue dispatching with exponential backoff options (`attempts: 5`, `backoff: { type: 'exponential', delay: 2000 }`).

## 5. Consequences
* **Positive Impact:** Resilient background execution using BullMQ exponential backoff; automatic retries prevent transient network failures from failing payment initiation or email delivery.
* **Trade-offs:** Requires Redis running for BullMQ queue processors.

## 6. Verification & Test Plan
* **Unit Tests (`src/visa-documentation/*.spec.ts`):** 100% test coverage verifying BullMQ exponential backoff job options, initiate payment record, confirm payment record, and automatic status transition to `UNDER_REVIEW`.
* **Verification:** `npx prisma db push`, `npm run lint`, `npm run build`, `npm run test`.
