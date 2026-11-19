-- Sync the migration history with prisma/schema.prisma.
--
-- The baseline (20260827000000_payment_engine_setup) only creates Profile,
-- VisaDocumentation, PaymentConfig, PaymentTransaction and PaymentRefund.
-- Everything added to the schema since then was applied with `prisma db push`,
-- so existing databases are in different states. This migration therefore
-- only creates what is missing and is safe to run on:
--   * a fresh database (after the baseline),
--   * a database that only has the baseline,
--   * a database built with `db push` from an older or the current schema
--     (mark the baseline as applied first, see docs/DATABASE_MIGRATIONS.md).
-- Where everything already exists it changes nothing.
--
-- It is one transaction: if any statement fails, nothing is applied.
-- Nothing here drops a table, a column or data. The only removal is the
-- unused Gender value OTHER, and that step stops with an error (instead of
-- rewriting anyone's data) if a row still uses it.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE "PassportCategory" AS ENUM ('FRESH', 'RENEWAL', 'DAMAGE', 'MARRIAGE', 'DIVORCE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "PassportValidity" AS ENUM ('FIVE_YEARS', 'TEN_YEARS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "BookletType" AS ENUM ('THIRTY_TWO_PAGES', 'SIXTY_FOUR_PAGES');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "PassportApplicationStatus" AS ENUM ('SUBMITTED', 'EVALUATED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "AgencyVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "AgencyListingStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'LIVE', 'REJECTED', 'PAUSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "AgencyUserRole" AS ENUM ('OWNER', 'MANAGER', 'COORDINATOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "AgencyStaffStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'OFF_DUTY', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "AssignmentStatus" AS ENUM ('REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "AgencyPayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'ON_HOLD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "AgencyDocumentKind" AS ENUM ('BUSINESS_REGISTRATION', 'TAX_CERTIFICATE', 'PROOF_OF_ADDRESS', 'OWNER_ID', 'LIABILITY_INSURANCE', 'SECURITY_OPERATING_LICENCE', 'GUARD_TRAINING_CERTIFICATES', 'FOOD_HYGIENE_CERTIFICATE', 'KITCHEN_INSPECTION_REPORT', 'FLEET_INSURANCE', 'VEHICLE_REGISTRATION', 'DRIVER_LICENCES', 'CHEMICAL_HANDLING_ASSESSMENT', 'TOUR_GUIDE_LICENCE', 'FIRST_AID_CERTIFICATE', 'INTERPRETER_ACCREDITATION', 'CHILDCARE_BACKGROUND_CHECKS', 'CUSTOMS_BROKER_LICENCE', 'EVENT_PUBLIC_LIABILITY', 'MEDICAL_PRACTITIONER_LICENCE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "AgencyDocumentStatus" AS ENUM ('MISSING', 'UPLOADED', 'IN_REVIEW', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "HireBookingStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PassportApplicationStatus gained EVALUATED after it first appeared, so a
-- database pushed from an early schema can lack it. Only add it when missing.
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = current_schema()
          AND t.typname = 'PassportApplicationStatus'
          AND e.enumlabel = 'EVALUATED'
    ) THEN
        ALTER TYPE "PassportApplicationStatus" ADD VALUE 'EVALUATED' BEFORE 'UNDER_REVIEW';
    END IF;
END $$;

-- Gender: the baseline created ('MALE', 'FEMALE', 'OTHER'); the schema now has
-- ('MALE', 'FEMALE'). Postgres cannot drop an enum value, so swap the type.
-- Skipped when OTHER is already gone. Every column that uses Gender is
-- converted (VisaDocumentation.gender and, where it exists already,
-- PassportApplication.sex), and column defaults are kept.
DO $$
DECLARE
    col record;
    tbls text[] := '{}';
    cols text[] := '{}';
    dflts text[] := '{}';
    in_use boolean;
    i int;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = current_schema()
          AND t.typname = 'Gender'
          AND e.enumlabel = 'OTHER'
    ) THEN
        RETURN;
    END IF;

    FOR col IN
        SELECT c.relname::text AS tbl,
               a.attname::text AS col,
               pg_get_expr(d.adbin, d.adrelid) AS dflt
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
        WHERE n.nspname = current_schema()
          AND c.relkind IN ('r', 'p')
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND a.atttypid = '"Gender"'::regtype
    LOOP
        EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE %I::text = %L)', col.tbl, col.col, 'OTHER')
            INTO in_use;
        IF in_use THEN
            RAISE EXCEPTION 'Gender value OTHER is still used in %.%. Change those rows to MALE or FEMALE, run "prisma migrate resolve --rolled-back 20261119000000_sync_schema", then deploy again.', col.tbl, col.col;
        END IF;
        tbls := tbls || col.tbl;
        cols := cols || col.col;
        dflts := dflts || col.dflt;
    END LOOP;

    CREATE TYPE "Gender_new" AS ENUM ('MALE', 'FEMALE');

    FOR i IN 1 .. coalesce(array_length(tbls, 1), 0) LOOP
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP DEFAULT', tbls[i], cols[i]);
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE "Gender_new" USING (%I::text::"Gender_new")', tbls[i], cols[i], cols[i]);
    END LOOP;

    ALTER TYPE "Gender" RENAME TO "Gender_old";
    ALTER TYPE "Gender_new" RENAME TO "Gender";
    DROP TYPE "Gender_old";

    -- The saved defaults read like 'MALE'::"Gender", which now names the new type.
    FOR i IN 1 .. coalesce(array_length(tbls, 1), 0) LOOP
        IF dflts[i] IS NOT NULL THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET DEFAULT %s', tbls[i], cols[i], dflts[i]);
        END IF;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Tables that the baseline never created
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "Applicant" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PassportApplication" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "profileId" TEXT,
    "clerkUserId" TEXT,
    "passportCategory" "PassportCategory" NOT NULL,
    "surname" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "sex" "Gender" NOT NULL,
    "ninNumber" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "placeOfBirth" TEXT NOT NULL,
    "existingPassportNumber" TEXT,
    "homeTown" TEXT NOT NULL,
    "stateOfOrigin" TEXT NOT NULL,
    "permanentAddress" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "maritalStatus" TEXT NOT NULL,
    "colourOfEyes" TEXT NOT NULL,
    "colourOfHair" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "maidenName" TEXT,
    "nextOfKinName" TEXT NOT NULL,
    "nextOfKinPhone" TEXT NOT NULL,
    "nextOfKinRelationship" TEXT NOT NULL,
    "nextOfKinAddress" TEXT NOT NULL,
    "validity" "PassportValidity" NOT NULL,
    "bookletType" "BookletType" NOT NULL,
    "birthCertificateUrl" TEXT NOT NULL,
    "ninDocumentUrl" TEXT NOT NULL,
    "passportPhotoUrl" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "balanceDue" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "allowInstallment" BOOLEAN NOT NULL DEFAULT false,
    "selectedPaymentOption" "PaymentOption",
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING_EVALUATION',
    "evaluatedBy" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "status" "PassportApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "verificationNotes" TEXT,
    "rejectionReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PassportApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BankAccount" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "swiftCode" TEXT,
    "iban" TEXT,
    "routingNumber" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Agency" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "countryCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "cities" TEXT[],
    "categories" TEXT[],
    "summary" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "logoUrl" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "yearFounded" INTEGER NOT NULL,
    "staffCount" INTEGER NOT NULL DEFAULT 1,
    "languages" TEXT[],
    "verification" "AgencyVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "listingStatus" "AgencyListingStatus" NOT NULL DEFAULT 'DRAFT',
    "rating" DECIMAL(3,2),
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgencyUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "AgencyUserRole" NOT NULL DEFAULT 'MANAGER',
    "agencyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgencyDocument" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "kind" "AgencyDocumentKind" NOT NULL,
    "status" "AgencyDocumentStatus" NOT NULL DEFAULT 'MISSING',
    "fileName" TEXT,
    "fileUrl" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgencyServiceOffering" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "unit" TEXT NOT NULL,
    "leadTimeHours" INTEGER NOT NULL DEFAULT 24,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyServiceOffering_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgencyStaff" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "photoUrl" TEXT,
    "phone" TEXT NOT NULL,
    "languages" TEXT[],
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "status" "AgencyStaffStatus" NOT NULL DEFAULT 'AVAILABLE',
    "backgroundChecked" BOOLEAN NOT NULL DEFAULT false,
    "rating" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyStaff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgencyAssignment" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "offeringTitle" TEXT NOT NULL,
    "travellerName" TEXT NOT NULL,
    "travellerEmail" TEXT,
    "travellerPhone" TEXT,
    "partySize" INTEGER NOT NULL DEFAULT 1,
    "destinationCity" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "destinationCountryCode" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "assignedStaffIds" TEXT[],
    "staffRequired" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "gross" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "platformFee" DECIMAL(10,2) NOT NULL,
    "netToAgency" DECIMAL(10,2) NOT NULL,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgencyPayout" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "gross" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "net" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "AgencyPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "destinationAccount" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyPayout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProfessionalProfile" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "countryCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "languages" TEXT[],
    "rating" DECIMAL(3,2),
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HireBooking" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "profileId" TEXT,
    "clerkUserId" TEXT,
    "visaDocumentationId" TEXT,
    "travellerName" TEXT NOT NULL,
    "travellerEmail" TEXT NOT NULL,
    "travellerPhone" TEXT,
    "destinationCity" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "HireBookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HireBooking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProfessionalRating" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalRating_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- Columns added after a table first appeared
