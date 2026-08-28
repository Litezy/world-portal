import { z } from "zod";

import { GENDERS, VISA_CATEGORIES } from "@/features/visa/types";

/**
 * Mirrors the API's CreateVisaDocumentationDto.
 *
 * Two constraints from the backend shape this file:
 *  - `forbidNonWhitelisted: true` — sending a field the DTO does not declare is
 *    a 400. Never add keys here that the API does not know about.
 *  - `@IsDateString()` / `@IsUrl()` — empty strings fail both, so optional
 *    fields must be stripped rather than sent blank. `toApiPayload()` does that.
 *
 * Only firstName, lastName, email and targetCountry are required by the API;
 * the rest are optional there. The extra requirements below are ours, because
 * an application missing a passport scan cannot actually be processed.
 */
const optionalText = z.string().trim().max(500).optional().or(z.literal(""));
const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker")
  .optional()
  .or(z.literal(""));
const documentUrl = z
  .url("Upload this document to continue")
  .optional()
  .or(z.literal(""));

export const applicantStepSchema = z.object({
  firstName: z.string().trim().min(2, "Enter your first name").max(60),
  lastName: z.string().trim().min(2, "Enter your last name").max(60),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s()-]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  dateOfBirth: isoDate,
  gender: z.enum(GENDERS).optional().or(z.literal("")),
  nationality: z.string().trim().min(2, "Enter your nationality").max(60),
  residenceAddress: optionalText,
});

export const passportStepSchema = z.object({
  passportNumber: z
    .string()
    .trim()
    .min(5, "Enter your passport number")
    .max(20)
    .optional()
    .or(z.literal("")),
  passportIssueDate: isoDate,
  passportExpiryDate: isoDate,
  passportIssuingAuthority: optionalText,
});

export const routeStepSchema = z.object({
  originCountry: z.string().trim().min(2, "Where are you travelling from?"),
  destinationCountry: z.string().trim().min(2, "Where are you travelling to?"),
});

export const tripStepSchema = z.object({
  targetCountry: z.string().trim().min(2, "Where are you travelling to?").max(60),
  visaCategory: z.enum(VISA_CATEGORIES),
  intendedArrivalDate: isoDate,
  intendedDepartureDate: isoDate,
  purposeOfVisit: z
    .string()
    .trim()
    .max(500, "Please keep this under 500 characters")
    .optional()
    .or(z.literal("")),
});

export const documentsStepSchema = z.object({
  passportDataPageUrl: z.url("Upload your passport data page"),
  passportPhotoWhiteBgUrl: z.url("Upload a passport photo"),
  proofOfFunds6MonthsUrl: documentUrl,
  businessRegistrationCertUrl: documentUrl,
  taxCertificateUrl: documentUrl,
  marriageCertificateUrl: documentUrl,
  supportingDocUrls: z.array(z.url()).optional(),
});

/**
 * Documents are only collected on the online routes. A T.Visa is filed in
 * person at the embassy, so asking for uploads there would be asking for work
 * the applicant does not need to do yet.
 */
export const offlineDocumentsSchema = z.object({
  passportDataPageUrl: z.string().optional(),
  passportPhotoWhiteBgUrl: z.string().optional(),
  proofOfFunds6MonthsUrl: documentUrl,
  businessRegistrationCertUrl: documentUrl,
  taxCertificateUrl: documentUrl,
  marriageCertificateUrl: documentUrl,
  supportingDocUrls: z.array(z.url()).optional(),
});

export const visaApplicationSchema = applicantStepSchema
  .extend(passportStepSchema.shape)
  .extend(tripStepSchema.shape)
  .extend(documentsStepSchema.shape)
  .refine(
    (v) =>
      !v.intendedArrivalDate ||
      !v.intendedDepartureDate ||
      v.intendedDepartureDate >= v.intendedArrivalDate,
    { path: ["intendedDepartureDate"], error: "Departure cannot precede arrival" },
  )
  .refine(
    (v) =>
      !v.passportIssueDate ||
      !v.passportExpiryDate ||
      v.passportExpiryDate > v.passportIssueDate,
    { path: ["passportExpiryDate"], error: "Expiry must be after the issue date" },
  );

export type VisaApplicationInput = z.infer<typeof visaApplicationSchema>;

/** Same shape, minus the mandatory uploads — used for the T.Visa route. */
export const offlineVisaApplicationSchema = applicantStepSchema
  .extend(passportStepSchema.shape)
  .extend(tripStepSchema.shape)
  .extend(offlineDocumentsSchema.shape);

/** The four steps, in order, with the fields each one validates. */
export const applicationSteps = [
  {
    id: "applicant",
    title: "About you",
    description: "As it appears on your passport.",
    fields: Object.keys(applicantStepSchema.shape),
  },
  {
    id: "passport",
    title: "Passport",
    description: "Helps us check validity before you pay anything.",
    fields: Object.keys(passportStepSchema.shape),
  },
  {
    id: "trip",
    title: "Your trip",
    description: "Where you are going, and what for.",
    fields: Object.keys(tripStepSchema.shape),
  },
  {
    id: "documents",
    title: "Documents",
    description: "PDF, JPG, PNG or WEBP. Up to 10MB each.",
    fields: Object.keys(documentsStepSchema.shape),
  },
] as const;

export type StepId = (typeof applicationSteps)[number]["id"];

/**
 * Strip blanks before sending.
 *
 * The API rejects `""` on any `@IsUrl()` / `@IsDateString()` / enum field, and
 * rejects unknown keys outright, so anything empty has to be omitted rather
 * than sent as an empty string.
 */
export function toApiPayload(values: VisaApplicationInput) {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === "" || value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    payload[key] = value;
  }

  return payload;
}
