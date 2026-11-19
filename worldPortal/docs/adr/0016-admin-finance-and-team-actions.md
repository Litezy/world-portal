# ADR 0016: Admin Finance & Team Actions — Backend Fixes

* **Status:** Approved (by the product owner in chat, 2026-11-16)
* **Date:** 2026-11-16
* **Author(s):** AI Agent & Development Team
* **Related:** [ADR 0004](./0004-payment-transaction-management.md) (payments), [ADR 0007](./0007-admin-dashboard-architecture.md) (admin console — its Phase 2 refund/RBAC items are partly delivered here), [ADR 0001](./0001-profile-account-management.md) (profiles)

---

## 1. Context & Problem Statement
The admin console upgrade (frontend plan "Phase 3 — actions & workflow") wires the console's dead buttons — **Process refund**, **Save fee settings**, team **role change / deactivate** — to endpoints that already exist. Reading those endpoints showed that several of them corrupt or lose data in ways the console would now expose to staff every day:

| # | Where | Defect (verified in code) |
|---|---|---|
| D1 | `PaymentService.initiateRefund` (`src/payment/payment.service.ts`) | Marks the `PaymentTransaction` `REFUNDED` and writes a `PaymentRefund`, but never touches the linked `VisaDocumentation` / `PassportApplication`. Their `amountPaid`, `balanceDue` and `paymentStatus` keep claiming the money is held; `PaymentStatus.REFUNDED` is never set anywhere. |
| D2 | same | No refunds list endpoint — refunds are only reachable nested under `GET /payments/transactions`. No email tells the applicant. |
| D3 | `PaymentService.confirmBankTransferPayment` | `notes` is accepted by `ConfirmBankTransferDto` and dropped. `allowInstallment` is not enforced, so a 50% payment is accepted on a file that does not allow instalments. The transaction ref is `BANK-<REF>`; reusing a bank reference hits the unique index and surfaces as a **500** (P2002 is not mapped). |
| D4 | `VisaDocumentationService.handlePaymentConfirmed` | Always moves the visa to `UNDER_REVIEW`, even when it is already `APPROVED`. (The passport version already guards this.) |
| D5 | `VisaDocumentationService.evaluateVisaCost` (`POST /visa-documentation/:id/evaluate`) | Sets `amountPaid` to **0** and `balanceDue` to the new total on every evaluation, with no status check — re-evaluating after a payment erases the record of that payment. (Passport evaluate already keeps `amountPaid` and limits evaluation to `SUBMITTED`/`EVALUATED`.) |
| D6 | `ProfileService.updateProfile` / `deactivateProfile` (`PATCH`/`DELETE /profiles/:id`, MANAGER) | Nothing stops a manager demoting or deactivating **themselves** or the **last active manager**, locking the whole console out. No way to resend an invite; no `isActive` filter on `GET /profiles`. |

## 2. Decision Drivers
* **Money records must agree** — a refund, a payment and an evaluation must leave the transaction and its application telling the same story.
* **Errors are the caller's, not the server's** — duplicate references and illegal requests return 4xx with a message the console can show.
* **The console can never lock itself out.**
* **Smallest change that fixes it** — no new tables; existing endpoints keep their shapes; additions are additive.

## 3. Considered Options
* **Option 1 (chosen):** Fix each defect inside the existing services, add the two missing read/write endpoints, keep all contracts backward compatible.
* **Option 2:** Introduce the full refund request → approve → process workflow that the `RefundStatus` enum anticipates. Deferred: it needs a second-approver policy decision (see §5) and is not required to make today's single-step refund correct.

## 4. Proposed Architecture & Design

### 4.1 Refunds (D1, D2)
* `initiateRefund` runs in the existing `$transaction` and additionally updates the linked application:
  * `amountPaid = max(0, amountPaid − originalAmount)`, `balanceDue = totalAmount − amountPaid`, except that a full refund (`amountPaid` reaches 0) sets `balanceDue = 0` *(amended in review, 2026-11-17: putting the whole fee back as owed counted refunded files as money to collect and re-offered "record a payment". If the file goes ahead, staff price it again; see §4.3)*;
  * `paymentStatus = REFUNDED` when `amountPaid` reaches 0, otherwise `PARTIALLY_PAID` (`PaymentStatus` = `PENDING_EVALUATION | AWAITING_PAYMENT | PARTIALLY_PAID | FULLY_PAID | REFUNDED`);
  * application `status` is **not** changed — refunding is a money decision, not a visa decision.
* **New** `GET /payments/refunds` — `@Roles(MANAGER, STAFF)`, query `page`, `limit` (reuse `src/hire/dto/query-professionals.dto.ts` conventions), `search` (refundRef, reason, transactionRef). Response `{ data, meta: { total, page, limit, pages } }`; each item includes `transactionRef` and `currency` (from the linked application).
* **New email** `refund-processed.ejs` + `SendGridService.sendRefundProcessedEmail` (original, surcharge, net, reason). Sent after the transaction commits; a mail failure is logged, never rolls back the refund.

