import { useQuery } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { ApiResponse, TeamMember } from "@/types";

/** Manager-only on the service — a 403 here is expected for staff and partners. */
export function useTeam() {
  return useQuery({
    queryKey: ["admin", "team"],
    queryFn: () =>
      internalApi.get<ApiResponse<TeamMember[]>>("/admin/team").then((r) => r.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
