import {
  keepPreviousData,
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { ApiResponse, ListParams, Paginated } from "@/types";

/** A professional as `/hire/professionals/admin` returns one. */
export type AdminProfessional = {
  id: string;
  slug?: string;
  name: string;
  title: string;
  category: string;
  bio?: string | null;
  country: string;
  hourlyRate: string | number;
  currency?: string | null;
  rating: string | number;
  completedJobs: number;
  isVerified: boolean;
  languages?: string[];
  skills?: string[];
  email?: string | null;
  phone?: string | null;
  createdAt: string;
};

export const adminProfessionalKeys = {
  all: ["admin", "professionals"] as const,
  list: (params: AdminProfessionalParams) =>
    [...adminProfessionalKeys.all, "list", params] as const,
};

export type AdminProfessionalParams = Pick<ListParams, "q" | "status" | "page"> & {
  category?: string;
};

export function useAdminProfessionals(params: AdminProfessionalParams) {
  return useQuery({
    queryKey: adminProfessionalKeys.list(params),
    queryFn: () =>
      internalApi.get<Paginated<AdminProfessional>>("/admin/professionals", {
        params: { ...params, perPage: 6 },
      }),
    placeholderData: keepPreviousData,
  });
}

type Snapshot = [QueryKey, Paginated<AdminProfessional> | undefined][];

export function useSetProfessionalVerified() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      internalApi.patch<ApiResponse<AdminProfessional>>(
        "/admin/professionals",
        { isVerified },
        { params: { id } },
      ),
    onMutate: async ({ id, isVerified }): Promise<Snapshot> => {
      await queryClient.cancelQueries({ queryKey: adminProfessionalKeys.all });
      const snapshot = queryClient.getQueriesData<Paginated<AdminProfessional>>({
        queryKey: adminProfessionalKeys.all,
      });
      for (const [key, page] of snapshot) {
        if (!page) continue;
        queryClient.setQueryData<Paginated<AdminProfessional>>(key, {
          ...page,
          data: page.data.map((pro) => (pro.id === id ? { ...pro, isVerified } : pro)),
        });
      }
      return snapshot;
    },
    onError: (_error, _vars, snapshot) => {
      for (const [key, page] of snapshot ?? []) queryClient.setQueryData(key, page);
    },
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: adminProfessionalKeys.all }),
  });
}
