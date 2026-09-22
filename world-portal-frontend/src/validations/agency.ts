import { z } from "zod";

import { documentCatalog } from "@/features/agency/catalog";
import { agencyCategories, type AgencyDocumentKind } from "@/features/agency/types";
import { emailSchema, fullNameSchema, phoneSchema } from "@/validations/common";

/**
 * Every agency request body, in one file.
 *
 * House rule: **one schema per form**. These are imported by the client forms
 * under `src/features/agency` *and* by the route handlers under
 * `src/app/api/agency`, so a field the form will not produce must not be
 * required here, and a field the store needs must not be optional.
 *
 * Deliberately free of `.default()` in the form-facing shapes: a default makes
 * zod's input and output types diverge, which `zodResolver` then surfaces as a
 * confusing generic mismatch in the form. The forms supply their own
 * `defaultValues`, exactly as `loginSchema` expects of the console login.
 */

/** Runtime list of the category union, in catalog order. */
export const agencyCategorySchema = z.enum(agencyCategories);

/**
 * Derived from the catalog rather than restated, so a document added to
 * `documentCatalog` is accepted by the upload endpoint with no edit here.
 */
const documentKinds = Object.keys(documentCatalog) as [
  AgencyDocumentKind,
  ...AgencyDocumentKind[],
];
export const agencyDocumentKindSchema = z.enum(documentKinds);

/** ISO-3166 alpha-2, as `Agency.countryCode` stores it. */
const countryCodeSchema = z
  .string()
  .trim()
  .length(2, "Use the two-letter country code")
  .toUpperCase();

/**
 * A link a form may legitimately leave blank. An empty input arrives as `""`,
 * which fails `z.url()`, so blanks normalise to `null` — the shape `Agency`
 * declares for `logoUrl` and `website`.
 */
const optionalUrlSchema = z
  .union([z.url("Enter a valid URL"), z.literal(""), z.null()])
  .transform((value) => value || null);

/** ISO 8601 date, as the documents carry it. */
const isoDateSchema = z.iso.date("Enter a valid date");

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

export const agencySendOtpSchema = z.object({
  email: emailSchema,
  intent: z.enum(["login", "signup"]).optional(),
});

export const agencyOtpSchema = z
  .string()
  .trim()
  .length(6, "Enter the 6-digit verification code");

export const agencyLoginSchema = z.object({
  email: emailSchema,
  otp: agencyOtpSchema,
  remember: z.boolean().optional(),
});

export const agencySignupSchema = z.object({
  agencyName: z
    .string()
    .trim()
    .min(2, "Enter the agency's name")
    .max(120, "That name is too long"),
  contactName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  countryCode: countryCodeSchema,
  country: z.string().trim().min(2, "Select the country of operation").max(80),
  otp: agencyOtpSchema,
});

/* -------------------------------------------------------------------------- */
/* Assignments                                                                */
/* -------------------------------------------------------------------------- */

export const assignStaffSchema = z.object({
  staffIds: z
    .array(z.string().min(1))
    .min(1, "Pick at least one person")
    .max(50, "That is more people than one job needs"),
});

/**
 * One PATCH serves both moves on an assignment, discriminated on `action` —
 * the alternative is a second endpoint that differs only in its verb.
 */
export const assignmentActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("assign"), ...assignStaffSchema.shape }),
  z.object({ action: z.literal("complete") }),
]);

/* -------------------------------------------------------------------------- */
/* Staff                                                                      */
/* -------------------------------------------------------------------------- */

export const newStaffSchema = z.object({
  name: fullNameSchema,
  role: z.string().trim().min(2, "Enter their role").max(60, "That role is too long"),
  category: agencyCategorySchema,
  phone: phoneSchema,
  languages: z
    .array(z.string().trim().min(1))
    .min(1, "List at least one language")
    .max(12, "That is more languages than we can show"),
  experienceYears: z.coerce
    .number()
    .int("Enter whole years")
    .min(0, "Enter whole years")
    .max(60, "That looks wrong"),
  backgroundChecked: z.boolean(),
  photoUrl: optionalUrlSchema.optional(),
});

/* -------------------------------------------------------------------------- */
/* The listing                                                                */
/* -------------------------------------------------------------------------- */

export const agencyOfferingSchema = z.object({
  /** Absent on a new offering; the store mints the id. */
  id: z.string().min(1).optional(),
  category: agencyCategorySchema,
  title: z.string().trim().min(2, "Name the service").max(80, "That title is too long"),
  description: z
    .string()
    .trim()
    .min(10, "Say what the traveller actually gets")
    .max(400, "Keep the description under 400 characters"),
  /** `null` is "quoted after review" — the same convention the basket uses. */
  price: z
    .number()
    .min(0, "A price cannot be negative")
    .max(1_000_000, "That figure looks wrong")
    .nullable(),
  currency: z
    .string()
    .trim()
    .length(3, "Use a three-letter currency code")
    .toUpperCase(),
  unit: z.string().trim().min(1, "Per what? Day, hour, job…").max(40),
  leadTimeHours: z.coerce
    .number()
    .int("Enter whole hours")
    .min(0, "Enter whole hours")
    .max(24 * 90, "That is more notice than anyone books"),
  capacity: z.coerce
    .number()
    .int("Enter a whole head count")
    .min(1, "Enter a whole head count")
    .max(500, "That looks wrong"),
});

