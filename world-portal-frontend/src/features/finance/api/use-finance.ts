import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { ListParams, Paginated } from "@/types";

export const financeKeys = {
  all: ["admin", "finance"] as const,
  list: (params: ListParams & { tab?: string }) => [...financeKeys.all, "list", params] as const,
};

export function useFinance<T = unknown>(params: ListParams & { tab?: string }) {
  return useQuery({
    queryKey: financeKeys.list(params),
    queryFn: () =>
      internalApi.get<Paginated<T> | { success: boolean; data: T }>("/admin/finance", {
        params,
      }),
    placeholderData: keepPreviousData,
  });
}
