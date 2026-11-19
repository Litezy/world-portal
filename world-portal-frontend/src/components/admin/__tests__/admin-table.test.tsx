import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type AdminColumn, AdminDataTable } from "@/components/admin/admin-data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { StatusTabs } from "@/components/admin/list-controls";
import { shortDuration, SlaPill, slaState } from "@/components/admin/sla-pill";
import type * as ApiClient from "@/lib/api-client";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/admin/applications",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

type ApiClientModule = typeof ApiClient;

const search = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-client", async (original) => ({
  ...(await original<ApiClientModule>()),
  internalApi: { get: search },
}));

const { CommandPalette } = await import("@/components/admin/command-palette");

type Row = { id: string; name: string; amount: number };
const rows: Row[] = [
  { id: "1", name: "Ada Okafor", amount: 10 },
  { id: "2", name: "Bisi Ade", amount: 20 },
];
const columns: AdminColumn<Row>[] = [
  {
    id: "name",
    header: "Name",
    primary: true,
    required: true,
    sortKey: "name",
    cell: (r) => r.name,
  },
  {
    id: "amount",
    header: "Amount",
    sortKey: "amount",
    align: "right",
    cell: (r) => r.amount,
  },
];

function renderTable(
  props: Partial<React.ComponentProps<typeof AdminDataTable<Row>>> = {},
) {
  return render(
    <AdminDataTable<Row>
      columns={columns}
      rows={rows}
      getRowId={(r) => r.id}
      getRowLabel={(r) => r.name}
      isPending={false}
      isError={false}
      onRetry={() => {}}
      errorTitle="Could not load"
      empty={<p>Nothing</p>}
      {...props}
    />,
  );
}

describe("AdminDataTable", () => {
  it("announces the sorted column and asks for the next direction", () => {
    const onSort = vi.fn();
    renderTable({ sort: "name", dir: "asc", onSort });
    const table = screen.getByRole("table");

    expect(within(table).getByRole("columnheader", { name: /name/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    fireEvent.click(within(table).getByRole("button", { name: "Sort by Name" }));
    expect(onSort).toHaveBeenCalledWith("name", "desc");

    fireEvent.click(within(table).getByRole("button", { name: "Sort by Amount" }));
    expect(onSort).toHaveBeenLastCalledWith("amount", "asc");
  });

  it("shows the bulk bar with only the selected visible rows", () => {
    const bulk = vi.fn(() => <button type="button">Do it</button>);
    renderTable({ bulkActions: bulk });
    const table = screen.getByRole("table");

    fireEvent.click(within(table).getByRole("checkbox", { name: "Select Bisi Ade" }));

    expect(screen.getByRole("region", { name: "1 selected" })).toBeInTheDocument();
    expect(bulk).toHaveBeenLastCalledWith([rows[1]], expect.any(Function));

    fireEvent.click(
      within(table).getByRole("checkbox", { name: "Select all on this page" }),
    );
    expect(screen.getByRole("region", { name: "2 selected" })).toBeInTheDocument();
  });

  it("hides optional columns the reader turned off, never the required one", () => {
    renderTable({ hiddenColumns: ["amount", "name"] });
    const table = screen.getByRole("table");
    expect(
      within(table).queryByRole("columnheader", { name: /amount/i }),
    ).not.toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /name/i }),
    ).toBeInTheDocument();
  });

  it("offers a retry instead of a dead end when the list fails", () => {
    const onRetry = vi.fn();
    renderTable({ isError: true, onRetry, rows: undefined });
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("StatusTabs", () => {
  it("shows a count on every tab and reports the chosen status", () => {
    const onChange = vi.fn();
    render(
      <StatusTabs
        label="Filter by stage"
        onChange={onChange}
        counts={{ SUBMITTED: 3, APPROVED: 1 }}
        options={[
          { value: "SUBMITTED", label: "Submitted" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
        ]}
      />,
    );

    expect(screen.getByRole("tab", { name: /all 4/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: /rejected 0/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /submitted 3/i }));
    expect(onChange).toHaveBeenCalledWith("SUBMITTED");
  });
});

describe("ConfirmDialog", () => {
  it("states the consequence and only acts on the explicit button", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Delete the GTBank account?"
        description="This can't be undone."
        confirmLabel="Delete account"
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText("This can't be undone.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

describe("SlaPill", () => {
  it("formats durations at the largest whole unit", () => {
    expect(shortDuration(3 * 86_400_000 + 5)).toBe("3d");
    expect(shortDuration(5 * 3_600_000)).toBe("5h");
    expect(shortDuration(30_000)).toBe("1m");
  });

  it("goes soon inside the last day and late once past due", () => {
    const now = Date.parse("2026-11-16T12:00:00Z");
    expect(slaState(now + 2 * 86_400_000, now)).toBe("ok");
    expect(slaState(now + 3_600_000, now)).toBe("soon");
    expect(slaState(now - 1, now)).toBe("late");
  });

  it("says overdue in words, not only in colour", () => {
    render(<SlaPill dueAt={new Date(Date.now() - 2 * 3_600_000)} />);
    expect(screen.getByText("2h overdue")).toHaveAttribute("data-sla", "late");
  });
});

describe("CommandPalette", () => {
  function renderPalette(role: "MANAGER" | "PARTNER" = "MANAGER") {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={client}>
        <CommandPalette role={role} open onOpenChange={() => {}} />
      </QueryClientProvider>,
    );
  }

  it("lists only the pages this role can open", () => {
    renderPalette("PARTNER");
    expect(
      screen.getByRole("option", { name: /visa applications/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /financials/i }),
    ).not.toBeInTheDocument();
  });

  it("finds records through the service and opens one with the keyboard", async () => {
    search.mockResolvedValue({
      data: {
        visas: [
          {
            id: "v1",
            reference: "VISA-2026-0042",
            name: "Ada Okafor",
            status: "SUBMITTED",
          },
        ],
        passports: [],
        applicants: [],
      },
    });
    renderPalette();
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "ada" } });
    const option = await screen.findByRole("option", { name: /VISA-2026-0042/ });
    expect(search).toHaveBeenCalledWith("/admin/search", { params: { q: "ada" } });

    // "ada" matches no page, so the record is the first option.
    expect(option).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/admin/applications/v1");
  });
});
