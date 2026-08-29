import { useMutation } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { AdminUser, ApiResponse } from "@/types";
import type { LoginInput } from "@/validations/auth";

export function useLogin() {
  return useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: (input: LoginInput) =>
      internalApi.post<ApiResponse<AdminUser>>("/admin/auth/login", input),
  });
}
