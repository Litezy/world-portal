/** Mirrors the API's Prisma enums exactly — see the integration guide, §3. */
export const VISA_DOCUMENT_STATUSES = [
  "SUBMITTED",
  "EVALUATED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;
export type VisaDocumentStatus = (typeof VISA_DOCUMENT_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "PENDING_EVALUATION",
  "AWAITING_PAYMENT",
  "PARTIALLY_PAID",
  "FULLY_PAID",
  "REFUNDED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const VISA_CATEGORIES = [
  "TOURIST",
  "BUSINESS",
  "STUDENT",
  "WORK",
  "TRANSIT",
] as const;
export type VisaCategory = (typeof VISA_CATEGORIES)[number];

export const GENDERS = ["MALE", "FEMALE"] as const;
export type Gender = (typeof GENDERS)[number];

export type UploadedDocument = {
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
};

/**
 * The application record.
 *
 * Every Decimal column serialises as a *string* (`"500.00"`), not a number —
 * run them through `toAmount()` before doing any maths or formatting.
 */
export type VisaDocumentation = {
  id: string;
  applicationNo: string;
  profileId: string | null;

  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  nationality: string | null;
  residenceAddress: string | null;

  passportNumber: string | null;
  passportIssueDate: string | null;
  passportExpiryDate: string | null;
  passportIssuingAuthority: string | null;

  targetCountry: string;
  visaCategory: VisaCategory | null;
  intendedArrivalDate: string | null;
  intendedDepartureDate: string | null;
  purposeOfVisit: string | null;

  passportDataPageUrl: string | null;
  passportPhotoWhiteBgUrl: string | null;
  proofOfFunds6MonthsUrl: string | null;
  businessRegistrationCertUrl: string | null;
  taxCertificateUrl: string | null;
  marriageCertificateUrl: string | null;
  childrenBirthCertUrls: string[];
  landedPropertyDocUrls: string[];
  previousVisasScanUrls: string[];
  supportingDocUrls: string[];

  totalAmount: string | null;
  currency?: string;
  amountPaid: string;
  balanceDue: string;
  allowInstallment: boolean;
  selectedPaymentOption: "FULL" | "HALF_INSTALLMENT" | null;
  paymentStatus: PaymentStatus;

  evaluatedBy: string | null;
  evaluatedAt: string | null;
  status: VisaDocumentStatus;
  verificationNotes: string | null;
  rejectionReason: string | null;

  createdAt: string;
  updatedAt: string;
};

/** Decimal fields arrive as strings; `null` and `""` both mean "not set yet". */
export function toAmount(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
