import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type {
  ApiResponse,
  Customer,
  CustomerDetail,
  ListParams,
  Paginated,
} from "@/types";

export const customerKeys = {
  all: ["admin", "customers"] as const,
  list: (params: ListParams) => [...customerKeys.all, "list", params] as const,
  detail: (key: string) => [...customerKeys.all, "detail", key] as const,
};

export function useCustomers(params: ListParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => internalApi.get<Paginated<Customer>>("/admin/customers", { params }),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(key: string) {
  return useQuery({
    queryKey: customerKeys.detail(key),
    queryFn: () =>
      internalApi
        .get<ApiResponse<CustomerDetail>>(`/admin/customers/${encodeURIComponent(key)}`)
        .then((r) => r.data),
  });
}
