# ADR 0002: S3 Document Upload Service

* **Status:** Approved
* **Date:** 2026-08-27
* **Author(s):** AI Agent & Development Team

---

## 1. Context & Problem Statement
World Portal's passport and visa documentation processing workflow requires uploading document scans (e.g., passports, visa applications, supporting PDF/image proofs). To prevent local server disk saturation and enable cloud scalability, files must be uploaded to an AWS S3 bucket (or S3-compatible object storage) and return a direct file URL.

## 2. Decision Drivers
* **AWS SDK v3:** Use modular `@aws-sdk/client-s3` for modern TypeScript support and low bundle footprint.
* **Security & Validation:** Validate file size (max 10MB) and allowed MIME types (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`).
* **Environment Configuration:** Configurable S3 credentials (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `AWS_S3_CUSTOM_DOMAIN`).
* **Swagger OpenAPI Documentation:** Expose `POST /api/upload` with `@ApiConsumes('multipart/form-data')` and `@ApiBody(...)`.
* **Structured Observability:** Enforce `Logger` context logging (`[UploadService]`) without logging secret credentials.

## 3. Considered Options
* **Option 1 (Chosen):** Dedicated `UploadModule` (`src/upload`) using NestJS `FileInterceptor` and `@aws-sdk/client-s3` `PutObjectCommand`.
* **Option 2:** Direct client-side presigned S3 URLs (Deferred for future phase; server-side verified upload selected for strict server validation of visa documents).

## 4. Proposed Architecture & Design

### Environment Configuration (`.env`)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=world-portal-documents
AWS_S3_CUSTOM_DOMAIN=https://documents.worldportal.com
```

### Module Structure (`src/upload`)
1. **`UploadModule`**: Registers `UploadController` and `UploadService`.
2. **`UploadController`**:
   - `POST /api/upload` - Single file upload returning `{ url, key, originalName, mimeType, size }`.
3. **`UploadService`**:
   - Instantiates `S3Client` via `ConfigService`.
   - Generates unique key (`documents/${uuid}-${filename}`).
   - Executes `PutObjectCommand` and constructs the public/S3 file URL.
4. **File Interceptor & Pipe Validation**:
   - `MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })` (10 MB).
   - `FileTypeValidator({ fileType: /(pdf|jpeg|jpg|png|webp)$/i })`.

## 5. Consequences
* **Positive Impact:** Offloads file storage from application servers; returns immutable cloud S3 URLs for Visa Documentation records; strict file format validation.
* **Trade-offs:** Requires AWS S3 bucket configuration and IAM credentials in production environment.

## 6. Verification & Test Plan
* **Unit Tests (`src/upload/upload.service.spec.ts`, `src/upload/upload.controller.spec.ts`):** 100% test coverage mocking `@aws-sdk/client-s3`.
* **Verification:** `npm run lint`, `npm run build`, `npm run test`.