-- ---------------------------------------------------------------------------

-- Missing from the baseline.
ALTER TABLE "VisaDocumentation" ADD COLUMN IF NOT EXISTS "clerkUserId" TEXT;
ALTER TABLE "VisaDocumentation" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';

ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "passportApplicationId" TEXT;
ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "agencyAssignmentId" TEXT;
ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "hireBookingId" TEXT;
ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "packageItemsJson" JSONB;

-- Only matter for databases pushed from an older schema, where these tables
-- already exist without the newer columns. No-ops everywhere else.
ALTER TABLE "PassportApplication" ADD COLUMN IF NOT EXISTS "clerkUserId" TEXT;
ALTER TABLE "PassportApplication" ADD COLUMN IF NOT EXISTS "totalAmount" DECIMAL(10,2);
ALTER TABLE "PassportApplication" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "PassportApplication" ADD COLUMN IF NOT EXISTS "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE "PassportApplication" ADD COLUMN IF NOT EXISTS "balanceDue" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE "PassportApplication" ADD COLUMN IF NOT EXISTS "allowInstallment" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PassportApplication" ADD COLUMN IF NOT EXISTS "selectedPaymentOption" "PaymentOption";
ALTER TABLE "PassportApplication" ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING_EVALUATION';
ALTER TABLE "PassportApplication" ADD COLUMN IF NOT EXISTS "evaluatedBy" TEXT;
ALTER TABLE "PassportApplication" ADD COLUMN IF NOT EXISTS "evaluatedAt" TIMESTAMP(3);

