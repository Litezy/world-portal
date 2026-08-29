import { z } from "zod";

import {
  emailSchema,
  fullNameSchema,
  honeypotSchema,
  phoneSchema,
} from "@/validations/common";

export const contactSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  subject: z.enum([
    "visa_enquiry",
    "study_abroad",
    "work_permit",
    "flight_booking",
    "other",
  ]),
  destination: z.string().trim().max(80).optional(),
  message: z
    .string()
    .trim()
    .min(20, "Tell us a little more — at least 20 characters")
    .max(2000, "Please keep it under 2000 characters"),
  consent: z.literal(true, {
    error: "Please accept the privacy policy to continue",
  }),
  website: honeypotSchema,
});

export type ContactInput = z.infer<typeof contactSchema>;

export const contactSubjectLabels: Record<ContactInput["subject"], string> = {
  visa_enquiry: "Visa enquiry",
  study_abroad: "Study abroad",
  work_permit: "Work permit",
  flight_booking: "Flight booking",
  other: "Something else",
};
