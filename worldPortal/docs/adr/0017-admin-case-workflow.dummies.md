# ADR for Dummies: 0017 - A proper work queue for the admin desk

* **Status:** Approved (by the product owner in chat, 2026-11-16)
* **Date:** 2026-11-16
* **Target Audience:** Non-technical stakeholders, Product Managers, Partners

---

## 1. What problem are we solving?
The admin console shows every visa and passport file, but it doesn't help staff **work** them:
* There's **no history** — you can't see who approved a file, who changed the price, or when.
* Files have **no owner** and **no deadline**, so nobody knows whose job a file is or what's overdue.
* Staff can't approve or reject **one document** (say, a blurry photo) — only the whole file.
* A file can be moved backwards (for example from "approved" to "submitted") by mistake.
* Lists load **everything at once**, which will get slow as the business grows.
* Some behind-the-scenes admin functions (agencies, professionals, notifications) have **no lock on the door** at all.
* Staff aren't told when something new arrives.

## 2. What is changing?
* Every action on a file is written to a **history** (who, what, when).
* Files can be **assigned** to a staff member with a **due date**; each person gets **"my queue"** and overdue files stand out.
* Each document gets its own **approve / reject / request again** with a note the applicant sees.
* The system only allows **sensible next steps** (submitted → under review → approved or rejected).
* Lists load **a page at a time**.
* The open admin functions get **locked**.
* Staff get **notifications** for new applications and payments.

## 3. Why are we doing this?
* **Accountability** — every decision can be traced to a person.
* **Nothing falls through the cracks** — every file has an owner and a deadline.
* **Faster, clearer service** — applicants are told exactly which document to fix.
* **Fewer mistakes** — the system refuses impossible moves.
* **Ready to grow** — the console stays fast with thousands of files.

## 4. How does it work (in simple terms)?
Think of each file as a folder on a desk. Today the folders sit in one big pile. After this change, each folder has a **name tag** (who's handling it), a **sticky note with the due date**, a **logbook stapled inside** (every action written down), and a **tick box next to each document**. The rules are like a one-way corridor: a folder can move forward to "approved" or "rejected", but never back to the start.

## 5. What are the key risks or things to watch out for?
* History starts **from the day this goes live** — older files won't have a full logbook.
* The new locks on admin functions are only as strong as the console's sign-in, which is **still the old, weak kind** until the WorldStreet staff sign-in decision is made.
* All changes are built and tested on a **copy of the database** (a Neon dev branch), never on live data.
* It's a bigger change than 0016 and lands after it.