ALTER TABLE "HireBooking" ADD COLUMN IF NOT EXISTS "profileId" TEXT;
ALTER TABLE "HireBooking" ADD COLUMN IF NOT EXISTS "clerkUserId" TEXT;
ALTER TABLE "HireBooking" ADD COLUMN IF NOT EXISTS "visaDocumentationId" TEXT;
ALTER TABLE "HireBooking" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "Applicant_clerkUserId_key" ON "Applicant"("clerkUserId");

CREATE UNIQUE INDEX IF NOT EXISTS "PassportApplication_applicationNo_key" ON "PassportApplication"("applicationNo");
CREATE INDEX IF NOT EXISTS "PassportApplication_profileId_idx" ON "PassportApplication"("profileId");
CREATE INDEX IF NOT EXISTS "PassportApplication_clerkUserId_idx" ON "PassportApplication"("clerkUserId");
CREATE INDEX IF NOT EXISTS "PassportApplication_status_idx" ON "PassportApplication"("status");
CREATE INDEX IF NOT EXISTS "PassportApplication_paymentStatus_idx" ON "PassportApplication"("paymentStatus");
CREATE INDEX IF NOT EXISTS "PassportApplication_ninNumber_idx" ON "PassportApplication"("ninNumber");
CREATE INDEX IF NOT EXISTS "PassportApplication_applicationNo_idx" ON "PassportApplication"("applicationNo");
CREATE INDEX IF NOT EXISTS "PassportApplication_email_idx" ON "PassportApplication"("email");

