# ADR 0004 for Dummies: Dedicated Payment & Refund Processing Engine

## 1. What Problem Are We Solving?
Previously, payment calculations and status updates were handled directly inside the visa document processing module. This made it difficult to manage platform fee markups, handle partial refunds with surcharges, or track separate payment receipt ledgers cleanly.

## 2. Why Are We Doing This?
By creating a dedicated **Payment Engine (`src/payment`)**:
* All payments, receipts, fee markups, and surcharged refunds are tracked in a secure financial ledger.
* Admins can configure platform fee markups (e.g. 10% markup) and refund surcharge percentages (e.g. 15% fee retained on refunds).
* The visa document system focuses solely on checking documents, while delegating all money matters to the Payment Engine.

## 3. How Does It Work in Simple Terms?
1. **Cost Evaluation:** Admin sets the visa cost on the application.
2. **Payment Initiation:** When the customer pays (either Full or 50% Installment), the Payment Engine creates a transaction record (`INITIATED`), calculates fees, and generates a payment reference code.
3. **Payment Confirmation:** When payment is completed, the Payment Engine updates the transaction to `CONFIRMED` and immediately calls the Visa System directly in code (`handlePaymentConfirmed()`) to start reviewing documents (`UNDER_REVIEW`).
4. **Surcharged Refunds:** If a refund is needed, the Payment Engine deducts the administrative surcharge (e.g., 15%) and processes the net refund amount.

## 4. Key Business Benefits & Risks
* **Benefit:** Clear financial tracking, automated fee markup calculations, and secure refund processing.
* **Risk:** Temporary payment gateway connection failures (handled gracefully using background retry queues with exponential backoff).
