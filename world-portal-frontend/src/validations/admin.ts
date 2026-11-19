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
    .gt(0, "Enter a cost above zero — the applicant is emailed this amount")
    .max(1_000_000, "That figure looks wrong"),
  currency: z.string().min(1, "Select currency"),
  allowInstallment: z.boolean().optional(),
});

export const evaluateVisaSchema = z.object({
  totalAmount: z.coerce
    .number()
    .gt(0, "Enter a cost above zero — the applicant is emailed this amount")
    .max(1_000_000, "That figure looks wrong"),
  currency: z.string().default("USD"),
  allowInstallment: z.boolean().optional(),
});

const isoDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine(
    (value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
    "Not a real date",
  );

export const listParamsSchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    status: z.string().trim().max(40).optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(10),
    sort: z
      .string()
      .trim()
      .max(40)
      .regex(/^[a-zA-Z]+$/)
      .optional(),
    dir: z.enum(["asc", "desc"]).optional(),
    from: isoDay.optional(),
    to: isoDay.optional(),
    /** `csv` streams every filtered row instead of a page. */
    format: z.enum(["json", "csv"]).default("json"),
  })
  .refine((p) => !p.from || !p.to || p.from <= p.to, {
    message: "The start date must be on or before the end date",
    path: ["to"],
  });

const DAY_MS = 86_400_000;

/**
 * An appointment invitation. The date can't be in the past — a day of slack
 * covers the gap between the desk's time zone and the server's.
 */
export const inviteApplicantSchema = z.object({
  purpose: z
    .string()
    .trim()
    .min(1, "Say what the appointment is for")
    .max(120, "Keep the purpose under 120 characters"),
  date: isoDay.refine(
    (value) => Date.parse(`${value}T00:00:00Z`) >= Date.now() - 2 * DAY_MS,
    "Pick today or a later date",
  ),
  time: z.string().trim().min(1, "Pick a time").max(20),
  location: z
    .string()
    .trim()
    .min(1, "Enter where they should go")
    .max(200, "Keep the venue under 200 characters"),
  note: z.string().trim().max(1000, "Keep the note under 1,000 characters").optional(),
});

/** Invite a team member — one schema for the form and `/api/admin/team`. */
export const inviteMemberSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name").max(60),
  lastName: z.string().trim().min(1, "Enter a last name").max(60),
  email: z.email("Enter a valid work email").trim().toLowerCase(),
  role: z.enum(["MANAGER", "STAFF", "PARTNER"]),
  phone: z.string().trim().max(30).optional(),
});

/** Refund a confirmed transaction (ADR 0016). The reason is read by the applicant. */
export const refundSchema = z.object({
  transactionRef: z.string().trim().min(1).max(80),
  reason: z
    .string()
    .trim()
    .min(10, "Give the applicant a reason of at least 10 characters")
    .max(500, "Keep the reason under 500 characters"),
});

/** Fee settings — percentages, 0 to 100, as the service validates them. */
export const feeConfigSchema = z.object({
  partnerMarkupPercentage: z.coerce.number().min(0).max(100),
  serviceFeePercentage: z.coerce.number().min(0).max(100),
  refundSurchargePercentage: z.coerce.number().min(0).max(100),
});

/**
 * Recording a bank transfer. Used by the form and `/confirm-bank-payment`.
 * The form also checks the amount against the balance it can see; the
 * service refuses an overpayment either way (ADR 0016).
 */
export const confirmBankPaymentSchema = z.object({
  amount: z
    .number({ error: "Enter the amount received" })
    .positive("Enter the amount received")
    .max(1_000_000, "That figure looks wrong"),
  paymentOption: z.enum(["FULL", "HALF_INSTALLMENT"]),
  bankReference: z
    .string()
    .trim()
    .max(80, "Keep the reference under 80 characters")
    .optional(),
  notes: z.string().trim().max(500, "Keep the note under 500 characters").optional(),
});

/** A rejected agency document always carries a reason — the agency reads it in their portal. */
export const rejectionNoteSchema = z
  .string()
  .trim()
  .min(10, "Give the agency a reason of at least 10 characters")
  .max(1000, "Keep the reason under 1,000 characters");

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type ConfirmBankPaymentInput = z.infer<typeof confirmBankPaymentSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
export type FeeConfigInput = z.infer<typeof feeConfigSchema>;
export type UpdateVisaStatusInput = z.infer<typeof updateVisaStatusSchema>;
export type UpdatePassportStatusInput = z.infer<typeof updatePassportStatusSchema>;
export type EvaluateVisaInput = z.infer<typeof evaluateVisaFormSchema>;
export type InviteApplicantInput = z.infer<typeof inviteApplicantSchema>;
