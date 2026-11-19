import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { VisaDocumentation } from "@/features/visa/types";
import { api } from "@/lib/api-client";
import type { BackendPassportApplication } from "@/server/data/backend-types";

export type TrackedApplicationResult =
  | { type: "VISA"; data: VisaDocumentation }
  | { type: "PASSPORT"; data: BackendPassportApplication };

/**
 * Submits as the signed-in WorldStreet applicant: the API files the record
 * under their account and verified email. Returns it with `applicationNo`.
 */
export function useSubmitVisaApplication() {
  const { getToken } = useAuth();
  return useMutation({
    mutationKey: ["visa", "submit"],
    mutationFn: async (payload: Record<string, unknown>) => {
      const token = await getToken();
      return api.post<VisaDocumentation>("/visa-documentation", payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    },
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
 * (`VISA-2026-8941` or `PASSPORT-2026-8941`). No account is needed, but the
 * API wants the email on the file AND `lookupToken`, the proof `POST
 * /otp/verify` returned for that email, sent as `x-lookup-token`. Keep the
 * token in memory only. Never add an `Authorization` header to this one: that
 * makes the API treat the caller as desk staff.
 */
export function useVisaApplication(
  reference: string | null,
  email?: string | null,
  lookupToken?: string | null,
) {
  const normalizedRef = normalizeReference(reference);

  return useQuery<TrackedApplicationResult>({
    // The token stays out of the key: it is a credential, not an identity.
    queryKey: ["visa", "application", normalizedRef, email],
    enabled: Boolean(normalizedRef && email && lookupToken),
    retry: false,
    queryFn: async () => {
      const ref = normalizedRef;
      const em = email!.trim();
      const config = { headers: { "x-lookup-token": lookupToken! } };
      const visaPath = `/visa-documentation/${encodeURIComponent(ref)}?email=${encodeURIComponent(em)}`;
      const passportPath = `/passport-application/${encodeURIComponent(ref)}?email=${encodeURIComponent(em)}`;

      if (ref.startsWith("PASSPORT-")) {
        const passportData = await api.get<BackendPassportApplication>(
          passportPath,
          config,
        );
        return { type: "PASSPORT", data: passportData };
      }

      if (ref.startsWith("VISA-")) {
        const visaData = await api.get<VisaDocumentation>(visaPath, config);
        return { type: "VISA", data: visaData };
      }

      // Ambiguous prefix — try Visa first, fallback to Passport
      try {
        const visaData = await api.get<VisaDocumentation>(visaPath, config);
        return { type: "VISA", data: visaData };
      } catch (err: unknown) {
        if ((err as { status?: number } | null)?.status === 404) {
          const passportData = await api.get<BackendPassportApplication>(
            passportPath,
            config,
          );
          return { type: "PASSPORT", data: passportData };
        }
        throw err;
      }
    },
  });
}
