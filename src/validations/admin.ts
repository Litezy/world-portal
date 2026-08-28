import { z } from "zod";

export const enquiryStatusValues = [
  "new",
  "contacted",
  "quoted",
  "won",
  "lost",
] as const;

export const applicationStatusValues = [
  "draft",
  "submitted",
  "in_review",
  "documents_required",
  "biometrics_scheduled",
  "decision_pending",
  "approved",
  "rejected",
] as const;

export const updateEnquirySchema = z.object({
  status: z.enum(enquiryStatusValues).optional(),
  assigneeId: z.string().nullable().optional(),
});

export const updateApplicationSchema = z.object({
  status: z.enum(applicationStatusValues),
  note: z.string().trim().max(500, "Keep the note under 500 characters").optional(),
});

export const listParamsSchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
});

export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
