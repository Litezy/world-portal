import { GENDERS, VISA_CATEGORIES } from "@/features/visa/types";
import type { VividFieldSpec } from "@/features/vivid/form-bridge";

const visaCategoryLabels: Record<(typeof VISA_CATEGORIES)[number], string> = {
  TOURIST: "Tourism / visiting",
  BUSINESS: "Business",
  STUDENT: "Study",
  WORK: "Work",
  TRANSIT: "Transit",
};

/**
 * How Vivid sees the visa application's fields. Names match
 * `validations/visa-application.ts`; labels match what is on screen.
 */
export const visaVividFields: readonly VividFieldSpec[] = [
  {
    name: "firstName",
    label: "First name",
    kind: "text",
    required: true,
    hint: "As on the passport.",
  },
  {
    name: "lastName",
    label: "Last name",
    kind: "text",
    required: true,
    hint: "As on the passport.",
  },
  {
    name: "email",
    label: "Email address",
    kind: "text",
    required: true,
    readOnly:
      "Comes from the applicant's WorldStreet account and cannot be changed here.",
  },
  {
    name: "phone",
    label: "Phone",
    kind: "phone",
    hint: "With country code, e.g. +234 801 234 5678.",
  },
  { name: "dateOfBirth", label: "Date of birth", kind: "date" },
  {
    name: "gender",
    label: "Gender",
    kind: "choice",
    options: GENDERS.map((g) => ({
      value: g,
      label: g === "MALE" ? "Male" : "Female",
    })),
  },
  { name: "nationality", label: "Nationality", kind: "nationality", required: true },
  { name: "residenceAddress", label: "Residential address", kind: "longtext" },
  { name: "passportNumber", label: "Passport number", kind: "text", sensitive: true },
  { name: "passportIssueDate", label: "Passport issue date", kind: "date" },
  { name: "passportExpiryDate", label: "Passport expiry date", kind: "date" },
  { name: "passportIssuingAuthority", label: "Issuing authority", kind: "text" },
  {
    name: "targetCountry",
    label: "Destination",
    kind: "text",
    required: true,
    readOnly: "Set by the route check. To change it, call startVisaApplication again.",
  },
  {
    name: "visaCategory",
    label: "Purpose category",
    kind: "choice",
    required: true,
    options: VISA_CATEGORIES.map((c) => ({ value: c, label: visaCategoryLabels[c] })),
  },
  { name: "intendedArrivalDate", label: "Arrival date", kind: "date" },
  { name: "intendedDepartureDate", label: "Departure date", kind: "date" },
  { name: "purposeOfVisit", label: "Purpose of visit", kind: "longtext" },
  {
    name: "passportDataPageUrl",
    label: "Passport data page",
    kind: "document",
    required: true,
  },
  {
    name: "passportPhotoWhiteBgUrl",
    label: "Passport photo (white background)",
    kind: "document",
    required: true,
  },
  {
    name: "proofOfFunds6MonthsUrl",
    label: "Proof of funds (6 months)",
    kind: "document",
  },
  {
    name: "businessRegistrationCertUrl",
    label: "Business registration",
    kind: "document",
  },
  { name: "taxCertificateUrl", label: "Tax certificate", kind: "document" },
  { name: "marriageCertificateUrl", label: "Marriage certificate", kind: "document" },
  { name: "supportingDocUrls", label: "Other supporting documents", kind: "document" },
];
