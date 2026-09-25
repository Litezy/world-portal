# ADR for Dummies: 0015 - Vivid, the voice assistant

* **Status:** Approved (by the product owner in chat, 2026-09-23)
* **Date:** 2026-09-23
* **Target Audience:** Non-technical stakeholders, Product Managers, Partners

---

## 1. What problem are we solving?
Visa and passport forms are long, and many applicants are not sure which visa they even need. WorldStreet already has Vivid, a voice assistant. E-Embassy did not.

## 2. What is changing?
* A small glowing orb sits in the corner of E-Embassy. Tap it and talk.
* Vivid can tell you which visa a trip needs, open the application, and **fill it in as you speak** — your name, dates, passport details — one step at a time.
* When you're done, Vivid reads the key details back and asks "shall I submit?". **Nothing is sent until you say yes.**
* Afterwards you can ask "where's my application?" or "have I paid?" and Vivid checks for you.
* Vivid cannot upload documents or take payments — it shows you where to do those yourself.
* The orb does not appear in the admin or agency consoles.

## 3. Why are we doing this?
* Faster, easier applications — especially on a phone.
* Fewer mistakes: Vivid checks each step before moving on, just like the Continue button.
* The same Vivid people already know from WorldStreet.

## 4. How does it work (in simple terms)?
Think of Vivid as a helpful clerk sitting next to you at the counter. You say the answers; the clerk writes them into the same form you would have typed into, checks them, and hands you the form to confirm before it goes in. The clerk works for WorldStreet, so you need your WorldStreet sign-in, and it can only see your own applications.

## 5. What are the key risks or things to watch out for?
* **Cost:** Vivid is **free on E-Embassy for now**; WorldStreet pays for the voice service. If that should change, there is a single switch to require the WorldStreet Vivid subscription (one small piece of code still has to be written before the switch works — until then, turning it on simply blocks Vivid).
* **Microphone:** the browser asks permission the first time; people who decline can still use the site normally.
* **Accuracy:** Vivid only fills what you say. Always listen to the read-back before saying yes.
* **Privacy:** passport and ID numbers are never read out in full.
