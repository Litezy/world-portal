import { useMutation, useQueryClient } from "@tanstack/react-query";

import { dashboardKeys } from "@/features/dashboard/api/use-dashboard";
import { enquiryKeys } from "@/features/enquiries/api/use-enquiries";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse, Enquiry } from "@/types";
import type { UpdateEnquiryInput } from "@/validations/admin";

export function useUpdateEnquiry(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...enquiryKeys.detail(id), "update"],
    mutationFn: (input: UpdateEnquiryInput) =>
      internalApi
        .patch<ApiResponse<Enquiry>>(`/admin/enquiries/${id}`, input)
        .then((r) => r.data),
    onSuccess: (enquiry) => {
      queryClient.setQueryData(enquiryKeys.detail(id), enquiry);
      queryClient.invalidateQueries({ queryKey: enquiryKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview });
    },
  });
}
