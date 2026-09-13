"use client";

import { useRouter } from "next/navigation";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AgencyUser } from "@/features/agency/types";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { AgencyLoginInput, AgencySignupInput } from "@/validations/agency";

/**
 * The agency dashboard is a BFF client, exactly like the admin console: every
 * call here goes to this app's own route handlers under `/api/agency`, never
 * to the World Portal service. `internalApi` is the same-origin client — `api`
 * is the public one and would miss the session cookie entirely.
 */

export const agencyAuthKeys = {
  me: ["agency", "auth", "me"] as const,
};

export function useAgencyLogin() {
  return useMutation({
    mutationKey: ["agency", "auth", "login"],
    mutationFn: (input: AgencyLoginInput) =>
      internalApi.post<ApiResponse<AgencyUser>>("/agency/auth/login", input),
  });
}

export function useAgencySignup() {
  return useMutation({
    mutationKey: ["agency", "auth", "signup"],
    mutationFn: (input: AgencySignupInput) =>
      internalApi.post<ApiResponse<AgencyUser>>("/agency/auth/signup", input),
  });
}

export function useAgencyLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["agency", "auth", "logout"],
    mutationFn: () => internalApi.post<ApiResponse<null>>("/agency/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      router.replace("/agency/login");
      router.refresh();
    },
  });
}

/**
 * The signed-in agency. The console layout already has the session server-side,
 * so this is for client surfaces that need it without prop-drilling — it 401s
 * when the cookie has gone, and the query client is configured not to retry
 * that.
 */
export function useAgencyMe() {
  return useQuery({
    queryKey: agencyAuthKeys.me,
    queryFn: () => internalApi.get<ApiResponse<AgencyUser>>("/agency/auth/me"),
    select: (response) => response.data,
  });
}
