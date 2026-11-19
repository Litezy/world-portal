import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import type { BackendVisaApplication } from "@/server/data/backend-types";
import { byDate, byNumber, byText, listResponse } from "@/server/data/list";
import { toVisaApplication } from "@/server/data/mappers";
import { backendErrorResponse, readListParams } from "@/server/http";
import type { VisaApplication } from "@/types";

const spec = {
  statusOf: (v: VisaApplication) => v.status,
  dateOf: (v: VisaApplication) => v.createdAt,
  sorters: {
    applicant: byText((v: VisaApplication) => v.applicant.name),
    destination: byText((v: VisaApplication) => v.destination),
    status: byText((v: VisaApplication) => v.status),
    balance: byNumber((v: VisaApplication) => v.balanceDue),
    submitted: byDate((v: VisaApplication) => v.createdAt),
  },
  defaultSort: { key: "submitted", dir: "desc" as const },
  csv: {
    filename: "visa-applications",
    columns: [
      { header: "Reference", value: (v: VisaApplication) => v.reference },
      { header: "Applicant", value: (v: VisaApplication) => v.applicant.name },
      { header: "Email", value: (v: VisaApplication) => v.applicant.email },
      { header: "Destination", value: (v: VisaApplication) => v.destination },
      { header: "Category", value: (v: VisaApplication) => v.category },
      { header: "Stage", value: (v: VisaApplication) => v.status },
      { header: "Payment", value: (v: VisaApplication) => v.paymentStatus },
      { header: "Currency", value: (v: VisaApplication) => v.currency },
      { header: "Total", value: (v: VisaApplication) => v.totalAmount },
      { header: "Paid", value: (v: VisaApplication) => v.amountPaid },
      { header: "Balance", value: (v: VisaApplication) => v.balanceDue },
      { header: "Submitted", value: (v: VisaApplication) => v.createdAt },
    ],
  },
};

export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { params, response: invalid } = readListParams(request);
  if (invalid) return invalid;

  try {
    // Search is the service's own filter. Status is applied here, after the
    // tab counts are taken, so every tab shows its true count.
    const records = await backend<BackendVisaApplication[]>("/visa-documentation", {
      token: session.token,
      query: { search: params.q },
    });
    return listResponse(records.map(toVisaApplication), params, spec);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
