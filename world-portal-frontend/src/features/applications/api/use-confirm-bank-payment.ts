import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applicationKeys } from "@/features/applications/api/use-applications";
import { dashboardKeys } from "@/features/dashboard/api/use-dashboard";
import { financeKeys } from "@/features/finance/api/use-finance";
import { passportKeys } from "@/features/passports/api/use-passports";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export type ConfirmBankPaymentPayload = {
  amount: number;
  paymentOption: "FULL" | "HALF_INSTALLMENT";
  bankReference?: string;
  notes?: string;
};

export function useConfirmBankPayment(
  applicationId: string,
  type: "visa" | "passport" = "visa",
) {
  const queryClient = useQueryClient();

  const endpoint =
    type === "passport"
      ? `/admin/passports/${applicationId}/confirm-bank-payment`
      : `/admin/applications/${applicationId}/confirm-bank-payment`;

  return useMutation({
    mutationFn: (payload: ConfirmBankPaymentPayload) =>
      internalApi.post<ApiResponse<unknown>>(endpoint, payload),
    onSuccess: () => {
      // The keys come from each feature's own factory: hand-typed keys here used
      // to miss the detail query, leaving the file showing the old balance.
      const keys = type === "passport" ? passportKeys : applicationKeys;
      void queryClient.invalidateQueries({ queryKey: keys.detail(applicationId) });
      void queryClient.invalidateQueries({ queryKey: keys.all });
      // A payment moves the collected and outstanding totals too.
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview });
      void queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}
