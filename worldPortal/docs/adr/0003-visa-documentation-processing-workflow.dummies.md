# ADR for Dummies: 0003 - Visa Application, Admin Cost Evaluation & Exponential Backoff Payment Lifecycle Workflow

* **Status:** Approved
* **Date:** 2026-08-27
* **Target Audience:** Non-technical stakeholders, Product Managers, Operations Staff

---

## 1. What problem are we solving?
Applicants submit visa applications, but visa fees vary depending on destination country and visa category. We need a reliable payment process backed by automatic retries (exponential backoff) so that if payment provider networks or email services experience temporary hiccups, the system automatically retries (up to 5 times) before failing. Once payment is confirmed, the application **automatically moves to `UNDER_REVIEW`** so staff can begin verification immediately.

## 2. What is changing?
* **Public Guest Submissions:** Any applicant (registered or guest) submits a visa application (`SUBMITTED`, `PENDING_EVALUATION`).
* **Admin Cost Evaluation:** Admin sets total cost (e.g. $500) and whether half-payment is allowed (`EVALUATED`, `AWAITING_PAYMENT`).
* **Automated Email Notification (Retry Protected):** Submitter gets an email alerting them to make payment. Job uses BullMQ retries (`5 attempts` with exponential delay: 2s, 4s, 8s, 16s, 32s).
* **2-Step Payment Lifecycle (Retry Protected):**
  1. **Initiate Payment (`POST /api/visa-documentation/:id/initiate-payment`):** Applicant chooses Full ($500) or Half Installment ($250 deposit). System queues job with exponential backoff retries, generates a transaction reference, and returns success.
  2. **Confirm Payment (`POST /api/visa-documentation/:id/confirm-payment`):** System verifies payment receipt, updates `amountPaid` and `balanceDue`, sets payment status (`PARTIALLY_PAID` or `FULLY_PAID`), and **automatically advances application status to `UNDER_REVIEW`**.
* **Document Verification & Decision:** Staff verifies documents in `UNDER_REVIEW` and marks final decision (`APPROVED` or `REJECTED`).

## 3. Why are we doing this?
* **Automatic Retry Reliability:** Exponential backoff ensures temporary internet or gateway blips don't drop payment transactions or emails.
* **Applicant Centric Terminology:** Standardized business language using `applicant` throughout the application lifecycle.
* **Zero Delay:** The system automatically moves confirmed payments directly into `UNDER_REVIEW`.

## 4. How does it work (in simple terms)?
1. Guest applicant submits visa application (`SUBMITTED`).
2. Admin evaluates cost ($500) and enables half-payment option (`EVALUATED`, `AWAITING_PAYMENT`).
3. System queues email to applicant (with automatic retries if SMTP is busy).
4. Applicant selects Half Installment ($250) and initiates payment.
5. Payment is confirmed -> System updates record ($250 paid, $250 balance due), sets payment status to `PARTIALLY_PAID`, and **automatically switches status to `UNDER_REVIEW`**.
6. Staff verifies documents and approves application.

## 5. What are the key risks or things to watch out for?
* **Queue Health:** Redis + BullMQ handles retry queues seamlessly with exponential backoff options.
