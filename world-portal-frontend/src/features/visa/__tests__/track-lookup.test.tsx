import * as React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type * as ApiClient from "@/lib/api-client";

/**
 * /track's status lookup. The API answers it without a login, but only with
 * `?email=` AND the lookup token `POST /otp/verify` minted for that email, in
 * `x-lookup-token`. The token lives in memory for the visit: never in
 * localStorage, sessionStorage or a cookie.
 */

const apiGet = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-client", async (original) => ({
  ...(await original<typeof ApiClient>()),
  api: { get: apiGet },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const { useVisaApplication } = await import("@/features/visa/api/visa-documentation");
const { TrackPanel } = await import("@/features/visa/components/track-panel");

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

type GetCall = [string, { headers?: Record<string, string> } | undefined];
const calls = () => apiGet.mock.calls as GetCall[];

describe("useVisaApplication", () => {
  beforeEach(() => {
    apiGet.mockReset().mockResolvedValue({ id: "v1" });
  });

  it("sends the lookup token with the email", async () => {
    const { result } = renderHook(
      () => useVisaApplication("VISA-2026-1234", "ada@example.com", "lookup-jwt"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [path, config] = calls()[0];
    expect(path).toBe("/visa-documentation/VISA-2026-1234?email=ada%40example.com");
    expect(config?.headers?.["x-lookup-token"]).toBe("lookup-jwt");
    expect(config?.headers?.Authorization).toBeUndefined();
  });

  it("sends it on the passport lookup and on the fallback too", async () => {
    const notFound = Object.assign(new Error("Not found"), { status: 404 });
    apiGet.mockRejectedValueOnce(notFound).mockResolvedValueOnce({ id: "p1" });

    const { result } = renderHook(
      () => useVisaApplication("2026-1234", "ada@example.com", "lookup-jwt"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(calls()).toHaveLength(2);
    expect(calls()[1][0]).toMatch(/^\/passport-application\//);
    for (const [, config] of calls()) {
      expect(config?.headers?.["x-lookup-token"]).toBe("lookup-jwt");
    }
  });

  it("does not ask without a verified token", () => {
    renderHook(() => useVisaApplication("VISA-2026-1234", "ada@example.com", null), {
      wrapper,
    });
    expect(apiGet).not.toHaveBeenCalled();
  });
});

describe("TrackPanel", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    apiGet.mockReset().mockReturnValue(new Promise(() => {}));
    fetchMock.mockReset().mockImplementation(async (url: string) => {
      if (url === "/api/otp/send") {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      if (url === "/api/otp/verify") {
        return new Response(
          JSON.stringify({ verified: true, lookupToken: "lookup-jwt" }),
          { status: 200 },
        );
      }
      throw new Error(`Unexpected call to ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("looks the file up with the token verify returned, held only in memory", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { container } = render(<TrackPanel />, { wrapper });

    fireEvent.change(container.querySelector("#reference")!, {
      target: { value: "VISA-2026-1234" },
    });
    fireEvent.change(container.querySelector("#email")!, {
      target: { value: "ada@example.com" },
    });
    fireEvent.submit(container.querySelector("#email")!.closest("form")!);

    const otp = await waitFor(() => {
      const input = container.querySelector("#otpCode");
      expect(input).not.toBeNull();
      return input!;
    });
    fireEvent.change(otp, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => expect(apiGet).toHaveBeenCalled());
    const [path, config] = calls()[0];
    expect(path).toContain("?email=ada%40example.com");
    expect(config?.headers?.["x-lookup-token"]).toBe("lookup-jwt");

    expect(setItem.mock.calls.flat().join(" ")).not.toContain("lookup-jwt");
    expect(document.cookie).not.toContain("lookup-jwt");
  });

  it("says so, instead of looking up, when verify returns no token", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url === "/api/otp/send"
        ? new Response(JSON.stringify({ success: true }), { status: 200 })
        : new Response(JSON.stringify({ verified: true }), { status: 200 }),
    );
    const { container } = render(<TrackPanel />, { wrapper });

    fireEvent.change(container.querySelector("#reference")!, {
      target: { value: "VISA-2026-1234" },
    });
    fireEvent.change(container.querySelector("#email")!, {
      target: { value: "ada@example.com" },
    });
    fireEvent.submit(container.querySelector("#email")!.closest("form")!);
    const otp = await waitFor(() => {
      const input = container.querySelector("#otpCode");
      expect(input).not.toBeNull();
      return input!;
    });
    fireEvent.change(otp, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await screen.findByText(/could not verify/i);
    expect(apiGet).not.toHaveBeenCalled();
  });
});
