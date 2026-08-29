# ADR for Dummies: 0001 - User Profiles and Account Management

* **Status:** Approved
* **Date:** 2026-08-27
* **Target Audience:** Non-technical stakeholders, Product Managers, Operations Staff

---

## 1. What problem are we solving?
Our World Portal platform needs a clear, secure way to keep track of who users are and what they are allowed to do. We have three groups of users (Managers, Partners, and Operational Staff), and we need a system to manage their account information without having to build a complex password storage system from scratch (since sign-in is handled by an external identity service).

## 2. What is changing?
* **Account Profiles:** Every user will have a profile storing their name, email, phone number, role (`manager`, `partner`, or `staff`), and an optional unique ID from the external authentication service.
* **Optional External Link:** Including the external auth ID is optional, allowing administrators to pre-create user profiles before the user registers in the external identity system.
* **Role Permissions:**
  * **Managers:** Can see all profiles, create new staff/partner profiles, and change system settings.
  * **Partners:** Can view and manage their own agency account details.
  * **Staff:** Can view profiles needed for processing visa applications.
* **Default Admin Profile:** The seed script creates the default manager profile (`manager@loveworld.com` with role `manager`). **Note:** Local profiles do not carry or store passwords; password authentication (`Password@2`) is delegated entirely to the external identity service linked via `externalAuthId`.

## 3. Why are we doing this?
* **Security:** Relying on a dedicated external login provider keeps user credentials safe while keeping our platform simple and focused.
* **Access Control:** Ensures partners and staff only see what they are authorized to see.
* **Quick Setup:** Having a default manager seeded means team members can start testing and managing the platform immediately.

## 4. How does it work (in simple terms)?
1. A user logs in through the external security provider.
2. The login provider gives the user a secure digital badge (a token).
3. When the user visits World Portal, our system checks their digital badge, finds their local profile, and checks if their role (`manager`, `partner`, or `staff`) permits the requested action.

## 5. What are the key risks or things to watch out for?
* **Synchronization:** If a user is added in the external login system, a corresponding profile must be created in World Portal so the user can interact with the system seamlessly.
