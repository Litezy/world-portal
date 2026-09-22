import { z } from "zod";

import { passportStatusValues, visaStatusValues } from "@/server/data/backend-types";

export const updateVisaStatusSchema = z
  .object({
    status: z.enum(visaStatusValues),
    verificationNotes: z
      .string()
      .trim()
      .max(500, "Keep the note under 500 characters")
      .optional(),
    rejectionReason: z
      .string()
      .trim()
      .max(500, "Keep the reason under 500 characters")
      .optional(),
  })
  .refine((v) => v.status !== "REJECTED" || Boolean(v.rejectionReason), {
    error: "Give a reason when rejecting an application",
    path: ["rejectionReason"],
  });

export const updatePassportStatusSchema = z
  .object({
    status: z.enum(passportStatusValues),
    verificationNotes: z
      .string()
      .trim()
      .max(500, "Keep the note under 500 characters")
      .optional(),
    rejectionReason: z
      .string()
      .trim()
      .max(500, "Keep the reason under 500 characters")
      .optional(),
  })
  .refine((v) => v.status !== "REJECTED" || Boolean(v.rejectionReason), {
    error: "Give a reason when rejecting an application",
    path: ["rejectionReason"],
  });

/**
 * Two shapes on purpose: the form holds a real number so `zodResolver` keeps a
 * single generic, while the route coerces whatever arrives over the wire.
 */
export const evaluateVisaFormSchema = z.object({
  totalAmount: z
    .number({ error: "Enter the total cost" })
    .min(0, "Enter the total cost")
    .max(1_000_000, "That figure looks wrong"),
  currency: z.string().min(1, "Select currency"),
  allowInstallment: z.boolean().optional(),
});

export const evaluateVisaSchema = z.object({
  totalAmount: z.coerce
    .number()
    .min(0, "Enter the total cost")
    .max(1_000_000, "That figure looks wrong"),
  currency: z.string().default("USD"),
  allowInstallment: z.boolean().optional(),
});

export const listParamsSchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
});

export const inviteApplicantSchema = z.object({
  purpose: z.string().trim().min(1, "Enter or select the purpose for invitation"),
  date: z.string().trim().min(1, "Select appointment date"),
  time: z.string().trim().min(1, "Select appointment time"),
  location: z.string().trim().min(1, "Enter appointment location"),
  note: z.string().trim().max(1000, "Keep note under 1000 characters").optional(),
});

export type UpdateVisaStatusInput = z.infer<typeof updateVisaStatusSchema>;
export type UpdatePassportStatusInput = z.infer<typeof updatePassportStatusSchema>;
export type EvaluateVisaInput = z.infer<typeof evaluateVisaFormSchema>;
export type InviteApplicantInput = z.infer<typeof inviteApplicantSchema>;

