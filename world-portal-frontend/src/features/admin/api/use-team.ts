import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { ApiResponse, TeamMember } from "@/types";
import type { InviteMemberInput } from "@/validations/admin";

export const teamKeys = { all: ["admin", "team"] as const };

/** Manager-only on the service — a 403 here is expected for staff and partners. */
export function useTeam() {
  return useQuery({
    queryKey: teamKeys.all,
    queryFn: () =>
      internalApi.get<ApiResponse<TeamMember[]>>("/admin/team").then((r) => r.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

function useTeamMutation<TVars>(mutationFn: (vars: TVars) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.all }),
  });
}

export function useInviteMember() {
  return useTeamMutation((values: InviteMemberInput) =>
    internalApi.post<ApiResponse<TeamMember>>("/admin/team", values),
  );
}

/** Role change or reactivation. 409s (self, last manager) carry the reason. */
export function useUpdateMember() {
  return useTeamMutation(
    ({
      id,
      ...change
    }: {
      id: string;
      role?: TeamMember["role"];
      isActive?: boolean;
    }) => internalApi.patch<ApiResponse<TeamMember>>(`/admin/team/${id}`, change),
  );
}

export function useDeactivateMember() {
  return useTeamMutation((id: string) =>
    internalApi.delete<ApiResponse<TeamMember>>(`/admin/team/${id}`),
  );
}

export function useResendInvite() {
  return useMutation({
    mutationFn: (id: string) =>
      internalApi.post<ApiResponse<{ sent: boolean }>>(
        `/admin/team/${id}/resend-invite`,
      ),
  });
}
