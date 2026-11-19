# ADR 0017: Admin Case Workflow — Audit Log, Assignment, Document Review & Server Rules

* **Status:** Approved (by the product owner in chat, 2026-11-16)
* **Date:** 2026-11-16
* **Author(s):** AI Agent & Development Team
* **Related:** [ADR 0007](./0007-admin-dashboard-architecture.md) (its Phase 2 planned `GET /audit-logs`, pagination, multi-field filters and audited transitions — none were built; this ADR delivers them), [ADR 0003](./0003-visa-documentation-processing-workflow.md), [ADR 0014](./0014-worldstreet-applicant-authentication.md) (AR-01), [ADR 0016](./0016-admin-finance-and-team-actions.md)

---

## 1. Context & Problem Statement
The admin console is the desk where visa and passport files are worked. Today the service gives that desk almost no structure:
* **No history.** Only the latest `evaluatedBy` / `reviewedBy` exist, and they store a **display name** guessed from the profile or email — not an id — so they cannot be joined back to a staff member. The console reconstructs a timeline from three timestamps.
* **No ownership.** `VisaDocumentation` and `PassportApplication` have no assignee or due date; nobody can see "my queue" or what is overdue.
* **No per-document review.** Documents are URL strings (`String[]` for some); staff cannot approve, reject or request a single document. Agencies already have this (`AgencyDocument` + `AgencyDocumentStatus`).
* **Any status from any status.** `PATCH /visa-documentation/:id/status` and `PATCH /passport-application/:id/status` accept any `status` — `APPROVED → SUBMITTED` is possible.
* **Whole collections only.** `GET /visa-documentation`, `/passport-application`, `/profiles`, `/payments/transactions` take filters but no `page`, `limit` or `sort`; the console pages them in memory.
* **Unguarded admin routes.** The agency admin routes in `src/agency/agency.controller.ts`, `src/hire/hire.controller.ts` `professionals/admin` and `professionals/:id/verify`, and every `src/notification` route have **no guards**. (The console's own proxy routes for agencies/professionals were locked down in the frontend in `fix/admin-correctness`; the service itself is still open.)
* **No staff signal.** Nothing creates an `ADMIN` notification — not on a new submission, not on a payment.

## 2. Decision Drivers
* **Accountability** — every decision on a file records who made it, when, and what changed.
* **A queue, not a list** — files have an owner and a due date; overdue work is visible.
* **Rules live on the server** — the console mirrors them, but the service refuses illegal transitions itself.
* **Scale** — paging and sorting in the database, not in the browser's proxy.
* **Close the open routes** — but honestly: guards are only as strong as the deferred login fix.

## 3. Considered Options
* **Option 1 (chosen):** One generic `AuditLog` table written by a small `AuditService` from each mutation, plus targeted columns/tables for assignment and document review.
* **Option 2:** Per-entity history tables (`VisaStatusHistory`, …). Rejected: more tables, and payments/config/profile changes would each need their own.
* **Option 3:** Event sourcing / BullMQ audit queue. Rejected for now: no queue is wired today (Redis config is unused), and synchronous writes inside the same transaction are simpler and cannot be lost.

## 4. Proposed Architecture & Design

### 4.1 Data model (Prisma, additive migrations)
```prisma
model AuditLog {
  id             String   @id @default(uuid())
  actorProfileId String?
  actorEmail     String
  action         String   // e.g. "visa.status.changed", "payment.bank.confirmed", "profile.role.changed"
  entityType     String   // "VisaDocumentation" | "PassportApplication" | "PaymentTransaction" | "PaymentConfig" | "Profile" | ...
  entityId       String
  before         Json?
  after          Json?
  createdAt      DateTime @default(now())

  @@index([entityType, entityId, createdAt])
  @@index([actorProfileId, createdAt])
}

enum ApplicationDocumentStatus { MISSING UPLOADED IN_REVIEW APPROVED REJECTED }

model ApplicationDocument {
  id                    String   @id @default(uuid())
  visaDocumentationId   String?
  passportApplicationId String?
  kind                  String   // "passportDataPage", "photo", "ninDocument", ...
  url                   String?
  status                ApplicationDocumentStatus @default(UPLOADED)
  note                  String?  // shown to the applicant on REJECTED / request
  reviewedByProfileId   String?
  reviewedAt            DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  @@index([visaDocumentationId])
  @@index([passportApplicationId])
}
```
* `VisaDocumentation` and `PassportApplication` gain `assigneeProfileId String?`, `dueAt DateTime?`, `evaluatedByProfileId String?`, `reviewedByProfileId String?` (indexed). Existing `evaluatedBy` / `reviewedBy` display-name columns stay for compatibility and are no longer the source of truth.
* **Backfill:** one script creates `ApplicationDocument` rows from the existing URL fields (status `UPLOADED`). No backfill of history — the audit log starts at deploy, and the console says so for older files.

### 4.2 AuditService
* `AuditService.record(tx, { actor, action, entityType, entityId, before, after })` takes the **same Prisma transaction client** as the mutation, so the log and the change commit or roll back together.
* Called from: visa/passport evaluate, status change, invite, assign, document review; bank-transfer confirm; refund; payment config update; profile create/update/deactivate/resend-invite.
* `before`/`after` hold only the changed fields — never document URLs, NIN/passport numbers or bank details.

### 4.3 Status transitions (server-enforced)
| From \ To | EVALUATED | UNDER_REVIEW | APPROVED | REJECTED |
|---|---|---|---|---|
| SUBMITTED | via evaluate | ✓ | — | ✓ |
| EVALUATED | via re-evaluate (ADR 0016 rules) | ✓ (also on payment) | — | ✓ |
| UNDER_REVIEW | — | — | ✓ | ✓ |
| APPROVED / REJECTED | — | — | — | — |

Same table for passports. Implemented as a plain typed map in `src/common/workflow/application-transitions.ts`, exported for the frontend to mirror. An illegal move → **409** with the allowed next states in the body. `REJECTED` still requires `rejectionReason`.

### 4.4 Endpoints
| Endpoint | Roles | Notes |
|---|---|---|
| `GET /audit-logs?entityType&entityId&actorProfileId&from&to&page&limit` | MANAGER, STAFF | Newest first |
| `PATCH /visa-documentation/:id/assign` `{ assigneeProfileId \| null, dueAt? }` | MANAGER, STAFF | Assignee must be an active MANAGER/STAFF profile |
| `PATCH /passport-application/:id/assign` | MANAGER, STAFF | same |
| `GET /visa-documentation/:id/documents`, `PATCH .../documents/:docId` `{ status, note? }` | MANAGER, STAFF | `REJECTED` requires `note`; passport mirrors |
| `GET /admin/summary` | MANAGER, STAFF | Counts: awaiting evaluation, awaiting payment confirmation, under review > N days (config), upcoming appointments, unassigned, assigned to me |
| List endpoints (`/visa-documentation`, `/passport-application`, `/profiles`, `/payments/transactions`) | unchanged | **Add** `page`, `limit` (max 100), `sort` (allow-listed fields), `assignee=me\|<id>\|none`; response `{ data, meta: { total, page, limit, pages } }` when `page` is present, the bare array otherwise (backward compatible) |

### 4.5 Guards
* Add `@UseGuards(ExternalAuthGuard, RolesGuard)` and `@Roles(MANAGER, STAFF)` to the agency admin routes, `hire` `professionals/admin` and `professionals/:id/verify`, and all `notification` routes (recipient routes additionally check the caller is the recipient or a manager).
* **Risk, recorded deliberately:** `ExternalAuthGuard` decodes without verifying signatures, and `/auth/test-token` mints a token for any email while `ENABLE_MOCK_AUTH` is on (ADR 0014 AR-01). Login hardening is **deferred by product decision** until the WorldStreet staff sign-in is settled. Until then these guards stop casual, unauthenticated calls, not a determined attacker.

### 4.6 Admin notifications
* Create `ADMIN` notifications (`recipientType = "ADMIN"`, recipient = assignee or, if none, all active managers) on: new visa/passport submission, bank payment confirmed, document re-uploaded after a request. The console's topbar bell reads `GET /notifications/:recipientId`.

### 4.7 Logging
* NestJS `Logger` only, structured, with actor email, entity id, action. Audit rows are the record; logs are for operations.

### 4.8 Migrations & environments
* Developed and tested only against a **Neon dev branch**. Never run against the live database from a developer machine.

## 5. Consequences
* **Positive Impact:** Real history per file; a staff queue with owners and deadlines; per-document decisions the applicant can act on; illegal transitions impossible; fast paged lists; open admin routes closed; staff get notified.
* **Negative Impact / Trade-offs:** More writes per mutation (one audit row each); a backfill script for documents; history before deploy is not reconstructed; guards remain weak until the login decision; the frontend must keep its transition table in sync (shared module + a test that compares both).

## 6. Verification & Test Plan
* **Unit Tests:** `AuditService` writes in the caller's transaction and is rolled back with it; every listed mutation writes exactly one audit row with redacted fields; transition table (every allowed and refused pair, both entities); assign validates the assignee; document review requires a note on reject; list endpoints page/sort/filter and stay backward compatible without `page`; `/admin/summary` counts; guard specs for agency, hire, notification routes (401/403/200) — `ExternalAuthGuard` and `RolesGuard` get their first specs.
* **E2E:** a file goes SUBMITTED → EVALUATED → payment → UNDER_REVIEW → APPROVED with one audit row per step; assignment appears in "my queue"; a rejected document shows its note.
* **Gate:** `npm run lint`, `npm run build`, `npm run test` all pass; migrations applied to the Neon dev branch only.
