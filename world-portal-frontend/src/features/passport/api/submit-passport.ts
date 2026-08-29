"use client";

import { useMutation } from "@tanstack/react-query";

import type { PassportEnquiryInput } from "@/validations/passport";

type Result = { data: { reference: string } };

/**
 * Posts to this app's own route handler, not the World Portal API — there is
 * no passport endpoint upstream yet. Uses `fetch` rather than the shared axios
 * client because that client's baseURL points at the external API.
 */
export function useSubmitPassportEnquiry() {
  return useMutation({
    mutationKey: ["passport", "submit"],
    mutationFn: async (input: PassportEnquiryInput): Promise<Result> => {
      const response = await fetch("/api/passport-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(body?.message ?? "Could not send your request.");
        Object.assign(error, { errors: body?.errors, status: response.status });
        throw error;
      }
      return body as Result;
    },
  });
}
