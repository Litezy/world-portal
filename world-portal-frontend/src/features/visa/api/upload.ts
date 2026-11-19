"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";

import type { UploadedDocument } from "@/features/visa/types";
import { api, internalApi } from "@/lib/api-client";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_UPLOAD_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;
export const ACCEPT_ATTRIBUTE = ".pdf,.jpg,.jpeg,.png,.webp";

/** Client-side guard so an oversized file never costs a round trip. */
export function validateFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 10MB.`;
  }
  if (
    !ACCEPTED_UPLOAD_TYPES.includes(file.type as (typeof ACCEPTED_UPLOAD_TYPES)[number])
  ) {
    return "Use a PDF, JPG, PNG or WEBP file.";
  }
  return null;
}

/**
 * Documents upload one at a time, before the application is submitted; the
 * returned `url` is what goes into the matching `*Url` field. There is no
 * endpoint that takes raw files alongside the application payload.
 *
 * The API refuses anonymous uploads:
 * - `applicant` (the visa and passport forms) sends the WorldStreet session
 *   token, exactly as the visa submission does;
 * - `agency` (the listing checklist) has no token the API accepts, so it posts
 *   to the agency portal's own route, which checks the agency session and
 *   uploads with the server's key.
 */
export function useUploadDocument({
  via = "applicant",
}: { via?: "applicant" | "agency" } = {}) {
  const { getToken } = useAuth();
  return useMutation({
    mutationKey: [via === "agency" ? "agency" : "visa", "upload"],
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);

      if (via === "agency") {
        return internalApi.post<UploadedDocument>("/agency/listing/upload", body, {
          // The same-origin client defaults to JSON, which would serialise the
          // form; this lets the browser send multipart with its own boundary.
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      const token = await getToken();
      return api.post<UploadedDocument>("/upload", body, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    },
  });
}
