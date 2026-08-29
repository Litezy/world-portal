# World Portal - Travel Passport & Visa Processing Platform
## AGENTS.md - Development & Governance Guidelines for AI Agents and Engineers

This document governs all feature development, architectural changes, code style, testing protocols, and operational standards for the **World Portal** project.

---

## 1. Project Overview & Architecture

**World Portal** is a NestJS-based platform designed for managing travel passports, visa documentation processing, and payment tracking.

* **Framework:** NestJS (Node.js / TypeScript)
* **Database & ORM:** PostgreSQL + Prisma ORM
* **Queue & Caching:** Redis + BullMQ (Async job processing for visa processing workflows, notifications, and background queues)
* **Testing:** Jest (Unit & E2E)
* **API Documentation:** Swagger OpenAPI (`@nestjs/swagger`) mounted at `/api/docs` with comprehensive DTO annotations (`@ApiProperty`), tags (`@ApiTags`), and security schemes (`@ApiBearerAuth`).
* **Authentication:** **External Service** (Delegated Auth). World Portal does not manage user passwords or authentication logic directly; instead, it validates identity/tokens provided by the external auth provider.
* **Database & Seeding:** Prisma seed scripts must ensure default bootstrap accounts exist upon initialization.

---

## 2. Mandatory Workflows & Rules

### Rule 1: Feature Development in Dedicated Git Branches
* **All new feature work MUST start in a new git branch checked out from the updated `main` branch.**
* Standard workflow: `git checkout main`, `git pull`, then `git checkout -b feat/feature-name`.
* Naming convention: `feat/feature-name`, `feature/feature-name`, or `fix/bug-name` (e.g., `feat/profile-management`, `feat/visa-doc-processing`).
* **Direct commits to `main` are strictly forbidden.**

### Rule 2: Dual Architecture Decision Records (ADRs) Required
* **Every new feature, resource addition, or structural change MUST begin with TWO Architecture Decision Records (ADRs) under `docs/adr/`:**
  1. **Technical ADR (`docs/adr/000X-feature-name.md`)**: Deep technical architecture, data schemas, API contracts, sequence flows, BullMQ queues, Prisma models, and test plans.
  2. **ADR for Dummies (`docs/adr/000X-feature-name.dummies.md`)**: A simplified, plain-language version written for non-technical stakeholders explaining *What problem is being solved*, *Why we are doing it*, *How it works in simple terms*, and *Key business benefits/risks*.
* **Workflow:**
  1. Ensure latest main branch and create new feature branch: `git checkout main && git pull && git checkout -b feat/feature-name`.
  2. Draft both proposed ADR files (`000X-feature-name.md` and `000X-feature-name.dummies.md`).
  3. Obtain explicit approval before writing feature code.
  4. Update both ADR statuses to `Approved`.

### Rule 3: Strict Test Driven & Verified Implementation
* No feature or bugfix is considered complete without passing automated test coverage.
* Every module, controller, and service must have matching unit test specifications (`*.spec.ts`) and/or E2E test coverage in `test/`.
* Before declaring any task completed, run and pass:
  ```bash
  npm run lint
  npm run build
  npm run test
  ```

### Rule 4: Structured Logging Standard
* Plain `console.log` or `console.error` is **strictly forbidden**.
* All services, controllers, guards, and interceptors must use NestJS `Logger` or a structured logging service (`Winston` / `Pino`).
* Every log entry must include:
  * **Timestamp** (ISO format)
  * **Context / Class Name** (e.g. `[ProfileService]`, `[PaymentController]`)
  * **Log Level** (`error`, `warn`, `info`, `debug`, `verbose`)
  * **Correlation ID / Request ID** (where applicable)
  * **Structured JSON Payload** for metadata.
* **Sensitive Data Masking:** Never log secrets, passwords, tokens, or PII (e.g., CVVs, full card numbers).

---

## 3. User Roles & Profile Management

### User Roles
The platform supports three distinct user types managed under **Profile**:
1. **`manager`**: Full administrative access over profiles, system configurations, payments, and visa documentation approvals.
2. **`partner`**: External agency/partner access for submitting visa documentation and tracking customer applications.
3. **`staff`**: Internal operational staff handling verification, processing, and status updates.

### Seed Credentials
Default seed data must include an initial administrator/manager profile:
* **Email:** `manager@loveworld.com`
* **Password:** `Password@2`
* **Role:** `manager`

---

## 4. Core Domain Resources

1. **Profile (`src/profile`)**
   * Manages user metadata, role assignments (`manager`, `partner`, `staff`), contact information, and association with external Auth IDs.

2. **Payment (`src/payment`)**
   * Does **not** directly execute external gateway card charges; instead manages:
     * **Payment Configurations:** Visa partner cost calculations, platform percentage fee markup, and surcharged refund percentages.
     * **Transaction Lifecycle & Record Initiation:** Initiates payment records, payment confirmation records, and refund records (Initiate Payment, Confirm Payment, Initiate Refund).

3. **Visa Documentation (`src/visa-documentation`)**
   * Handles document uploads, verification workflows, status tracking (Submitted, Under Review, Approved, Rejected), and passport details linkage.

---

## 5. Standard Guidelines Summary for AI Agents

When assisting on this project:
1. **Always check for an approved ADR** before writing feature code.
2. **Obey role-based access controls** (`manager`, `partner`, `staff`).
3. **Enforce structured logging** using the project logger for all operational paths.
4. **Never declare success** without executing build and test commands (`npm run build && npm run test`).
