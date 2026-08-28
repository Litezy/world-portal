import { useMutation, useQueryClient } from "@tanstack/react-query";

import { dashboardKeys } from "@/features/dashboard/api/use-dashboard";
import { passportKeys } from "@/features/passports/api/use-passports";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse, PassportApplication } from "@/types";
import type { UpdatePassportStatusInput } from "@/validations/admin";

export function useUpdatePassport(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...passportKeys.detail(id), "update"],
    mutationFn: (input: UpdatePassportStatusInput) =>
      internalApi
        .patch<ApiResponse<PassportApplication>>(`/admin/passports/${id}`, input)
        .then((r) => r.data),
    onSuccess: (record) => {
      queryClient.setQueryData(passportKeys.detail(id), record);
      queryClient.invalidateQueries({ queryKey: passportKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview });
    },
  });
}
