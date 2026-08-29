# ADR 0006: RapidAPI Visa Requirement API Integration


* **Status:** Approved
* **Date:** 2026-08-27
* **Author(s):** AI Agent & Development Team

---

## 1. Context & Problem Statement
World Portal requires access to global passport list data and real-time visa requirement details (e.g. visa-free entry, eVisa, visa required, required documents) for passport holders traveling internationally. Integrating third-party visa data from RapidAPI (`visa-requirement.p.rapidapi.com`) provides normalized passport and visa requirement information across 200+ passports and 210+ destinations.

## 2. Decision Drivers
* **Integration Endpoint:** RapidAPI Visa Requirement v2 (`https://visa-requirement.p.rapidapi.com/v2/passports`, `/v2/visa/check`, `/v2/visa/map`).
* **Environment Security:** Store API key (`RAPIDAPI_VISA_REQUIREMENT_KEY`) and host (`RAPIDAPI_VISA_REQUIREMENT_HOST`) safely in `.env` without exposing them in logs or repository source code.
* **Performance & Caching:** Implement in-memory response caching for passport metadata (`GET /v2/passports`) to avoid redundant external network requests and minimize API quota usage.
* **Resiliency & Error Handling:** Wrap external HTTP request failures in NestJS `BadGatewayException` with detailed context while redacting credentials.
* **Security & Authentication:** Secure API endpoints with `ExternalAuthGuard` and document with `@nestjs/swagger` OpenAPI annotations.

## 3. Considered Options
* **Option 1 (Chosen):** Dedicated `VisaRequirementModule` (`src/visa-requirement`) using native Node.js `fetch` / `axios` with an in-memory caching layer for passport listings and standard NestJS service architecture.
* **Option 2:** Direct external API calls from frontend apps (Rejected due to API key exposure risk and lack of server-side validation/caching).

## 4. Proposed Architecture & Design

### Environment Configuration (`.env`)
```env
RAPIDAPI_VISA_REQUIREMENT_HOST=visa-requirement.p.rapidapi.com
RAPIDAPI_VISA_REQUIREMENT_KEY=your-rapidapi-key
RAPIDAPI_VISA_REQUIREMENT_BASE_URL=https://visa-requirement.p.rapidapi.com

```

### Module Structure (`src/visa-requirement`)
1. **`VisaRequirementModule`**: Registers `VisaRequirementController` and `VisaRequirementService`.
2. **`VisaRequirementService`**:
   - `getPassports()`: Retrieves supported passport list from cache or RapidAPI `/v2/passports`.
   - `checkVisa(passport, destination)`: Queries visa policy requirements for passport-destination pairs.
   - `getVisaMap(passport)`: Retrieves global visa breakdown map for a given passport.
3. **`VisaRequirementController`**:
   - `GET /api/visa-requirement/passports`
   - `POST /api/visa-requirement/check`
   - `POST /api/visa-requirement/map`
4. **Data Transfer Objects (DTOs)**:
   - `PassportDto`, `PassportsResponseDto`, `VisaCheckQueryDto`, `VisaCheckResponseDto`, `VisaMapQueryDto`, `VisaMapResponseDto`.

## 5. Consequences
* **Positive Impact:** Instant access to global passport lists and real-time visa policy information for all World Portal applications.
* **Trade-offs:** Dependency on external RapidAPI service uptime and quota limits, mitigated by server-side caching.

## 6. Verification & Test Plan
* **Unit Tests (`src/visa-requirement/visa-requirement.service.spec.ts`, `src/visa-requirement/visa-requirement.controller.spec.ts`):** High test coverage mocking external HTTP responses and cache logic.
* **Verification:** `npm run lint`, `npm run build`, `npm run test`.
