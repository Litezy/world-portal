"use client";

import { useRouter } from "next/navigation";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AgencyUser } from "@/features/agency/types";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { AgencyLoginInput, AgencySendOtpInput, AgencySignupInput } from "@/validations/agency";

export const agencyAuthKeys = {
  me: ["agency", "auth", "me"] as const,
};

export function useAgencySendOtp() {
  return useMutation({
    mutationKey: ["agency", "auth", "otp", "send"],
    mutationFn: (input: AgencySendOtpInput) =>
      internalApi.post<ApiResponse<null>>("/agency/auth/otp/send", input),
  });
}

export function useAgencyLogin() {
  return useMutation({
    mutationKey: ["agency", "auth", "login"],
    mutationFn: (input: AgencyLoginInput) =>
      internalApi.post<ApiResponse<AgencyUser & { token?: string }>>("/agency/auth/login", input),
  });
}

export function useAgencySignup() {
  return useMutation({
    mutationKey: ["agency", "auth", "signup"],
    mutationFn: (input: AgencySignupInput) =>
      internalApi.post<ApiResponse<AgencyUser & { token?: string }>>("/agency/auth/signup", input),
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

export function useAgencyMe() {
  return useQuery({
    queryKey: agencyAuthKeys.me,
    queryFn: () => internalApi.get<ApiResponse<AgencyUser>>("/agency/auth/me"),
    select: (response) => response.data,
  });
}
