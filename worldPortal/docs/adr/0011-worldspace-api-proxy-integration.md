# ADR 0011: WorldSpace API Integration & Proxy Seam

* **Status:** Approved
* **Date:** 2026-09-13
* **Author(s):** Raphael Etta / Antigravity AI

---

## 1. Context & Problem Statement
The frontend contains a WorldSpace social feed section (`src/features/worldspace/`). The client seam (`src/server/worldspace/client.ts`) is designed to toggle seamlessly between placeholder mock feed items and a live WorldSpace API endpoint.

## 2. Decision Drivers
* **Environment Config Seam:** Toggling between local fixtures and live feed via `WORLDSPACE_API_URL`.
* **Zod Schema Validation:** Safe parsing of feed response items via `feedResponseSchema`.

## 3. Implementation
- Added `WORLDSPACE_API_URL` to environment configuration (`.env.example`).
- Configured client seam in `src/server/worldspace/client.ts` to validate external feed responses or fall back cleanly to curated feed posts.
