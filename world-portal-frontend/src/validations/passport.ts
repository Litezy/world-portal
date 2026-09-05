import { z } from "zod";

import {
  emailSchema,
  honeypotSchema,
  phoneSchema,
} from "@/validations/common";

export const passportApplicationTypes = ["new", "renewal", "replacement"] as const;
export type PassportApplicationType = (typeof passportApplicationTypes)[number];

export const passportTypeLabels: Record<PassportApplicationType, string> = {
  new: "First passport",
  renewal: "Renewal",
  replacement: "Lost or damaged",
};

export const validityLabels = {
  FIVE_YEARS: "5 Years Validity",
  TEN_YEARS: "10 Years Validity",
} as const;

export const bookletTypeLabels = {
  THIRTY_TWO_PAGES: "32 Pages Standard Booklet",
  SIXTY_FOUR_PAGES: "64 Pages Jumbo Booklet",
} as const;

/** Full standard e-Passport application schema. */
export const passportEnquirySchema = z
  .object({
    applicationType: z.enum(passportApplicationTypes, {
      error: "Choose which of these applies to you",
    }),
    validity: z.enum(["FIVE_YEARS", "TEN_YEARS"]).default("FIVE_YEARS"),
    bookletType: z.enum(["THIRTY_TWO_PAGES", "SIXTY_FOUR_PAGES"]).default("THIRTY_TWO_PAGES"),
    
    // Personal Info
    surname: z.string().trim().min(2, "Enter your surname"),
    firstName: z.string().trim().min(2, "Enter your first name"),
    middleName: z.string().trim().optional(),
    sex: z.enum(["MALE", "FEMALE"], { error: "Select gender" }),
    ninNumber: z
      .string()
      .trim()
      .min(11, "NIN must be 11 digits")
      .max(11, "NIN must be 11 digits"),
    dateOfBirth: z.string().trim().min(1, "Select date of birth"),
    placeOfBirth: z.string().trim().min(2, "Enter place of birth"),
    stateOfOrigin: z.string().trim().min(2, "Enter state of origin"),
    homeTown: z.string().trim().min(2, "Enter home town"),
    nationality: z.string().trim().min(2, "Select nationality"),
    permanentAddress: z.string().trim().min(5, "Enter permanent address"),
    occupation: z.string().trim().min(2, "Enter occupation"),
    contactPhone: phoneSchema,
    email: emailSchema,
    existingPassportNumber: z.string().trim().optional(),
    
    // Physical & Personal Features
    maritalStatus: z.string().trim().min(1, "Select marital status"),
    colourOfEyes: z.string().trim().optional(),
    colourOfHair: z.string().trim().optional(),
    height: z.string().trim().optional(),
    maidenName: z.string().trim().optional(),
    
    // Next of Kin
    nextOfKinName: z.string().trim().min(2, "Enter next of kin name"),
    nextOfKinRelationship: z.string().trim().min(2, "Enter relationship"),
    nextOfKinPhone: phoneSchema,
    nextOfKinAddress: z.string().trim().min(5, "Enter next of kin address"),
    
    // Required & Optional Documents
    passportPhotoUrl: z
      .string()
      .trim()
      .min(1, "Upload a white-background passport photograph"),
    ninDocumentUrl: z
      .string()
      .trim()
      .min(1, "Upload your NIN document / slip"),
    birthCertificateUrl: z.string().trim().optional(), // Optional!
    
    notes: z.string().trim().max(1000, "Please keep it under 1000 characters").optional(),
    website: honeypotSchema,
  })
  .refine(
    (val) =>
      val.applicationType === "new" || Boolean(val.existingPassportNumber),
    {
      message: "Existing passport number is required for renewal or replacement",
      path: ["existingPassportNumber"],
    },
  );

export type PassportEnquiryInput = z.infer<typeof passportEnquirySchema>;
