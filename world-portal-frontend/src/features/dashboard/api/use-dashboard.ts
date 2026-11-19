import { useQuery } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { ApiResponse, DashboardStats, VisaApplication } from "@/types";

type Overview = { stats: DashboardStats; recent: VisaApplication[] };

export const dashboardKeys = { overview: ["admin", "dashboard"] as const };

/**
 * The overview figures. The sidebar's open-file counts read the same query,
 * so they cost nothing extra; `enabled: false` for a role that can't read it.
 */
export function useDashboard({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: dashboardKeys.overview,
    queryFn: () =>
      internalApi.get<ApiResponse<Overview>>("/admin/stats").then((r) => r.data),
    enabled,
  });
}
