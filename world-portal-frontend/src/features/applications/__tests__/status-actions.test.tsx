import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as ApiClient from "@/lib/api-client";

const patch = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-client", async (original) => ({
  ...(await original<typeof ApiClient>()),
  internalApi: { patch },
}));

const { StatusActions } =
  await import("@/features/applications/components/status-actions");

function renderActions(status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED") {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <StatusActions
        type="visa"
        id="v1"
        status={status}
        reference="WP-V-1"
        applicantName="Ada Okafor"
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => patch.mockReset());

describe("StatusActions", () => {
  it("offers only the moves the workflow allows", () => {
    renderActions("UNDER_REVIEW");

    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Start review" }),
    ).not.toBeInTheDocument();
  });

  it("says a decided file is final instead of offering a stage picker", () => {
    renderActions("APPROVED");

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/final/)).toBeInTheDocument();
  });

  it("won't reject without a reason the applicant can read", async () => {
    patch.mockResolvedValue({ data: { id: "v1", status: "REJECTED" } });
    renderActions("UNDER_REVIEW");

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    const confirm = await screen.findByRole("button", { name: "Reject and email" });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: "The bank statement is older than six months" },
    });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith("/admin/applications/v1", {
        status: "REJECTED",
        rejectionReason: "The bank statement is older than six months",
        verificationNotes: undefined,
      }),
    );
  });

  it("asks before approving, because it emails the applicant", async () => {
    renderActions("UNDER_REVIEW");

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(
      await screen.findByText("Approve Ada Okafor's application?"),
    ).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalled();
  });
});
