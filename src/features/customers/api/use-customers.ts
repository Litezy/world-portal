import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { Customer, ListParams, Paginated } from "@/types";

export const customerKeys = {
  all: ["admin", "customers"] as const,
  list: (params: ListParams) => [...customerKeys.all, "list", params] as const,
};

export function useCustomers(params: ListParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => internalApi.get<Paginated<Customer>>("/admin/customers", { params }),
    placeholderData: keepPreviousData,
  });
}
