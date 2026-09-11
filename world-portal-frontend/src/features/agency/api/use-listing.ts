"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Agency, AgencyDocumentKind } from "@/features/agency/types";
import { ApiError, internalApi, internalClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { ListingPatchInput, SetDocumentInput } from "@/validations/agency";

/**
 * The listing screen's data layer.
 *
 * Everything here talks to this app's own route handlers through
 * `internalApi` — the agency console is a BFF like the admin one, so the
 * public `api` client never appears on this side.
 *
 * The bodies are typed from the same zod schemas the route handlers validate
 * with, inferred rather than re-declared: one schema per form, and a field
 * added there is a type error here rather than a silent 422.
 */
export type ListingPatch = ListingPatchInput;
export type SetDocumentBody = SetDocumentInput;

export const listingKeys = {
  all: ["agency", "listing"] as const,
};

export function useAgencyListing() {
  return useQuery({
    queryKey: listingKeys.all,
    queryFn: () =>
      internalApi.get<ApiResponse<Agency>>("/agency/listing").then((r) => r.data),
    // The form holds the draft; refetching under the agency's fingers would
    // fight whatever they are typing.
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Autosave. Called on a debounce as the agency types, so it deliberately does
 * not invalidate the query — writing the server's answer back into the cache
 * is enough, and an invalidation would refetch mid-keystroke.
 */
export function useSaveListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...listingKeys.all, "save"],
    mutationFn: (patch: ListingPatch) =>
      internalApi
        .patch<ApiResponse<Agency>>("/agency/listing", patch)
        .then((r) => r.data),
    onSuccess: (agency) => queryClient.setQueryData(listingKeys.all, agency),
  });
}

/**
 * One document at a time — the file has already gone to `POST /upload` and
 * this records the URL it came back with, exactly as the visa flow does.
 * Re-uploading the same `kind` replaces it.
 */
export function useSetListingDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...listingKeys.all, "document"],
    mutationFn: (body: SetDocumentBody) =>
      internalApi
        .patch<ApiResponse<Agency>>("/agency/listing/documents", body)
        .then((r) => r.data),
    onSuccess: (agency) => queryClient.setQueryData(listingKeys.all, agency),
  });
}

/** A 422 from the submit route, with the paperwork that is actually missing. */
export class MissingDocumentsError extends Error {
  readonly missing: AgencyDocumentKind[];

  constructor(message: string, missing: AgencyDocumentKind[]) {
    super(message);
    this.name = "MissingDocumentsError";
    this.missing = missing;
  }
}

type SubmitFailureBody = {
  message?: string;
  code?: string;
  missing?: AgencyDocumentKind[];
};

export function useSubmitListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...listingKeys.all, "submit"],
    mutationFn: async () => {
      // The submit route's 422 carries `missing`, and the shared response
      // interceptor keeps only message/status/code/errors — so this one call
      // is taken off the error path and read here, rather than telling the
      // agency "something is missing" and leaving them to guess which.
      const response = await internalClient.post<
        ApiResponse<Agency> | SubmitFailureBody
      >("/agency/listing/submit", undefined, {
        validateStatus: (status) => status < 500,
      });

      if (response.status === 422) {
        const body = response.data as SubmitFailureBody;
        throw new MissingDocumentsError(
          body.message ?? "Some required documents are still missing.",
          body.missing ?? [],
        );
      }

      if (response.status >= 400) {
        const body = response.data as SubmitFailureBody;
        throw new ApiError({
          message: body.message ?? "Could not submit your listing. Please try again.",
          status: response.status,
          code: body.code,
        });
      }

      return (response.data as ApiResponse<Agency>).data;
    },
    onSuccess: (agency) => queryClient.setQueryData(listingKeys.all, agency),
  });
}
