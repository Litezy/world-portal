import { useQuery } from "@tanstack/react-query";

import type { AgencyOverview } from "@/features/agency/types";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

/**
 * The agency dashboard's headline figures.
 *
 * Same BFF rule as the admin console: this talks to `internalApi` — the
 * same-origin route handlers under `src/app/api/agency` — never to `api`,
 * which is the public World Portal client.
 */
export const agencyOverviewKeys = {
  all: ["agency", "overview"] as const,
};

export function useAgencyOverview() {
  return useQuery({
    queryKey: agencyOverviewKeys.all,
    queryFn: () =>
      internalApi
        .get<ApiResponse<AgencyOverview>>("/agency/overview")
        .then((r) => r.data),
  });
}
