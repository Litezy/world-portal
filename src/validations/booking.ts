import { z } from "zod";

import { emailSchema, fullNameSchema, honeypotSchema } from "@/validations/common";

/** Which of the three services the enquiry is about. */
export const serviceValues = ["visa", "booking", "experience"] as const;

/** Shared by the contact form and the /api/booking route. */
export const bookingSchema = z.object({
  service: z.enum(serviceValues, { error: "Choose the service you need" }),
  fullName: fullNameSchema,
  email: emailSchema,
  destination: z
    .string()
    .trim()
    .min(2, "Where are you headed?")
    .max(80, "That destination is too long"),
  travelDate: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  details: z
    .string()
    .trim()
    .max(1000, "Please keep it under 1000 characters")
    .optional(),
  website: honeypotSchema,
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type ServiceValue = (typeof serviceValues)[number];
