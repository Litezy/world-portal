import { z } from "zod";

import {
  emailSchema,
  fullNameSchema,
  honeypotSchema,
  phoneSchema,
} from "@/validations/common";

export const consultationSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  nationality: z.string().trim().min(2, "Select your nationality"),
  destination: z.string().trim().min(2, "Where are you headed?"),
  visaCategory: z.enum([
    "tourist",
    "business",
    "study",
    "work",
    "family",
    "transit",
    "residency",
  ]),
  travellers: z.coerce
    .number()
    .int()
    .min(1, "At least one traveller")
    .max(20, "Contact us directly for groups over 20"),
  preferredDate: z.coerce
    .date()
    .refine((date) => date >= new Date(new Date().toDateString()), {
      message: "Pick a date from today onwards",
    }),
  hasPreviousRejection: z.boolean().default(false),
  notes: z.string().trim().max(1000).optional(),
  consent: z.literal(true, {
    error: "Please accept the privacy policy to continue",
  }),
  website: honeypotSchema,
});

export type ConsultationInput = z.infer<typeof consultationSchema>;
