# Application Advisory Review and Handover Notes

**Application:** World Portal — NestJS backend and Next.js frontend  
**Review date:** 15 September 2026  
**Status:** Owner feedback added  
**Purpose:** Record observed behavior, explain its implications, and help the incoming maintainer distinguish intentional implementation choices from work that remains outstanding.

## Context and interpretation

The application owner has indicated that most of the reviewed behaviors are intentional. This document does not assume that every finding is an unintended defect or an approved request for changes. Each item includes space to record the owner's rationale, operating assumptions, and handover instructions.

Intentional behavior can still require deployment restrictions or follow-up work. The risk ratings below describe potential impact when the relevant routes are reachable by untrusted callers; they do not establish that a deployed environment is exposed or compromised. Final release decisions should account for the owner's responses and verified deployment controls.

No application code was modified during the review. This document records the reviewed workspace state, including existing local changes; it is not tied to an immutable commit.

## Scope and evidence

Reviewed authentication, authorization, applicant access, agency operations, OTP workflows, and payment confirmation in `worldPortal` and `world-portal-frontend`.

Evidence consists of source inspection, existing unit tests, and isolated checks using in-memory mocks. No deployed-service penetration test, browser end-to-end run, dependency vulnerability audit, or infrastructure review was performed. Actual gateway restrictions, network exposure, environment settings, and production database behavior were not verified.

### Verification results

| Check | Result | Interpretation |
| --- | --- | --- |
| Backend unit tests | 82 passed; 1 failed across 19 suites | The failing OTP test expects rejection for a nonexistent account, while the implementation allows verification. Owner intent must determine whether the test or behavior should change. |
| Frontend unit tests | 129 passed across 17 files | Some tests logged blocked backend connection attempts. Passing unit tests do not establish integration correctness. |
| Forged-token check | Reproduced locally | An expired JWT signed with an attacker-controlled key passed authentication with mock authentication disabled. A mocked manager profile lookup also passed. |
| Default OTP bypass check | Reproduced locally | Verification succeeded without sending a code or having an account. |
| Concurrent payment confirmation | Reproduced with mocks | Two concurrent calls invoked application crediting for the same transaction. Actual database outcomes depend on timing. |

Backend tests ran with `npm test -- --runInBand --no-cache --watchman=false --silent`. Watchman was disabled after the initial run encountered a sandbox restriction. Frontend tests ran using installed Node 22.23.0 because the shell's Node 18 runtime could not start Vitest.

## Summary for the incoming maintainer

| ID | Advisory item | Potential risk | Owner disposition |
| --- | --- | --- | --- |
| AR-01 | Token decoding without signature verification | Critical | Feedback added below |
| AR-02 | Public payment confirmation without payment evidence | Critical | Feedback added below |
| AR-03 | Applicant records retrievable by supplied email | High | Feedback added below |
| AR-04 | Agency operations without backend access controls | High | Feedback added below |
| AR-05 | Default OTP bypass and logged verification codes | High | Feedback added below |
| AR-06 | Non-atomic payment confirmation | High | Feedback added below |

## AR-01 — Token decoding without signature verification

**Observed behavior:** The backend authentication guard uses `JwtService.decode()` and accepts the decoded identity without verifying the signature or expiry. The role guard then looks up a local profile using the supplied identity. Mock authentication also defaults to enabled, and the test-token helper can issue tokens when enabled.

**References:**

- [External authentication guard](worldPortal/src/auth/guards/external-auth.guard.ts)
- [Role guard](worldPortal/src/auth/guards/roles.guard.ts)
- [Test-token controller](worldPortal/src/auth/auth.controller.ts)

**Evidence:** An expired token signed using an unrelated key passed the guard with `ENABLE_MOCK_AUTH=false`. A mocked lookup for an active manager profile passed the role guard.

**Implication:** If an untrusted caller can reach protected backend routes, they can claim a known privileged identity. Disabling mock authentication alone does not address the decoding behavior.

