import { useQuery } from "@tanstack/react-query";

import { applicationKeys } from "@/features/applications/api/use-applications";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse, VisaApplication } from "@/types";

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () =>
      internalApi
        .get<ApiResponse<VisaApplication>>(`/admin/applications/${id}`)
        .then((r) => r.data),
  });
}
