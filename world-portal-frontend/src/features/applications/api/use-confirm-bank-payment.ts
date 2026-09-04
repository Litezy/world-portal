import { useMutation, useQueryClient } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export type ConfirmBankPaymentPayload = {
  amount: number;
  paymentOption: "FULL" | "HALF_INSTALLMENT";
  bankReference?: string;
  notes?: string;
};

export function useConfirmBankPayment(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmBankPaymentPayload) =>
      internalApi.post<ApiResponse<any>>(
        `/admin/applications/${applicationId}/confirm-bank-payment`,
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "application", applicationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "applications"],
      });
    },
  });
}
