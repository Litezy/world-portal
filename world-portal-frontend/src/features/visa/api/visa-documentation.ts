import { useMutation, useQuery } from "@tanstack/react-query";

import type { VisaDocumentation } from "@/features/visa/types";
import type { BackendPassportApplication } from "@/server/data/backend-types";
import { api } from "@/lib/api-client";

export type TrackedApplicationResult =
  | { type: "VISA"; data: VisaDocumentation }
  | { type: "PASSPORT"; data: BackendPassportApplication };

/** Public submission — no auth, returns the record including `applicationNo`. */
export function useSubmitVisaApplication() {
  return useMutation({
    mutationKey: ["visa", "submit"],
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<VisaDocumentation>("/visa-documentation", payload),
  });
}

export function normalizeReference(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-")
    .replace(/\s+/g, "");
}

/**
 * Status lookup. `:id` accepts the UUID *or* the human application number
 * (`VISA-2026-8941` or `PASSPORT-2026-8941`), and is deliberately public so applicants can track
 * without an account — never add an auth header to this one.
 */
export function useVisaApplication(
  reference: string | null,
  email?: string | null,
) {
  const normalizedRef = normalizeReference(reference);

  return useQuery<TrackedApplicationResult>({
    queryKey: ["visa", "application", normalizedRef, email],
    enabled: Boolean(normalizedRef && email),
    retry: false,
    queryFn: async () => {
      const ref = normalizedRef;
      const em = email!.trim();

      if (ref.startsWith("PASSPORT-")) {
        const passportData = await api.get<BackendPassportApplication>(
          `/passport-application/${encodeURIComponent(ref)}?email=${encodeURIComponent(em)}`,
        );
        return { type: "PASSPORT", data: passportData };
      }

      if (ref.startsWith("VISA-")) {
        const visaData = await api.get<VisaDocumentation>(
          `/visa-documentation/${encodeURIComponent(ref)}?email=${encodeURIComponent(em)}`,
        );
        return { type: "VISA", data: visaData };
      }

      // Ambiguous prefix — try Visa first, fallback to Passport
      try {
        const visaData = await api.get<VisaDocumentation>(
          `/visa-documentation/${encodeURIComponent(ref)}?email=${encodeURIComponent(em)}`,
        );
        return { type: "VISA", data: visaData };
      } catch (err: any) {
        if (err?.status === 404) {
          const passportData = await api.get<BackendPassportApplication>(
            `/passport-application/${encodeURIComponent(ref)}?email=${encodeURIComponent(em)}`,
          );
          return { type: "PASSPORT", data: passportData };
        }
        throw err;
      }
    },
  });
}
