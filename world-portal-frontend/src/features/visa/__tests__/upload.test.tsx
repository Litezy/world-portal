import * as React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as ApiClient from "@/lib/api-client";

/**
 * Documents upload before submission, one at a time. The API refuses anonymous
 * uploads, so each caller proves who it is the way it does everywhere else:
 * an applicant forwards their WorldStreet session token (like the visa
 * submission); the agency portal goes through its own server route, which
 * checks the agency session and uploads with the server's key.
 */

const getToken = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken }) }));

const apiPost = vi.hoisted(() => vi.fn());
const internalPost = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-client", async (original) => ({
  ...(await original<typeof ApiClient>()),
  api: { post: apiPost },
  internalApi: { post: internalPost },
}));

const { useUploadDocument } = await import("@/features/visa/api/upload");

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const file = () => new File(["%PDF-1.7"], "passport.pdf", { type: "application/pdf" });

describe("useUploadDocument", () => {
  beforeEach(() => {
    getToken.mockReset();
    apiPost.mockReset().mockResolvedValue({ url: "https://storage.example/a.pdf" });
    internalPost
      .mockReset()
      .mockResolvedValue({ url: "https://storage.example/b.pdf" });
  });

  it("uploads as the signed-in applicant, with their WorldStreet session token", async () => {
    getToken.mockResolvedValue("session-jwt");
    const { result } = renderHook(() => useUploadDocument(), { wrapper });

    await result.current.mutateAsync(file());

    expect(apiPost).toHaveBeenCalledTimes(1);
    const [path, body, config] = apiPost.mock.calls[0] as [
      string,
      FormData,
      { headers?: Record<string, string> },
    ];
    expect(path).toBe("/upload");
    expect(body.get("file")).toBeInstanceOf(File);
    expect(config.headers?.Authorization).toBe("Bearer session-jwt");
    expect(internalPost).not.toHaveBeenCalled();
  });

  it("sends agency documents through the agency portal's server route", async () => {
    const { result } = renderHook(() => useUploadDocument({ via: "agency" }), {
      wrapper,
    });

    await result.current.mutateAsync(file());

    expect(internalPost).toHaveBeenCalledTimes(1);
    const [path, body] = internalPost.mock.calls[0] as [string, FormData];
    expect(path).toBe("/agency/listing/upload");
    expect(body.get("file")).toBeInstanceOf(File);
    expect(apiPost).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
  });
});