CREATE INDEX IF NOT EXISTS "BankAccount_isActive_idx" ON "BankAccount"("isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "Agency_slug_key" ON "Agency"("slug");
CREATE INDEX IF NOT EXISTS "Agency_slug_idx" ON "Agency"("slug");
CREATE INDEX IF NOT EXISTS "Agency_countryCode_idx" ON "Agency"("countryCode");
CREATE INDEX IF NOT EXISTS "Agency_verification_idx" ON "Agency"("verification");
CREATE INDEX IF NOT EXISTS "Agency_listingStatus_idx" ON "Agency"("listingStatus");

CREATE UNIQUE INDEX IF NOT EXISTS "AgencyUser_email_key" ON "AgencyUser"("email");
CREATE INDEX IF NOT EXISTS "AgencyUser_email_idx" ON "AgencyUser"("email");
CREATE INDEX IF NOT EXISTS "AgencyUser_agencyId_idx" ON "AgencyUser"("agencyId");

CREATE INDEX IF NOT EXISTS "AgencyDocument_agencyId_idx" ON "AgencyDocument"("agencyId");
CREATE INDEX IF NOT EXISTS "AgencyDocument_kind_idx" ON "AgencyDocument"("kind");
CREATE INDEX IF NOT EXISTS "AgencyDocument_status_idx" ON "AgencyDocument"("status");

CREATE INDEX IF NOT EXISTS "AgencyServiceOffering_agencyId_idx" ON "AgencyServiceOffering"("agencyId");
CREATE INDEX IF NOT EXISTS "AgencyServiceOffering_category_idx" ON "AgencyServiceOffering"("category");

CREATE INDEX IF NOT EXISTS "AgencyStaff_agencyId_idx" ON "AgencyStaff"("agencyId");
CREATE INDEX IF NOT EXISTS "AgencyStaff_category_idx" ON "AgencyStaff"("category");
CREATE INDEX IF NOT EXISTS "AgencyStaff_status_idx" ON "AgencyStaff"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "AgencyAssignment_reference_key" ON "AgencyAssignment"("reference");
CREATE INDEX IF NOT EXISTS "AgencyAssignment_agencyId_idx" ON "AgencyAssignment"("agencyId");
CREATE INDEX IF NOT EXISTS "AgencyAssignment_reference_idx" ON "AgencyAssignment"("reference");
CREATE INDEX IF NOT EXISTS "AgencyAssignment_status_idx" ON "AgencyAssignment"("status");
CREATE INDEX IF NOT EXISTS "AgencyAssignment_payoutId_idx" ON "AgencyAssignment"("payoutId");

CREATE UNIQUE INDEX IF NOT EXISTS "AgencyPayout_reference_key" ON "AgencyPayout"("reference");
CREATE INDEX IF NOT EXISTS "AgencyPayout_agencyId_idx" ON "AgencyPayout"("agencyId");
CREATE INDEX IF NOT EXISTS "AgencyPayout_reference_idx" ON "AgencyPayout"("reference");
CREATE INDEX IF NOT EXISTS "AgencyPayout_status_idx" ON "AgencyPayout"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "ProfessionalProfile_slug_key" ON "ProfessionalProfile"("slug");
CREATE INDEX IF NOT EXISTS "ProfessionalProfile_slug_idx" ON "ProfessionalProfile"("slug");
CREATE INDEX IF NOT EXISTS "ProfessionalProfile_category_idx" ON "ProfessionalProfile"("category");
CREATE INDEX IF NOT EXISTS "ProfessionalProfile_countryCode_idx" ON "ProfessionalProfile"("countryCode");
CREATE INDEX IF NOT EXISTS "ProfessionalProfile_isVerified_idx" ON "ProfessionalProfile"("isVerified");

CREATE UNIQUE INDEX IF NOT EXISTS "HireBooking_reference_key" ON "HireBooking"("reference");
CREATE INDEX IF NOT EXISTS "HireBooking_reference_idx" ON "HireBooking"("reference");
CREATE INDEX IF NOT EXISTS "HireBooking_professionalId_idx" ON "HireBooking"("professionalId");
CREATE INDEX IF NOT EXISTS "HireBooking_profileId_idx" ON "HireBooking"("profileId");
CREATE INDEX IF NOT EXISTS "HireBooking_clerkUserId_idx" ON "HireBooking"("clerkUserId");
CREATE INDEX IF NOT EXISTS "HireBooking_visaDocumentationId_idx" ON "HireBooking"("visaDocumentationId");
CREATE INDEX IF NOT EXISTS "HireBooking_status_idx" ON "HireBooking"("status");
CREATE INDEX IF NOT EXISTS "HireBooking_travellerEmail_idx" ON "HireBooking"("travellerEmail");

CREATE INDEX IF NOT EXISTS "ProfessionalRating_professionalId_idx" ON "ProfessionalRating"("professionalId");

CREATE INDEX IF NOT EXISTS "Notification_recipientId_isRead_idx" ON "Notification"("recipientId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_recipientType_recipientId_idx" ON "Notification"("recipientType", "recipientId");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

CREATE INDEX IF NOT EXISTS "PaymentTransaction_passportApplicationId_idx" ON "PaymentTransaction"("passportApplicationId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_agencyAssignmentId_idx" ON "PaymentTransaction"("agencyAssignmentId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_hireBookingId_idx" ON "PaymentTransaction"("hireBookingId");

CREATE INDEX IF NOT EXISTS "VisaDocumentation_clerkUserId_idx" ON "VisaDocumentation"("clerkUserId");

-- ---------------------------------------------------------------------------
-- Foreign keys (skipped when a constraint with the same name already exists)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
    ALTER TABLE "PassportApplication" ADD CONSTRAINT "PassportApplication_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_passportApplicationId_fkey" FOREIGN KEY ("passportApplicationId") REFERENCES "PassportApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_hireBookingId_fkey" FOREIGN KEY ("hireBookingId") REFERENCES "HireBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "AgencyUser" ADD CONSTRAINT "AgencyUser_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "AgencyDocument" ADD CONSTRAINT "AgencyDocument_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "AgencyServiceOffering" ADD CONSTRAINT "AgencyServiceOffering_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "AgencyStaff" ADD CONSTRAINT "AgencyStaff_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "AgencyAssignment" ADD CONSTRAINT "AgencyAssignment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "AgencyAssignment" ADD CONSTRAINT "AgencyAssignment_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "AgencyPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "AgencyPayout" ADD CONSTRAINT "AgencyPayout_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "HireBooking" ADD CONSTRAINT "HireBooking_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "HireBooking" ADD CONSTRAINT "HireBooking_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "HireBooking" ADD CONSTRAINT "HireBooking_visaDocumentationId_fkey" FOREIGN KEY ("visaDocumentationId") REFERENCES "VisaDocumentation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ProfessionalRating" ADD CONSTRAINT "ProfessionalRating_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