/** The whole listing, as the review step sees it. */
export const agencyListingSchema = z.object({
  name: z.string().trim().min(2, "Enter the trading name").max(120),
  legalName: z.string().trim().min(2, "Enter the registered name").max(160),
  registrationNumber: z.string().trim().max(60).optional().or(z.literal("")),
  countryCode: countryCodeSchema,
  country: z.string().trim().min(2, "Select the country of operation").max(80),
  cities: z
    .array(z.string().trim().min(1))
    .min(1, "Name at least one city you can work in")
    .max(40, "That is more cities than we can list"),
  categories: z
    .array(agencyCategorySchema)
    .min(1, "Pick at least one service")
    .max(agencyCategories.length),
  summary: z
    .string()
    .trim()
    .min(10, "One line on what the agency does")
    .max(200, "Keep the summary under 200 characters"),
  about: z
    .string()
    .trim()
    .min(40, "Tell a traveller who you are")
    .max(2000, "Keep this under 2000 characters"),
  logoUrl: optionalUrlSchema,
  email: emailSchema,
  phone: phoneSchema,
  website: optionalUrlSchema,
  yearFounded: z.coerce
    .number()
    .int()
    .min(1800, "That year looks wrong")
    .max(new Date().getFullYear(), "That year is in the future"),
  staffCount: z.coerce
    .number()
    .int("Enter a whole head count")
    .min(1, "Enter a whole head count")
    .max(100_000, "That looks wrong"),
  languages: z
    .array(z.string().trim().min(1))
    .min(1, "List at least one language")
    .max(20),
  offerings: z.array(agencyOfferingSchema).max(40, "That is more than we can list"),
});

export const patchOfferingSchema = z.object({
  id: z.string().min(1).optional(),
  category: agencyCategorySchema,
  title: z.string().trim().max(80, "That title is too long").optional().or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(400, "Keep the description under 400 characters")
    .optional()
    .or(z.literal("")),
  price: z
    .number()
    .min(0, "A price cannot be negative")
    .max(1_000_000, "That figure looks wrong")
    .nullable()
    .optional(),
  currency: z
    .string()
    .trim()
    .length(3, "Use a three-letter currency code")
    .toUpperCase()
    .optional(),
  unit: z.string().trim().max(40).optional(),
  leadTimeHours: z.coerce
    .number()
    .int("Enter whole hours")
    .min(0, "Enter whole hours")
    .max(24 * 90, "That is more notice than anyone books")
    .optional(),
  capacity: z.coerce
    .number()
    .int("Enter a whole head count")
    .min(1, "Enter a whole head count")
    .max(500, "That looks wrong")
    .optional(),
});

/**
 * The listing is edited a step at a time, so the PATCH takes any subset. An
 * absent key means "leave it alone" — it is never read as a clear.
 */
export const listingPatchSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  legalName: z.string().trim().max(160).optional().or(z.literal("")),
  registrationNumber: z.string().trim().max(60).optional().or(z.literal("")),
  countryCode: z.string().trim().max(10).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  cities: z.array(z.string().trim()).optional(),
  categories: z.array(agencyCategorySchema).optional(),
  summary: z.string().trim().max(200).optional().or(z.literal("")),
  about: z.string().trim().max(2000).optional().or(z.literal("")),
  logoUrl: optionalUrlSchema.optional(),
  email: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  website: optionalUrlSchema.optional(),
  yearFounded: z.coerce.number().optional(),
  staffCount: z.coerce.number().optional(),
  languages: z.array(z.string().trim()).optional(),
  offerings: z.array(patchOfferingSchema).max(40, "That is more than we can list").optional(),
});

/** One uploaded file recorded against the agency's compliance file. */
export const setDocumentSchema = z.object({
  kind: agencyDocumentKindSchema,
  fileName: z.string().trim().min(1, "The file needs a name").max(200),
  fileUrl: z.url("The upload did not return a URL"),
  /** Only asked for where `documentCatalog[kind].expires` is true. */
  expiresAt: isoDateSchema.optional(),
});

export type AgencySendOtpInput = z.infer<typeof agencySendOtpSchema>;
export type AgencyLoginInput = z.infer<typeof agencyLoginSchema>;
export type AgencySignupInput = z.infer<typeof agencySignupSchema>;
export type AssignStaffInput = z.infer<typeof assignStaffSchema>;
export type AssignmentActionInput = z.infer<typeof assignmentActionSchema>;
export type NewStaffInput = z.infer<typeof newStaffSchema>;
export type AgencyOfferingInput = z.infer<typeof agencyOfferingSchema>;
export type AgencyListingInput = z.infer<typeof agencyListingSchema>;
export type ListingPatchInput = z.infer<typeof listingPatchSchema>;
export type SetDocumentInput = z.infer<typeof setDocumentSchema>;
