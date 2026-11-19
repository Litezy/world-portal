import {
  keepPreviousData,
  type QueryClient,
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type {
  Agency,
  AgencyDocumentStatus,
  AgencyVerificationStatus,
} from "@/features/agency/types";
import { internalApi } from "@/lib/api-client";
import type { ApiResponse, ListParams, Paginated } from "@/types";

/**
 * The console's view of partner agencies (`/api/admin/agencies`). Not to be
 * confused with `use-listing.ts` and friends, which are the agency's own portal.
 */
export const adminAgencyKeys = {
  all: ["admin", "agencies"] as const,
  list: (params: AdminAgencyParams) =>
    [...adminAgencyKeys.all, "list", params] as const,
};

export type AdminAgencyParams = Pick<ListParams, "q" | "page"> & {
  verification?: AgencyVerificationStatus;
};

export const AGENCIES_PER_PAGE = 6;

export function useAdminAgencies(params: AdminAgencyParams) {
  return useQuery({
    queryKey: adminAgencyKeys.list(params),
    queryFn: () =>
      internalApi.get<Paginated<Agency>>("/admin/agencies", {
        params: {
          search: params.q,
          verification: params.verification,
          page: params.page,
          perPage: AGENCIES_PER_PAGE,
        },
      }),
    placeholderData: keepPreviousData,
  });
}

type Snapshot = [QueryKey, Paginated<Agency> | undefined][];

/**
 * Apply a change to every cached page at once and remember what was there, so
 * a refusal puts the screen back exactly as it was.
 */
async function patchCachedAgencies(
  queryClient: QueryClient,
  id: string,
  patch: (agency: Agency) => Agency,
): Promise<Snapshot> {
  await queryClient.cancelQueries({ queryKey: adminAgencyKeys.all });
  const snapshot = queryClient.getQueriesData<Paginated<Agency>>({
    queryKey: adminAgencyKeys.all,
  });
  for (const [key, page] of snapshot) {
    if (!page) continue;
    queryClient.setQueryData<Paginated<Agency>>(key, {
      ...page,
      data: page.data.map((agency) => (agency.id === id ? patch(agency) : agency)),
    });
  }
  return snapshot;
}

function restore(queryClient: QueryClient, snapshot?: Snapshot) {
  for (const [key, page] of snapshot ?? []) queryClient.setQueryData(key, page);
}

export function useUpdateAgencyVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      verification,
    }: {
      id: string;
      verification: AgencyVerificationStatus;
    }) =>
      internalApi.patch<ApiResponse<Agency>>(
        "/admin/agencies",
        { verification },
        { params: { id } },
      ),
    onMutate: ({ id, verification }) =>
      patchCachedAgencies(queryClient, id, (agency) => ({ ...agency, verification })),
    onError: (_error, _vars, snapshot) => restore(queryClient, snapshot),
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: adminAgencyKeys.all }),
  });
}

export function useUpdateAgencyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      agencyId,
      kind,
      status,
      note,
    }: {
      agencyId: string;
      kind: string;
      status: Extract<AgencyDocumentStatus, "approved" | "rejected">;
      note?: string;
    }) =>
      internalApi.patch<ApiResponse<Agency>>(
        "/admin/agencies",
        { docId: kind, docStatus: status, note },
        { params: { id: agencyId } },
      ),
    onMutate: ({ agencyId, kind, status, note }) =>
      patchCachedAgencies(queryClient, agencyId, (agency) => ({
        ...agency,
        documents: agency.documents.map((doc) =>
          doc.kind === kind ? { ...doc, status, ...(note ? { note } : {}) } : doc,
        ),
      })),
    onError: (_error, _vars, snapshot) => restore(queryClient, snapshot),
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: adminAgencyKeys.all }),
  });
}
