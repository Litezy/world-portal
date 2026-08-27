import { useQuery } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { AdminUser, ApiResponse } from "@/types";

export function useConsultants() {
  return useQuery({
    queryKey: ["admin", "consultants"],
    queryFn: () =>
      internalApi
        .get<ApiResponse<AdminUser[]>>("/admin/consultants")
        .then((r) => r.data),
    staleTime: 30 * 60 * 1000,
  });
}
