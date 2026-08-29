# ADR 0001: Profile and User Account Management

* **Status:** Approved
* **Date:** 2026-08-27
* **Author(s):** AI Agent & Development Team

---

## 1. Context & Problem Statement
The World Portal requires user identity and profile management for three operational roles (`manager`, `partner`, `staff`). Authentication is delegated to an external authentication provider; therefore, the platform must consume identity tokens issued externally while maintaining local application profiles, roles, contact metadata, and permissions. Additionally, the system requires automated seeding of a default administrative manager account (`manager@loveworld.com` / `Password@2`).

## 2. Decision Drivers
* **External Authentication Delegation:** Decouple password storage/authentication logic from World Portal while binding external Auth IDs to local profiles.
* **Role-Based Access Control (RBAC):** Restrict system endpoints based on `manager`, `partner`, and `staff` permissions.
* **Database & ORM:** Utilize PostgreSQL + Prisma ORM for data persistence and migration management.
* **Bootstrap Seeding:** Provide repeatable database seeding (`prisma/seed.ts`) for default administrator setup.
* **Structured Observability:** Enforce contextual logging for all account profile operations.

## 3. Considered Options
* **Option 1 (Chosen):** Dedicated `Profile` resource (`src/profile`) with Prisma ORM data model, external auth JWT guard, role-based metadata, and Prisma seed script.
* **Option 2:** Embedded auth handling within World Portal (Rejected due to architectural requirement for delegated external auth).

## 4. Proposed Architecture & Design

### Data Model (Prisma Schema - `prisma/schema.prisma`)
```prisma
enum UserRole {
  MANAGER
  PARTNER
  STAFF
}

model Profile {
  id             String   @id @default(uuid())
  externalAuthId String?  @unique
  email          String   @unique
  firstName      String
  lastName       String
  phone          String?
  role           UserRole @default(STAFF)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([email])
  @@index([role])
}
```

### Module & Component Design (`src/profile`)
1. **`ProfileModule`**: Encapsulates controller, service, Prisma persistence, and RBAC guards.
2. **`ProfileController`**: Exposes REST endpoints:
   - `POST /profiles` - Create profile (Manager only)
   - `GET /profiles/me` - Retrieve authenticated user's profile
   - `GET /profiles` - List/filter profiles (Manager only)
   - `GET /profiles/:id` - Fetch profile details (Manager / Staff / Self)
   - `PATCH /profiles/:id` - Update profile metadata
   - `DELETE /profiles/:id` - Deactivate profile (Manager only)
3. **`ProfileService`**: Business logic, database queries via `PrismaService`, and structured logging.
4. **`ExternalAuthGuard` & `RolesGuard`**: Validate bearer JWT from external auth service and enforce `@Roles(...)` decorators.
5. **Swagger Documentation**: Decorate `ProfileController` with `@ApiTags('Profiles')`, `@ApiBearerAuth()`, `@ApiOperation()`, and `@ApiResponse()`; annotate DTOs (`CreateProfileDto`, `UpdateProfileDto`) with `@ApiProperty()` and `@ApiPropertyOptional()`.

### Seed Specification (`prisma/seed.ts`)
Seeds default manager:
* **Email:** `manager@loveworld.com`
* **External Auth ID:** `seed-manager-auth-id`
* **Role:** `MANAGER`
* **Password Note:** The local `Profile` table contains **no password field**. Password validation for `manager@loveworld.com` (`Password@2`) is handled exclusively by the external Auth service.

## 5. Consequences
* **Positive Impact:** Clear boundary between identity token verification and local domain profiles; type-safe role controls; deterministic initial state via Prisma seed.
* **Trade-offs:** Requires synchronization between external auth provider identity creation and local profile creation.

## 6. Verification & Test Plan
* **Unit Tests (`src/profile/profile.service.spec.ts`, `src/profile/profile.controller.spec.ts`):** 100% coverage on service methods, role authorization checks, and error exceptions.
* **E2E Tests (`test/profile.e2e-spec.ts`):** Complete HTTP request flows for profile retrieval, creation, role guarding, and seed validation.
