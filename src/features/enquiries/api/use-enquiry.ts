import { useQuery } from "@tanstack/react-query";

import { enquiryKeys } from "@/features/enquiries/api/use-enquiries";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse, Enquiry } from "@/types";

export function useEnquiry(id: string) {
  return useQuery({
    queryKey: enquiryKeys.detail(id),
    queryFn: () =>
      internalApi
        .get<ApiResponse<Enquiry>>(`/admin/enquiries/${id}`)
        .then((r) => r.data),
  });
}
