# ADR for Dummies: 0014 - Sign in with WorldStreet

* **Status:** Approved (by the product owner in chat, 2026-09-23)
* **Date:** 2026-09-23
* **Target Audience:** Non-technical stakeholders, Product Managers, Partners

---

## 1. What problem are we solving?
E-Embassy is part of WorldStreet, but it did not know who its applicants were. People "signed in" by typing an email and a code, the website only remembered that on the device, and anyone who knew an applicant's email could look up their applications.

## 2. What is changing?
* Applicants now use their **WorldStreet account**. If they are already signed in on worldstreetgold.com, they are already signed in on E-Embassy — nothing to do.
* If they are not, E-Embassy sends them to the WorldStreet sign-in page and brings them straight back.
* There is **no E-Embassy password and no email code** to sign in any more.
* Visa and passport forms fill in the email from the WorldStreet account automatically.
* "My applications" and "My hires" now show exactly the records belonging to the signed-in account.
* The admin and agency consoles are **not** changing in this step.

## 3. Why are we doing this?
* **One account for the whole WorldStreet family** — less friction, no forgotten passwords.
* **Privacy** — nobody can read someone else's applications by guessing an email.
* **Simpler onboarding** — the first visit just registers the person as an E-Embassy applicant.

## 4. How does it work (in simple terms)?
Think of WorldStreet as the building's front desk and E-Embassy as one office inside. You show your badge once at the front desk; every office recognises it. E-Embassy keeps a small note that you have visited, and files every application under your badge number. If you applied before this change with the same (verified) email, those applications are moved into your account the first time you visit.

## 5. What are the key risks or things to watch out for?
* E-Embassy must use **the same WorldStreet account system and keys** and live on a `worldstreetgold.com` web address, or sign-in will not carry across.
* **Signing out** of E-Embassy signs you out of WorldStreet too, because it is the same account.
* An application's contact email is always the account's email; applying for someone with a different email needs their own WorldStreet account.
* The admin console's own sign-in still needs to be strengthened in a later step.
