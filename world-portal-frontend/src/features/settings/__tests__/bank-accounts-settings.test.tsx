import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bankAccounts as copy } from "@/content/admin";
import type * as ApiClient from "@/lib/api-client";

const get = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-client", async (original) => ({
  ...(await original<typeof ApiClient>()),
  internalApi: { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const { BankAccountsSettings } =
  await import("@/features/settings/components/bank-accounts-settings");

const ACCOUNT = {
  id: "b1",
  bankName: "Sample Bank",
  accountName: "E-Embassy",
  accountNumber: "0001112223",
  currency: "USD",
  isActive: true,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

function renderSettings(canManage: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BankAccountsSettings canManage={canManage} />
    </QueryClientProvider>,
  );
}

const EDIT_CONTROLS = [/add bank account/i, /^edit$/i, /delete/i, /deactivate/i];

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: [ACCOUNT] });
});

describe("BankAccountsSettings", () => {
  it("shows a manager every control", async () => {
    renderSettings(true);
    await screen.findByText("0001112223");

    for (const name of EDIT_CONTROLS) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.queryByText(copy.managerOnly)).toBeNull();
  });

  it("shows anyone else the accounts read-only, and says who can change them", async () => {
    renderSettings(false);
    await screen.findByText("0001112223");

    for (const name of EDIT_CONTROLS) {
      expect(screen.queryAllByRole("button", { name })).toHaveLength(0);
    }
    expect(screen.getByText(copy.managerOnly)).toBeInTheDocument();
  });

  it("offers no add button on an empty list to anyone but a manager", async () => {
    get.mockResolvedValue({ data: [] });
    renderSettings(false);
    await screen.findByText(/no bank accounts configured/i);

    expect(screen.queryAllByRole("button", { name: /add bank account/i })).toHaveLength(
      0,
    );
  });
});
