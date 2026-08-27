import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";
import type { Enquiry, ListParams, Paginated } from "@/types";

export const enquiryKeys = {
  all: ["admin", "enquiries"] as const,
  list: (params: ListParams) => [...enquiryKeys.all, "list", params] as const,
  detail: (id: string) => [...enquiryKeys.all, "detail", id] as const,
};

export function useEnquiries(params: ListParams) {
  return useQuery({
    queryKey: enquiryKeys.list(params),
    queryFn: () => internalApi.get<Paginated<Enquiry>>("/admin/enquiries", { params }),
    // Keeps the previous page on screen while the next one loads, so the table
    // never collapses to a spinner mid-pagination.
    placeholderData: keepPreviousData,
  });
}