### 4.2 Bank-transfer confirmation (D3, D4)
* Persist `notes` — new nullable `PaymentTransaction.notes String?` (additive migration).
* Reject with **409** when `paymentOption = HALF_INSTALLMENT` and the application's `allowInstallment` is false, and when `amount` exceeds the current `balanceDue`.
* Map Prisma `P2002` on `transactionRef` to **409** "That bank reference has already been recorded" — in the service (explicit `catch`) rather than globally, so other unique violations keep their own handling.
* `VisaDocumentationService.handlePaymentConfirmed`: only move to `UNDER_REVIEW` from `SUBMITTED` or `EVALUATED` (mirror passport).

### 4.3 Evaluation (D5)
* `evaluateVisaCost` keeps `amountPaid`; `balanceDue = max(0, totalAmount − amountPaid)`.
* Re-evaluation is refused with **409** once `paymentStatus` is `PARTIALLY_PAID` or `FULLY_PAID` (or a `CONFIRMED` transaction exists), and when status is `APPROVED` or `REJECTED`. Allowed from `SUBMITTED` and `EVALUATED` (same rule as passport).
* *Amended in review, 2026-11-17:* also allowed from `UNDER_REVIEW` while no money is held, and the file stays `UNDER_REVIEW`. ADR 0017 lets staff start a review before pricing, and a refund leaves the file under review; without this, neither file could ever be priced or paid for. Passports follow the same rule.

### 4.3a Concurrency *(added in review, 2026-11-17)*
* Refunds, bank-transfer confirmations, `handlePaymentConfirmed` and the team safeguards each read, check and write inside one `SERIALIZABLE` transaction (`src/prisma/serializable.ts`). Checked outside the transaction, a double click or two staff at once could refund one payment twice, record more than the price, or remove the last two managers together. A serialization clash is retried twice with fresh reads, then answered with **409**. Emails are sent after the commit.

### 4.4 Team safeguards (D6)
* `updateProfile` / `deactivateProfile` receive the acting profile (from `RolesGuard` → `request.profile`) and refuse with **409**:
  * a manager changing their own `role` or `isActive`;
  * any change that would leave **zero active managers**.
* **New** `POST /profiles/:id/resend-invite` — `@Roles(MANAGER)`, 409 for an inactive profile, reuses `sendTeamInviteEmail`.
* `GET /profiles` accepts `isActive=true|false`.

### 4.5 Logging & security
* NestJS `Logger` only; every refund, refusal and team change logs actor email, entity id and outcome. No amounts beyond what already appears in logs, no bank details, no PII beyond email.
* All new endpoints sit behind `ExternalAuthGuard` + `RolesGuard`. **Known limitation:** `ExternalAuthGuard` only decodes tokens (ADR 0014, AR-01) and `/auth/test-token` mints tokens for any email; hardening is deliberately deferred until the WorldStreet staff sign-in decision. These roles are therefore only as strong as that guard.

### 4.6 Data & migrations
* One additive migration: `PaymentTransaction.notes String?`. No data backfill.
* Migrations run against a **Neon dev branch** only. Production is migrated by the normal release process, never from a developer machine.

## 5. Consequences
* **Positive Impact:** Refunds, payments and evaluations stop contradicting each other; staff see 409 messages instead of 500s; the console can no longer lock out its last manager; the console's refund list and fee/team screens get real endpoints.
* **Negative Impact / Trade-offs:** Refunds stay single-step (no second approver) — a policy question for the business; partial refunds are still not supported; the refund email adds a SendGrid template to maintain.

## 6. Verification & Test Plan
* **Unit Tests** (patterns: `src/payment/payment.service.spec.ts`, `payment.controller.spec.ts`, `src/profile/profile.controller.spec.ts`):
  * refund updates application `amountPaid`/`balanceDue`/`paymentStatus` inside the transaction; refund of a non-`CONFIRMED` transaction still refused; mail failure does not throw;
  * `GET /payments/refunds` paging, search, roles;
  * bank confirm: `notes` persisted; installment refused when not allowed; overpayment refused; duplicate reference → 409; APPROVED visa stays APPROVED;
  * evaluate keeps `amountPaid`; refused after payment / when APPROVED or REJECTED;
  * profiles: self-demotion, self-deactivation and last-manager removal → 409; resend-invite; `isActive` filter.
* **E2E:** console refund and fee save against the Neon dev branch (frontend `e2e/admin.spec.ts`).
* **Gate:** `npm run lint`, `npm run build`, `npm run test` all pass.
