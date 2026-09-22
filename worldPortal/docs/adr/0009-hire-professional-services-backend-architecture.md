# ADR 0009: Hire & Professional Services Backend Architecture

* **Status:** Approved
* **Date:** 2026-09-13
* **Author(s):** Raphael Etta / Antigravity AI

---

## 1. Context & Problem Statement
The frontend introduced a Hire page (`/hire`) allowing users to browse professional specialists (private drivers, personal security guards, interpreters, tour guides, event coordinators), view pro profile cards, check ratings, and place hiring booking requests.

To replace the static frontend fixture data (`src/content/professionals.ts`), we must implement a production NestJS `HireModule` in `worldPortal`, define Prisma data models for professionals and booking requests, and expose REST API endpoints.

## 2. Decision Drivers
* **Search & Filtering:** Fast filtering by category, country, rating, and availability.
* **Booking Ledger:** Relational tracking of traveler booking requests tied to specific professional profiles.
* **Rating System:** Aggregated average ratings based on verified client reviews.

## 3. Proposed Architecture & Design

### Data Schema (`prisma/schema.prisma`)
- `ProfessionalProfile`: Name, title, category, bio, avatarUrl, countryCode, country, hourlyRate, currency, languages, rating, completedJobs, isVerified.
- `HireBooking`: Reference, professionalId, travellerName, travellerEmail, travellerPhone, destination, startsAt, endsAt, totalAmount, currency, status (`REQUESTED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
- `ProfessionalRating`: ProfessionalId, reviewerName, rating, reviewText, createdAt.

### NestJS Architecture (`worldPortal/src/hire/`)
- `HireModule`
- `HireService`: Methods to query professionals with pagination/filters, retrieve professional profile, create hire booking, submit rating.
- `HireController`:
  - `GET /api/hire/professionals`: Filterable paginated directory.
  - `GET /api/hire/professionals/:id`: Single professional details.
  - `POST /api/hire/bookings`: Create hire request booking.
  - `POST /api/hire/professionals/:id/ratings`: Submit review and update rating.

## 4. Consequences
* **Positive Impact:** Live backend directory of professionals, booking persistence, and real-time rating updates.
* **Verification:** Unit tests covering filtering, rating calculations, and booking creation.
