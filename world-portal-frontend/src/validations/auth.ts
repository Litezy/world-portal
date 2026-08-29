import { z } from "zod";

import { emailSchema } from "@/validations/common";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Enter your password"),
  remember: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
