import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { agencyOverviewKeys } from "@/features/agency/api/use-overview";
import { agencyStaffKeys } from "@/features/agency/api/use-staff";
import type { AgencyAssignment } from "@/features/agency/types";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse, ListParams, Paginated } from "@/types";

export const agencyAssignmentKeys = {
  all: ["agency", "assignments"] as const,
  list: (params: ListParams) => [...agencyAssignmentKeys.all, "list", params] as const,
  detail: (id: string) => [...agencyAssignmentKeys.all, "detail", id] as const,
};

export function useAgencyAssignments(params: ListParams) {
  return useQuery({
    queryKey: agencyAssignmentKeys.list(params),
    queryFn: () =>
      internalApi.get<Paginated<AgencyAssignment>>("/agency/assignments", { params }),
    placeholderData: keepPreviousData,
  });
}

export function useAgencyAssignment(id: string) {
  return useQuery({
    queryKey: agencyAssignmentKeys.detail(id),
    queryFn: () =>
      internalApi
        .get<ApiResponse<AgencyAssignment>>(`/agency/assignments/${id}`)
        .then((r) => r.data),
  });
}

/**
 * Both mutations below hit the same discriminated PATCH. A refusal — the wrong
 * head count, someone else's staff, a job that has already started — comes back
 * as a 422 with a `message`, which `internalClient` has already turned into
 * `ApiError.message`. Callers render `error.message` verbatim rather than
 * guessing at the reason.
 */
export function useAssignStaff(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...agencyAssignmentKeys.detail(id), "assign"],
    mutationFn: (staffIds: string[]) =>
      internalApi
        .patch<ApiResponse<AgencyAssignment>>(`/agency/assignments/${id}`, {
          action: "assign",
          staffIds,
        })
        .then((r) => r.data),
    onSuccess: (assignment) => {
      queryClient.setQueryData(agencyAssignmentKeys.detail(id), assignment);
      queryClient.invalidateQueries({ queryKey: agencyAssignmentKeys.all });
      // Putting someone on a job moves them off "available".
      queryClient.invalidateQueries({ queryKey: agencyStaffKeys.all });
      queryClient.invalidateQueries({ queryKey: agencyOverviewKeys.all });
    },
  });
}

export function useCompleteAssignment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...agencyAssignmentKeys.detail(id), "complete"],
    mutationFn: () =>
      internalApi
        .patch<ApiResponse<AgencyAssignment>>(`/agency/assignments/${id}`, {
          action: "complete",
        })
        .then((r) => r.data),
    onSuccess: (assignment) => {
      queryClient.setQueryData(agencyAssignmentKeys.detail(id), assignment);
      queryClient.invalidateQueries({ queryKey: agencyAssignmentKeys.all });
      queryClient.invalidateQueries({ queryKey: agencyStaffKeys.all });
      // A completed job is what the next settlement run pays for.
      queryClient.invalidateQueries({ queryKey: agencyOverviewKeys.all });
    },
  });
}
