import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applicationKeys } from "@/features/applications/api/use-applications";
import { dashboardKeys } from "@/features/dashboard/api/use-dashboard";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse, VisaApplication } from "@/types";
import type { InviteApplicantInput } from "@/validations/admin";

export function useInviteApplicant(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...applicationKeys.detail(id), "invite"],
    mutationFn: (input: InviteApplicantInput) =>
      internalApi
        .post<ApiResponse<VisaApplication>>(`/admin/applications/${id}/invite`, input)
        .then((r) => r.data),
    onSuccess: (application) => {
      queryClient.setQueryData(applicationKeys.detail(id), application);
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview });
    },
  });
}
