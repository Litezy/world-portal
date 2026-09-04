import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode?: string | null;
  iban?: string | null;
  routingNumber?: string | null;
  currency: string;
  instructions?: string | null;
  isActive: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateBankAccountPayload = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode?: string;
  iban?: string;
  routingNumber?: string;
  currency?: string;
  instructions?: string;
  isActive?: boolean;
};

export type UpdateBankAccountPayload = Partial<CreateBankAccountPayload>;

export function useBankAccounts() {
  return useQuery({
    queryKey: ["admin", "bank-accounts"],
    queryFn: () =>
      internalApi
        .get<ApiResponse<BankAccount[]>>("/admin/bank-accounts")
        .then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePublicActiveBankAccounts() {
  return useQuery({
    queryKey: ["public", "bank-accounts", "active"],
    queryFn: () =>
      internalApi
        .get<ApiResponse<BankAccount[]>>("/bank-accounts/public/active")
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBankAccountPayload) =>
      internalApi.post<ApiResponse<BankAccount>>("/admin/bank-accounts", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["public", "bank-accounts", "active"] });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBankAccountPayload }) =>
      internalApi.patch<ApiResponse<BankAccount>>(`/admin/bank-accounts/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["public", "bank-accounts", "active"] });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      internalApi.delete<ApiResponse<BankAccount>>(`/admin/bank-accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["public", "bank-accounts", "active"] });
    },
  });
}