**Suggested action if production hardening is required:** Validate token signatures, expiry, issuer, and audience against the intended identity provider. Disable mock authentication and test-token issuance by default, with explicit environment restrictions.

**Acceptance checks:** Reject incorrectly signed and expired tokens; reject unexpected issuers/audiences; accept a valid provider token; verify that test-token issuance is unavailable in the intended production configuration.

**Owner feedback:** The current token handling is an intentional interim implementation. Authentication will be provided by the parent platform’s existing identity provider, and the receiving team should replace this temporary handling when that integration is introduced.

## AR-02 — Public payment confirmation without payment evidence

**Observed behavior:** `POST /api/payments/confirm` has no authentication guards. Its service accepts a transaction reference, applies credit to a linked visa application, and marks the transaction confirmed without checking payment-provider evidence. The public initiation endpoint returns the transaction reference.

**References:**

- [Payment controller](worldPortal/src/payment/payment.controller.ts)
- [Payment service](worldPortal/src/payment/payment.service.ts)

**Evidence:** Source inspection and route-metadata inspection confirmed the absence of method/class guards. The service directly applies the confirmation; no real payment was attempted during review.

**Implication:** If this endpoint is available to applicants or other untrusted callers, an unpaid transaction can be marked as paid. This may be an intentional simulation or a placeholder for a later payment integration.

**Suggested action if real payment records depend on this route:** Restrict confirmation to authorized staff or authenticated provider notifications, and validate transaction identity, amount, currency, and provider status.

**Acceptance checks:** Anonymous confirmation is rejected; invalid payment evidence cannot change balances; a legitimate confirmation updates the correct application exactly once.

**Owner feedback:** Payment confirmation has intentionally been left open pending integration with the parent platform’s payment infrastructure. That integration will define how payments are verified and when this application should record them as confirmed.

## AR-03 — Applicant records retrievable by supplied email

**Observed behavior:** Visa and passport applicant lookup routes accept an email or profile ID without an authentication guard. Their services return matching application records. The frontend applicant aggregation route also lacks a session check.

**References:**

- [Visa controller](worldPortal/src/visa-documentation/visa-documentation.controller.ts)
- [Visa service](worldPortal/src/visa-documentation/visa-documentation.service.ts)
- [Passport controller](worldPortal/src/passport-application/passport-application.controller.ts)
- [Passport service](worldPortal/src/passport-application/passport-application.service.ts)
- [Frontend applicant route](world-portal-frontend/src/app/api/applicant/applications/%5Bidentifier%5D/route.ts)

**Evidence:** Source inspection traced the caller-supplied identifier into database filters without an authenticated ownership check. No real applicant records were retrieved.

**Implication:** A caller who knows an applicant's email may retrieve personal and application details. An OTP step in the user interface does not itself protect these routes from direct requests.

**Suggested action if these records are private:** Establish an applicant session after verification, derive identity from that session, and enforce ownership in the backend. Explicitly limit fields returned by any deliberately public tracking route.

**Acceptance checks:** Anonymous access and cross-applicant access fail; an authenticated applicant can retrieve only their permitted records; public tracking responses contain only approved fields.

**Owner feedback:** The current applicant lookup was introduced as a temporary access bypass. Once the parent platform’s authentication service is integrated, applicant access should be tied to the authenticated user rather than relying on a supplied email or profile ID alone.

## AR-04 — Agency operations without backend access controls

**Observed behavior:** The agency controller exposes verification changes, listing edits, staff operations, document verification, assignment completion, and payout reads without backend authentication guards.

**References:**

- [Agency controller](worldPortal/src/agency/agency.controller.ts)
- [Agency service](worldPortal/src/agency/agency.service.ts)

**Evidence:** Source inspection identified unguarded routes; route-metadata inspection confirmed no class/method guards for agency verification. No agency records were changed.

