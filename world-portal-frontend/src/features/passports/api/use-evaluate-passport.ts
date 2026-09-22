import { useMutation, useQueryClient } from "@tanstack/react-query";

import { passportKeys } from "@/features/passports/api/use-passports";
import { dashboardKeys } from "@/features/dashboard/api/use-dashboard";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse, PassportApplication } from "@/types";
import type { EvaluateVisaInput } from "@/validations/admin";

export function useEvaluatePassport(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...passportKeys.detail(id), "evaluate"],
    mutationFn: (input: EvaluateVisaInput) =>
      internalApi
        .post<ApiResponse<PassportApplication>>(`/admin/passports/${id}/evaluate`, input)
        .then((r) => r.data),
    onSuccess: (passport) => {
      queryClient.setQueryData(passportKeys.detail(id), passport);
      queryClient.invalidateQueries({ queryKey: passportKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview });
    },
  });
}
