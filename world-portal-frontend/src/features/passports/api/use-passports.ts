import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { ListParams, Paginated, PassportApplication } from "@/types";

export const passportKeys = {
  all: ["admin", "passports"] as const,
  list: (params: ListParams) => [...passportKeys.all, "list", params] as const,
  detail: (id: string) => [...passportKeys.all, "detail", id] as const,
};

export function usePassports(params: ListParams) {
  return useQuery({
    queryKey: passportKeys.list(params),
    queryFn: () =>
      internalApi.get<Paginated<PassportApplication>>("/admin/passports", { params }),
    placeholderData: keepPreviousData,
  });
}
