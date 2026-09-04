# ADR for Dummies: 0007 - Mobile-Responsive Admin Dashboard & Operations Console

* **Status:** Proposed
* **Date:** 2026-09-03
* **Target Audience:** Product Managers, Agency Partners, Non-Technical Stakeholders

---

## 1. What problem are we solving?
Currently, our processing staff and managers review visa and passport applications using simple list pages. As application volume grows, staff need to quickly evaluate visa costs, check official passport documents (like NIN and birth certificates), approve refunds, and communicate with applicants—whether they are sitting at a desk or working from a mobile phone.

---

## 2. What is changing?
We are building a **fully mobile-responsive Admin Dashboard**. 

1. **UI First Approach**: We will design and build the complete screen experience first on mobile phones, tablets, and desktop computers. Once the screens look and feel great, we will connect them to the backend API.
2. **Mobile Convenience**: Staff will be able to review applications, evaluate costs, and approve/reject submissions directly from their mobile devices with swipe gestures and touch-friendly buttons.
3. **Financial & Customer Control Center**: Managers will be able to track revenue, manage 50% installment payment options, calculate refund surcharges, and view complete customer histories in one central place.

---

## 3. Why are we doing this?
* **Faster Response Times**: Staff can evaluate submitted visa costs instantly on their phones without needing a desktop computer.
* **Fewer Errors**: Clear side-by-side document viewers ensure photos, NIN numbers, and bank statements are properly verified before approving applications.
* **Better Partner & Customer Experience**: Agencies (`PARTNERS`) and applicants get faster status updates and clear automated notification emails.

---

## 4. How does it work (in simple terms)?
* **Step 1 (Mobile Navigation)**: On a phone screen, the side menu cleanly tucks away into a hamburger menu button. Clicking it slides out a smooth menu.
* **Step 2 (Smart Mobile Cards)**: Large tables automatically transform into easy-to-read cards on mobile screens so staff don't have to scroll left and right endlessly.
* **Step 3 (Cost Evaluation & Approvals)**: Staff can tap an application, set the processing cost, toggle whether the customer can pay in 2 installments, and tap "Send Evaluation".
* **Step 4 (Connected API)**: Once the screens are tested, the system connects directly to the server to update payments, email the customer, and record audit trails.

---

## 5. What are the key risks or things to watch out for?
* **Document Visibility on Small Screens**: Viewing high-resolution bank statements or passport data pages on small phone screens requires pan and zoom features.
* **Role Safety**: Only authorized `MANAGERS` should be allowed to approve refunds or change platform service fees.
