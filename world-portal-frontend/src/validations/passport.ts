import { z } from "zod";

import {
  emailSchema,
  fullNameSchema,
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

/** Shared by the passport form and its route handler. */
export const passportEnquirySchema = z.object({
  applicationType: z.enum(passportApplicationTypes, {
    error: "Choose which of these applies to you",
  }),
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  nationality: z.string().trim().min(2, "Enter your nationality").max(60),
  dateOfBirth: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  travelDate: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  notes: z.string().trim().max(1000, "Please keep it under 1000 characters").optional(),
  website: honeypotSchema,
});

export type PassportEnquiryInput = z.infer<typeof passportEnquirySchema>;
