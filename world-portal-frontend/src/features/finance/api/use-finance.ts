import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { applicationKeys } from "@/features/applications/api/use-applications";
import { dashboardKeys } from "@/features/dashboard/api/use-dashboard";
import { passportKeys } from "@/features/passports/api/use-passports";
import { internalApi } from "@/lib/api-client";
import type { BackendPaymentConfig, BackendRefund } from "@/server/data/backend-types";
import type { ApiResponse, ListParams, Paginated } from "@/types";
import type { FeeConfigInput, RefundInput } from "@/validations/admin";

export const financeKeys = {
  all: ["admin", "finance"] as const,
  list: (params: ListParams & { tab?: string }) =>
    [...financeKeys.all, "list", params] as const,
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

/**
 * A refund changes the transaction, its application's balance and the
 * dashboard totals, so every one of those views is refreshed.
 */
export function useProcessRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RefundInput) =>
      internalApi.post<ApiResponse<BackendRefund>>("/admin/finance/refunds", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeKeys.all });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      void queryClient.invalidateQueries({ queryKey: passportKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview });
    },
  });
}

export function useSaveFeeConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FeeConfigInput) =>
      internalApi.patch<ApiResponse<BackendPaymentConfig>>(
        "/admin/finance/config",
        input,
      ),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  });
}
