/** Mirrors the World Portal API's Prisma enums and payloads. */

export const visaStatusValues = [
  "SUBMITTED",
  "EVALUATED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;
export type VisaStatus = (typeof visaStatusValues)[number];

export const passportStatusValues = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;
export type PassportStatus = (typeof passportStatusValues)[number];

export const paymentStatusValues = [
  "PENDING_EVALUATION",
  "AWAITING_PAYMENT",
  "PARTIALLY_PAID",
  "FULLY_PAID",
  "REFUNDED",
] as const;
export type BackendPaymentStatus = (typeof paymentStatusValues)[number];

export const visaCategoryValues = [
  "TOURIST",
  "BUSINESS",
  "STUDENT",
  "WORK",
  "TRANSIT",
] as const;
export type BackendVisaCategory = (typeof visaCategoryValues)[number];

export const userRoleValues = ["MANAGER", "PARTNER", "STAFF"] as const;
export type BackendUserRole = (typeof userRoleValues)[number];

export type BackendProfile = {
  id: string;
  externalAuthId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: BackendUserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Decimal columns arrive as strings — never do maths on them directly. */
export type BackendVisaApplication = {
  id: string;
  applicationNo: string;
  profileId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  residenceAddress: string;
  passportNumber: string;
  passportExpiryDate: string;
  targetCountry: string;
  visaCategory: BackendVisaCategory;
  intendedArrivalDate: string;
  intendedDepartureDate: string;
  purposeOfVisit: string;
  totalAmount: string | null;
  currency?: string;
  amountPaid: string;
  balanceDue: string;
  allowInstallment: boolean;
  paymentStatus: BackendPaymentStatus;
  status: VisaStatus;
  verificationNotes: string | null;
  rejectionReason: string | null;
  evaluatedBy: string | null;
  evaluatedAt: string | null;
  reviewedBy: string | null;
  passportDataPageUrl?: string | null;
  passportPhotoWhiteBgUrl?: string | null;
  proofOfFunds6MonthsUrl?: string | null;
  businessRegistrationCertUrl?: string | null;
  taxCertificateUrl?: string | null;
  marriageCertificateUrl?: string | null;
  childrenBirthCertUrls?: string[];
  landedPropertyDocUrls?: string[];
  previousVisasScanUrls?: string[];
  supportingDocUrls?: string[];
  createdAt: string;
  updatedAt: string;

  profile?: Pick<
    BackendProfile,
    "id" | "email" | "firstName" | "lastName" | "role"
  > | null;
};

export type BackendPassportApplication = {
  id: string;
  applicationNo: string;
  passportCategory: string;
  surname: string;
  firstName: string;
  middleName: string | null;
  sex: string;
  email: string;
  contactPhone: string;
  dateOfBirth: string;
  stateOfOrigin: string;
  permanentAddress: string;
  validity: string;
  bookletType: string;
  status: PassportStatus;
  verificationNotes: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BackendTransaction = {
  id: string;
  transactionRef: string;
  visaDocumentationId: string | null;
  profileId: string | null;
  amount: string;
  paymentOption: string;
  status: string;
  paymentMethod: string | null;
  confirmedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
};

export type BackendPaymentConfig = {
  id: string;
  partnerMarkupPercentage: string;
  serviceFeePercentage: string;
  refundSurchargePercentage: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type BackendRefund = {
  id: string;
  refundRef: string;
  transactionId: string;
  originalAmount: string;
  surchargeAmount: string;
  netRefundAmount: string;
  reason: string;
  status: "REQUESTED" | "APPROVED" | "PROCESSED" | "REJECTED";
  processedBy: string | null;
  createdAt: string;
  updatedAt: string;
};


/** Decimals are strings (`"500.00"`). Parse before any maths or formatting. */
export function toAmount(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