**Implication:** If reachable by untrusted callers, agency administration can be performed without proving agency membership or administrative authority. Frontend session checks alone do not secure direct backend access.

**Suggested action if agency isolation is required:** Enforce backend authentication, membership checks for each agency resource, and separate permissions for administrative verification and agency self-service.

**Acceptance checks:** Anonymous writes fail; one agency cannot read or modify another agency's private resources; only authorized administrators can approve verification.

**Owner feedback:** Agency access controls were intentionally deferred to the parent platform integration. The receiving team should use the parent authentication service to identify users and apply the appropriate permissions to agency operations.

## AR-05 — Default OTP bypass and logged verification codes

**Observed behavior:** Backend OTP verification enables its bypass unless `ENABLE_OTP_DEV_BYPASS` is exactly `false`. The default bypass code is `000000`, without a production-environment restriction. Generated codes and bypass information are logged. Verified status is held in memory against an email address for 30 minutes.

**Reference:** [OTP service](worldPortal/src/otp/otp.service.ts)

**Evidence:** With bypass settings unset, a local mocked check verified an email without any prior OTP send or existing account. One existing unit test fails because it expects nonexistent-account verification to be rejected.

**Implication:** Where enabled, OTP success does not prove mailbox control. Logging real codes exposes them to log readers. An email-only verification flag is shared across requests rather than bound to the client that completed verification.

**Suggested action if OTP proves identity:** Remove or explicitly restrict the bypass to local development, stop logging codes, add attempt limits, and bind verification to an authenticated session or scoped proof. Decide explicitly whether new applicants may verify without an existing account; that requirement is separate from the bypass issue.

**Acceptance checks:** The production configuration rejects bypass codes; incorrect/expired codes fail; attempts are limited; codes are absent from logs; verification cannot be borrowed by another client. Align the failing test with the agreed account-registration policy.

**Owner feedback:** The current OTP flow is temporary and is intended to be replaced by the parent platform’s existing authentication service. The receiving team should retire this interim verification flow as part of that integration.

## AR-06 — Non-atomic payment confirmation

**Observed behavior:** Payment confirmation reads transaction status, credits the application, and marks the transaction confirmed in separate operations. Manual bank-transfer confirmation also creates its payment record separately from updating the application.

**Reference:** [Payment service](worldPortal/src/payment/payment.service.ts)

**Evidence:** Two simultaneous confirmations using in-memory mocks both invoked application crediting for one transaction. This demonstrates the missing concurrency barrier, not a measured production database outcome.

**Implication:** Concurrent requests or a failure between writes can leave transaction and application records inconsistent. Retrying after a partial failure may reapply credit. This concern remains relevant even if only trusted staff can confirm payments.

**Suggested action if payment consistency is required:** Use a database transaction, a conditional status transition, and idempotency protection. Arrange notifications so delivery failures cannot invalidate or repeat financial state changes.

**Acceptance checks:** Concurrent duplicate confirmations apply credit once; injected failures roll back related database changes; retries return a consistent result without duplicate credit or receipts.

**Owner feedback:** Payment consistency is intended to be handled through the parent platform’s existing payment infrastructure. The receiving team should connect local payment and application updates to that workflow so retries and repeated confirmations are handled consistently.

## Completing the handover

The owner can respond using the advisory IDs, for example: **AR-02: Intentional for demo only; replace with verified provider confirmation before accepting real payments.**

For each item, the incoming maintainer should receive the accepted rationale, applicable environment, required controls, and an explicit next action. Suggested remediation in this document is advisory and does not constitute approval to modify the code.

Once owner responses are recorded, confirm deployment assumptions and prioritize outstanding work. For an environment exposed to untrusted users with real applicant and payment data, the review recommends resolving AR-01 through AR-04 before release, followed by OTP and payment-consistency work. This recommendation should be revisited against the documented owner decisions and verified controls.
