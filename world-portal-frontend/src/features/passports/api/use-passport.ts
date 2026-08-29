import { useQuery } from "@tanstack/react-query";

import { passportKeys } from "@/features/passports/api/use-passports";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse, PassportApplication } from "@/types";

export function usePassport(id: string) {
  return useQuery({
    queryKey: passportKeys.detail(id),
    queryFn: () =>
      internalApi
        .get<ApiResponse<PassportApplication>>(`/admin/passports/${id}`)
        .then((r) => r.data),
  });
}
