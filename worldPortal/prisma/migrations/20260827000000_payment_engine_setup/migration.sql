-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MANAGER', 'PARTNER', 'STAFF');

-- CreateEnum
CREATE TYPE "VisaDocumentStatus" AS ENUM ('SUBMITTED', 'EVALUATED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING_EVALUATION', 'AWAITING_PAYMENT', 'PARTIALLY_PAID', 'FULLY_PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentOption" AS ENUM ('FULL', 'HALF_INSTALLMENT');

-- CreateEnum
CREATE TYPE "VisaCategory" AS ENUM ('TOURIST', 'BUSINESS', 'STUDENT', 'WORK', 'TRANSIT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('INITIATED', 'CONFIRMED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSED', 'REJECTED');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "externalAuthId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaDocumentation" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "profileId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'MALE',
    "nationality" TEXT NOT NULL,
    "residenceAddress" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "passportIssueDate" TIMESTAMP(3) NOT NULL,
    "passportExpiryDate" TIMESTAMP(3) NOT NULL,
    "passportIssuingAuthority" TEXT,
    "targetCountry" TEXT NOT NULL,
    "visaCategory" "VisaCategory" NOT NULL DEFAULT 'TOURIST',
    "intendedArrivalDate" TIMESTAMP(3) NOT NULL,
    "intendedDepartureDate" TIMESTAMP(3) NOT NULL,
    "purposeOfVisit" TEXT NOT NULL,
    "passportDataPageUrl" TEXT NOT NULL,
    "passportPhotoWhiteBgUrl" TEXT NOT NULL,
    "proofOfFunds6MonthsUrl" TEXT NOT NULL,
    "businessRegistrationCertUrl" TEXT,
    "taxCertificateUrl" TEXT,
    "marriageCertificateUrl" TEXT,
    "childrenBirthCertUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "landedPropertyDocUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "previousVisasScanUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supportingDocUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalAmount" DECIMAL(10,2),
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "balanceDue" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "allowInstallment" BOOLEAN NOT NULL DEFAULT false,
    "selectedPaymentOption" "PaymentOption",
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING_EVALUATION',
    "evaluatedBy" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "status" "VisaDocumentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "verificationNotes" TEXT,
    "rejectionReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisaDocumentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentConfig" (
    "id" TEXT NOT NULL,
    "partnerMarkupPercentage" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "serviceFeePercentage" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "refundSurchargePercentage" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "transactionRef" TEXT NOT NULL,
    "visaDocumentationId" TEXT,
    "profileId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentOption" "PaymentOption" NOT NULL,
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'INITIATED',
    "paymentMethod" TEXT DEFAULT 'CARD',
    "initiatedBy" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRefund" (
    "id" TEXT NOT NULL,
    "refundRef" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "originalAmount" DECIMAL(10,2) NOT NULL,
    "surchargeAmount" DECIMAL(10,2) NOT NULL,
    "netRefundAmount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_externalAuthId_key" ON "Profile"("externalAuthId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "Profile_email_idx" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "Profile_role_idx" ON "Profile"("role");

-- CreateIndex
CREATE UNIQUE INDEX "VisaDocumentation_applicationNo_key" ON "VisaDocumentation"("applicationNo");

-- CreateIndex
CREATE INDEX "VisaDocumentation_profileId_idx" ON "VisaDocumentation"("profileId");

-- CreateIndex
CREATE INDEX "VisaDocumentation_status_idx" ON "VisaDocumentation"("status");

-- CreateIndex
CREATE INDEX "VisaDocumentation_paymentStatus_idx" ON "VisaDocumentation"("paymentStatus");

-- CreateIndex
CREATE INDEX "VisaDocumentation_passportNumber_idx" ON "VisaDocumentation"("passportNumber");

-- CreateIndex
CREATE INDEX "VisaDocumentation_applicationNo_idx" ON "VisaDocumentation"("applicationNo");

-- CreateIndex
CREATE INDEX "VisaDocumentation_email_idx" ON "VisaDocumentation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_transactionRef_key" ON "PaymentTransaction"("transactionRef");

-- CreateIndex
CREATE INDEX "PaymentTransaction_visaDocumentationId_idx" ON "PaymentTransaction"("visaDocumentationId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_profileId_idx" ON "PaymentTransaction"("profileId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_transactionRef_idx" ON "PaymentTransaction"("transactionRef");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_refundRef_key" ON "PaymentRefund"("refundRef");

-- CreateIndex
CREATE INDEX "PaymentRefund_transactionId_idx" ON "PaymentRefund"("transactionId");

-- CreateIndex
CREATE INDEX "PaymentRefund_status_idx" ON "PaymentRefund"("status");

-- AddForeignKey
ALTER TABLE "VisaDocumentation" ADD CONSTRAINT "VisaDocumentation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_visaDocumentationId_fkey" FOREIGN KEY ("visaDocumentationId") REFERENCES "VisaDocumentation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PaymentTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

