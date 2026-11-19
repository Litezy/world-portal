import { z } from "zod";

import { emailSchema } from "@/validations/common";

/**
 * The bodies the public OTP relays (`/api/otp/send`, `/api/otp/verify`) accept.
 *
 * Those relays call the API with this server's service key and the visitor's
 * address, so they forward only these fields — never the raw browser body.
 * Unknown keys are dropped.
 */

/**
 * Purposes a visitor may ask for. The API's SendOtpDto takes any string and
 * documents only `APPLICATION_SUBMISSION`. `AGENCY_AUTH` is sent by this
 * server's agency sign-in (`src/server/agency/auth.ts`), never relayed from a
 * browser, so it is not on this list.
 */
export const PUBLIC_OTP_PURPOSES = ["APPLICATION_SUBMISSION"] as const;

export const otpSendSchema = z.object({
  email: emailSchema,
  purpose: z.enum(PUBLIC_OTP_PURPOSES).optional(),
});

export const otpVerifySchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit verification code"),
});

export type OtpSendInput = z.infer<typeof otpSendSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
