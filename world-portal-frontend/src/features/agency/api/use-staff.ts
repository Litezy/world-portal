import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { agencyOverviewKeys } from "@/features/agency/api/use-overview";
import type { AgencyStaff } from "@/features/agency/types";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse, ListParams, Paginated } from "@/types";
import type { NewStaffInput } from "@/validations/agency";

export const agencyStaffKeys = {
  all: ["agency", "staff"] as const,
  list: (params: ListParams) => [...agencyStaffKeys.all, "list", params] as const,
};

export function useAgencyStaff(params: ListParams) {
  return useQuery({
    queryKey: agencyStaffKeys.list(params),
    queryFn: () => internalApi.get<Paginated<AgencyStaff>>("/agency/staff", { params }),
    placeholderData: keepPreviousData,
  });
}

/**
 * The payload is the route handler's own schema — one schema per form, so the
 * dialog cannot drift from what `POST /api/agency/staff` will accept.
 */
export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...agencyStaffKeys.all, "create"],
    mutationFn: (input: NewStaffInput) =>
      internalApi
        .post<ApiResponse<AgencyStaff>>("/agency/staff", input)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyStaffKeys.all });
      // The head count on the dashboard is derived from this collection.
      queryClient.invalidateQueries({ queryKey: agencyOverviewKeys.all });
    },
  });
}
