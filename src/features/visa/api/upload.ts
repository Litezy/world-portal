"use client";

import { useMutation } from "@tanstack/react-query";

import type { UploadedDocument } from "@/features/visa/types";
import { api } from "@/lib/api-client";

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
 */
export function useUploadDocument() {
  return useMutation({
    mutationKey: ["visa", "upload"],
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append("file", file);
      return api.post<UploadedDocument>("/upload", body);
    },
  });
}
