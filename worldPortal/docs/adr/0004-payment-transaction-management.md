# ADR 0004: Payment Transaction Management & Decoupled Payment Engine

* **Status:** Approved
* **Date:** 2026-08-27
* **Author(s):** AI Agent & Development Team

---

## 1. Context & Problem Statement
Currently, visa application evaluation and financial balance tracking (`totalAmount`, `amountPaid`, `balanceDue`, `paymentStatus`) exist on `VisaDocumentation`. However, in accordance with the project guidelines ([`AGENTS.md`](file:///Users/ettaraphael/Documents/nest-app/world_portal/AGENTS.md#L94-L100)), payment handling must be decoupled into a dedicated **`src/payment`** domain module responsible for:
1. **Payment Configurations:** Surcharged refund percentages, platform fee markups, and partner cost calculations.
2. **Payment Transaction Lifecycle:** Initiating payment records, processing confirmation records, and handling surcharged refunds (`INITIATED`, `CONFIRMED`, `FAILED`, `REFUNDED`).
3. **Decoupled Service Integration:** Delegating payment initiation and confirmation from `VisaDocumentationService` to `PaymentService` via **Direct Service Injection** while automatically updating visa application processing status (`UNDER_REVIEW`, `PARTIALLY_PAID`, `FULLY_PAID`).

## 2. Decision Drivers
* **Separation of Concerns:** Keep document verification/visa status tracking isolated in `src/visa-documentation` while delegating financial ledgering, markups, and refunds to `src/payment`.
* **Prisma Models for Payment Domain:** Add `PaymentConfig`, `PaymentTransaction`, and `PaymentRefund` models to `prisma/schema.prisma`.
* **Direct Service Injection (Option 1):** Use NestJS Dependency Injection to inject `VisaDocumentationService` directly into `PaymentService` for 0ms synchronous, transactional execution when a payment is confirmed.
* **Role-Based Access Control (RBAC):**
  - **Public / Applicant:** Initiate and confirm payment transactions for visa documentation.
  - **Manager / Admin:** Manage payment configuration settings (partner markups, refund surcharge percentages) and approve/process refund requests.

## 3. Considered Options
* **Option 1 (Chosen):** Decouple payment processing into a standalone `src/payment` module using **Direct Service Injection**. `PaymentService` handles transaction initiation, confirmation, refund calculations, and configurations, and directly invokes `VisaDocumentationService.handlePaymentConfirmed()` upon confirmation.
* **Option 2:** Maintain payment processing code inside `src/visa-documentation` (Rejected; violates domain boundary guidelines in `AGENTS.md`).

## 4. Proposed Architecture & Design

### Database Models (`prisma/schema.prisma`)

```prisma
enum PaymentTransactionStatus {
  INITIATED
  CONFIRMED
  FAILED
  REFUNDED
}

enum RefundStatus {
  REQUESTED
  APPROVED
  PROCESSED
  REJECTED
}

model PaymentConfig {
  id                         String   @id @default(uuid())
  partnerMarkupPercentage    Decimal  @default(10.00) @db.Decimal(5, 2)
  serviceFeePercentage       Decimal  @default(5.00) @db.Decimal(5, 2)
  refundSurchargePercentage  Decimal  @default(15.00) @db.Decimal(5, 2)
  updatedBy                  String
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt
}

model PaymentTransaction {
  id                   String                   @id @default(uuid())
  transactionRef       String                   @unique
  visaDocumentationId  String?
  profileId            String?
  amount               Decimal                  @db.Decimal(10, 2)
  paymentOption        PaymentOption
  status               PaymentTransactionStatus @default(INITIATED)
  gatewayReference     String?
  paymentMethod        String?                  @default("CARD")
  initiatedBy          String
  confirmedAt          DateTime?
  refundedAt           DateTime?
  createdAt            DateTime                 @default(now())
  updatedAt            DateTime                 @updatedAt

  visaDocumentation    VisaDocumentation?       @relation(fields: [visaDocumentationId], references: [id], onDelete: SetNull)
  profile              Profile?                 @relation(fields: [profileId], references: [id], onDelete: SetNull)
  refunds              PaymentRefund[]

  @@index([visaDocumentationId])
  @@index([profileId])
  @@index([status])
  @@index([transactionRef])
}

model PaymentRefund {
  id                   String            @id @default(uuid())
  refundRef            String            @unique
  transactionId        String
  originalAmount       Decimal           @db.Decimal(10, 2)
  surchargeAmount      Decimal           @db.Decimal(10, 2)
  netRefundAmount      Decimal           @db.Decimal(10, 2)
  reason               String
  status               RefundStatus      @default(REQUESTED)
  processedBy          String?
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt

  transaction          PaymentTransaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  @@index([transactionId])
  @@index([status])
}
```

### Module Design (`src/payment`)
* `PaymentModule`: Registers `PaymentController`, `PaymentService`, Prisma, and BullMQ queue.
* `PaymentController`:
  - `POST /api/payments/initiate` - Initiate payment transaction for a visa application
  - `POST /api/payments/confirm` - Confirm payment transaction & update visa application status
  - `POST /api/payments/refund` - Initiate a surcharged refund request (`MANAGER`)
  - `GET /api/payments/config` - Get payment fee & refund configuration (`MANAGER`)
  - `PATCH /api/payments/config` - Update payment fee & refund configuration (`MANAGER`)
  - `GET /api/payments/transactions` - List payment transactions (`MANAGER`, `STAFF`)

## 5. Consequences
* **Positive Impact:** Clear domain separation, robust audit trailing for all payment transactions and surcharged refunds, configurable markup rates.
* **Trade-offs:** Requires running `npx prisma migrate dev` / `npx prisma db push` to create new payment models.

## 6. Verification & Test Plan
* Unit test coverage for `PaymentService` (`src/payment/payment.service.spec.ts`).
* End-to-end flow testing (`npm run test:e2e`).
