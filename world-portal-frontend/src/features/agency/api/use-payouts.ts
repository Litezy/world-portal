import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { AgencyPayout } from "@/features/agency/types";
import { internalApi } from "@/lib/api-client";
import type { ListParams, Paginated } from "@/types";

export const agencyPayoutKeys = {
  all: ["agency", "payouts"] as const,
  list: (params: ListParams) => [...agencyPayoutKeys.all, "list", params] as const,
};

export function useAgencyPayouts(params: ListParams) {
  return useQuery({
    queryKey: agencyPayoutKeys.list(params),
    queryFn: () =>
      internalApi.get<Paginated<AgencyPayout>>("/agency/payouts", { params }),
    placeholderData: keepPreviousData,
  });
}
