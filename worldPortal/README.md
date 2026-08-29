# World Portal — Travel Passport & Visa Processing Platform

[![NestJS](https://img.shields.io/badge/NestJS-v11-red.svg)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blue.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue.svg)](https://www.postgresql.org/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-brightgreen.svg)](http://localhost:3000/api/docs)

**World Portal** is an enterprise NestJS backend engine for travel passport applications, visa documentation processing, partner fee calculations, and surcharged refund tracking.

---

## 📐 System Architecture & Payment Processing Flow

Below is the system architecture diagram illustrating the interaction between the **Visa Documentation Module (`src/visa-documentation`)** and the decoupled **Payment Engine (`src/payment`)** via **Direct Service Injection (Option 1)**:

![World Portal Architecture & Payment Flow](docs/assets/architecture_flow_diagram.svg)

---

## 🔄 Interaction Flowchart

```mermaid
flowchart TD
    classDef client fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    classDef visa fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
    classDef payment fill:#022c22,stroke:#10b981,stroke-width:2px,color:#fff

    Applicant["👤 Applicant / Partner"]:::client
    Admin["👨‍💼 Admin / Manager"]:::client

    subgraph VisaModule ["1. Visa Documentation Module (src/visa-documentation)"]
        V1["POST /api/visa-documentation<br/>Status: SUBMITTED | PENDING_EVALUATION"]:::visa
        V2["POST /api/visa-documentation/:id/evaluate<br/>Status: EVALUATED | AWAITING_PAYMENT"]:::visa
        V3["handlePaymentConfirmed(visaDocId, amount, option)<br/>★ Auto-advances Status → UNDER_REVIEW<br/>paymentStatus → PARTIALLY / FULLY_PAID"]:::visa
        V4["PATCH /api/visa-documentation/:id/status<br/>Status → APPROVED / REJECTED"]:::visa
    end

    subgraph PaymentModule ["2. Payment Engine Module (src/payment)"]
        P1["POST /api/payments/initiate<br/>Creates PaymentTransaction → INITIATED"]:::payment
        P2["POST /api/payments/confirm<br/>Updates PaymentTransaction → CONFIRMED"]:::payment
        P3["POST /api/payments/refund<br/>Calculates Surcharge & Issues Net Refund"]:::payment
        P4["GET/PATCH /api/payments/config<br/>Markup % & Surcharge % Settings"]:::payment
    end

    Applicant -->|"1. Submit Application"| V1
    Admin -->|"2. Set Cost & Installments"| V2
    V2 -.->|"3. Initiate Payment"| P1
    Applicant -->|"4. Confirm Payment"| P2
    P2 ==>|"5. Direct Service Call (Option 1 - 0ms)"| V3
    V3 --> V4
    Admin -->|"Surcharged Refunds & Config"| P3
```

---

## 🏛 Architecture Decision Records (ADRs)

All architectural decisions are documented under [`docs/adr/`](docs/adr/):
- **ADR 0001**: Profile & Account Management ([Technical](docs/adr/0001-profile-account-management.md) | [For Dummies](docs/adr/0001-profile-account-management.dummies.md))
- **ADR 0002**: S3 Document Upload Service ([Technical](docs/adr/0002-s3-document-upload-service.md) | [For Dummies](docs/adr/0002-s3-document-upload-service.dummies.md))
- **ADR 0003**: Visa Documentation Workflow ([Technical](docs/adr/0003-visa-documentation-processing-workflow.md) | [For Dummies](docs/adr/0003-visa-documentation-processing-workflow.dummies.md))
- **ADR 0004**: Payment Transaction Management ([Technical](docs/adr/0004-payment-transaction-management.md) | [For Dummies](docs/adr/0004-payment-transaction-management.dummies.md))

---

## 🚀 Quick Start

### 1. Environment Setup
Ensure PostgreSQL environment variables are configured in `.env`:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/worldportal?schema=public"
PORT=3000
```

### 2. Database Sync & Seeding
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push

# Seed initial admin/manager credentials (manager@loveworld.com)
npx prisma db seed
```

### 3. Run Application
```bash
# Development mode
npm run start:dev

# Production build & run
npm run build && npm run start:prod
```

### 4. Interactive OpenAPI Docs
Access the mounted Swagger documentation UI at:
👉 **`http://localhost:3000/api/docs`**

---

## 🧪 Testing Suite

```bash
# Run ESLint check
npm run lint

# Run unit tests
npm run test

# Run end-to-end (E2E) tests
npm run test:e2e
```
