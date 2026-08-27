import { z } from "zod";

import { emailSchema, honeypotSchema } from "@/validations/common";

export const newsletterSchema = z.object({
  email: emailSchema,
  website: honeypotSchema,
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
