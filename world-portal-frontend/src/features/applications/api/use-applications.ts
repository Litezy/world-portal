import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { ListParams, Paginated, VisaApplication } from "@/types";

export const applicationKeys = {
  all: ["admin", "applications"] as const,
  list: (params: ListParams) => [...applicationKeys.all, "list", params] as const,
  detail: (id: string) => [...applicationKeys.all, "detail", id] as const,
};

export function useApplications(params: ListParams) {
  return useQuery({
    queryKey: applicationKeys.list(params),
    queryFn: () =>
      internalApi.get<Paginated<VisaApplication>>("/admin/applications", { params }),
    placeholderData: keepPreviousData,
  });
}
