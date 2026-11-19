# ADR for Dummies: 0016 - Making refunds, payments and team changes safe

* **Status:** Approved (by the product owner in chat, 2026-11-16)
* **Date:** 2026-11-16
* **Target Audience:** Non-technical stakeholders, Product Managers, Partners

---

## 1. What problem are we solving?
The admin console is getting working buttons for **refunds**, **fee settings** and **managing the team**. Behind those buttons, the system has some bookkeeping mistakes:
* When someone is refunded, the payment is marked refunded, but their **application still says they paid**.
* If staff set the price of a visa again after the applicant paid, the system **forgets the payment** was ever made.
* A payment marked "half now, half later" is accepted even on files that **don't allow instalments**.
* Typing a bank reference that was already used shows a **crash** instead of a clear message.
* Notes typed when confirming a bank payment are **thrown away**.
* A visa that was already **approved** can be pushed back to "under review" when a late payment is recorded.
* A manager can accidentally **remove their own access**, or the **last manager**, and lock everyone out.

## 2. What is changing?
* Refunds now update the applicant's file too, and the applicant gets a **refund email**.
* Staff get a **list of all refunds** in the console.
* Setting a price never wipes out money already received, and can't be redone once the applicant has paid.
* Bank payments keep their notes, respect the instalment rule, and give a clear message for a repeated reference.
* Approved visas stay approved.
* The console blocks a manager from demoting or deactivating themselves or the last manager, and can **resend an invite**.

## 3. Why are we doing this?
* **Trustworthy numbers** — what the finance screen says is what actually happened.
* **Fewer support headaches** — clear messages instead of crashes.
* **No lock-outs** — the business can't accidentally lose access to its own console.

## 4. How does it work (in simple terms)?
Think of each application as a till receipt and each payment as a bank slip. Today, a refund updates the bank slip but leaves the receipt saying "paid". After this change, every refund, payment and price change updates **both**, so they always match. The team rules work like a building with one master key: the system won't let the last key-holder throw their key away.

## 5. What are the key risks or things to watch out for?
* Refunds stay **one-step**: one manager can refund without a second person approving. Whether a second approver is needed for large refunds is a **business decision** still to make.
* Partial refunds are still not possible.
* The console's sign-in is still the old, weak kind until the WorldStreet staff sign-in decision is made — these protections assume the person signed in is who they claim to be.
* Changes are tested on a **copy** of the database (a Neon dev branch), never on live data.
