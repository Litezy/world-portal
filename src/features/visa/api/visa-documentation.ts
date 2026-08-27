"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import type { VisaDocumentation } from "@/features/visa/types";
import { api } from "@/lib/api-client";

/** Public submission — no auth, returns the record including `applicationNo`. */
export function useSubmitVisaApplication() {
  return useMutation({
    mutationKey: ["visa", "submit"],
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<VisaDocumentation>("/visa-documentation", payload),
  });
}

/**
 * Status lookup. `:id` accepts the UUID *or* the human application number
 * (`VISA-2026-8941`), and is deliberately public so applicants can track
 * without an account — never add an auth header to this one.
 */
export function useVisaApplication(reference: string | null) {
  return useQuery({
    queryKey: ["visa", "application", reference],
    enabled: Boolean(reference),
    retry: false,
    queryFn: () =>
      api.get<VisaDocumentation>(
        `/visa-documentation/${encodeURIComponent(reference!)}`,
      ),
  });
}
