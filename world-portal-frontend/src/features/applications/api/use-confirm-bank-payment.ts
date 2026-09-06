import { useMutation, useQueryClient } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export type ConfirmBankPaymentPayload = {
  amount: number;
  paymentOption: "FULL" | "HALF_INSTALLMENT";
  bankReference?: string;
  notes?: string;
};

export function useConfirmBankPayment(applicationId: string, type: "visa" | "passport" = "visa") {
  const queryClient = useQueryClient();

  const endpoint =
    type === "passport"
      ? `/admin/passports/${applicationId}/confirm-bank-payment`
      : `/admin/applications/${applicationId}/confirm-bank-payment`;

  return useMutation({
    mutationFn: (payload: ConfirmBankPaymentPayload) =>
      internalApi.post<ApiResponse<any>>(endpoint, payload),
    onSuccess: () => {
      if (type === "passport") {
        queryClient.invalidateQueries({
          queryKey: ["admin", "passport", applicationId],
        });
        queryClient.invalidateQueries({
          queryKey: ["admin", "passports"],
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: ["admin", "application", applicationId],
        });
        queryClient.invalidateQueries({
          queryKey: ["admin", "applications"],
        });
      }
    },
  });
}
