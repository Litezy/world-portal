# ADR 0005: Pluggable Cloud Storage Provider Architecture (S3 & Cloudinary)

## Status
Approved

## Context & Problem Statement
Currently, document upload handling (`src/upload`) is tightly coupled to AWS S3 (`@aws-sdk/client-s3`). To support flexible deployment environments, cost optimizations, and multi-cloud strategies, the platform needs the capability to seamlessly switch between **AWS S3** and **Cloudinary** (or simulated dev providers) via runtime configuration without altering business logic or consumer API contracts.

## Decision Drivers
* **Provider Flexibility**: Ability to switch storage backend (`s3` vs `cloudinary`) using an environment variable (`STORAGE_PROVIDER`).
* **Zero Downtime / Code Alteration**: Core upload controllers and services should consume a generic storage provider interface (`IStorageProvider`).
* **Maintainability & Testability**: Decouple cloud SDK configurations into isolated provider implementations (`S3StorageProvider`, `CloudinaryStorageProvider`).
* **Backward Compatibility**: Preserve existing upload response structure (`UploadResponseDto`: `url`, `key`, `originalName`, `mimeType`, `size`).

## Proposed Architecture & Design

### Strategy Pattern Implementation
```
               ┌──────────────────────────┐
               │      UploadService       │
               └────────────┬─────────────┘
                            │ (uses)
                            ▼
              ┌──────────────────────────┐
              │    IStorageProvider      │
              └─────────────┬────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌────────────────────────┐
│   S3StorageProvider   │       │CloudinaryStorageProvider│
└───────────────────────┘       └────────────────────────┘
```

### Provider Configurations
1. **`STORAGE_PROVIDER` Env Var**: `s3` (default) or `cloudinary`.
2. **Cloudinary Configuration**:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `CLOUDINARY_FOLDER` (default: `world-portal-documents`)
3. **AWS S3 Configuration**:
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_S3_BUCKET_NAME`

## Consequences
* **Positive**:
  - Seamless switching between AWS S3 and Cloudinary.
  - Simplified local development and mock testing.
  - Clean separation of storage SDK concerns.
* **Negative**:
  - Added dependency on `cloudinary` SDK package.

## Test Plan
- Unit tests verifying `UploadService` behavior under `s3` vs `cloudinary` configuration flags.
- Comprehensive ESLint, build, and unit test suite execution (`npm run lint && npm run build && npm run test`).
