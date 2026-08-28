import { useQuery } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { ApiResponse, DashboardStats, VisaApplication } from "@/types";

type Overview = { stats: DashboardStats; recent: VisaApplication[] };

export const dashboardKeys = { overview: ["admin", "dashboard"] as const };

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.overview,
    queryFn: () =>
      internalApi.get<ApiResponse<Overview>>("/admin/stats").then((r) => r.data),
  });
}
