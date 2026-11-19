import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import type { BackendPassportApplication } from "@/server/data/backend-types";
import { byDate, byText, listResponse } from "@/server/data/list";
import { toPassportApplication } from "@/server/data/mappers";
import { backendErrorResponse, readListParams } from "@/server/http";
import type { PassportApplication } from "@/types";

const spec = {
  statusOf: (p: PassportApplication) => p.status,
  dateOf: (p: PassportApplication) => p.createdAt,
  sorters: {
    applicant: byText((p: PassportApplication) => p.applicant.name),
    category: byText((p: PassportApplication) => p.category),
    status: byText((p: PassportApplication) => p.status),
    submitted: byDate((p: PassportApplication) => p.createdAt),
  },
  defaultSort: { key: "submitted", dir: "desc" as const },
  csv: {
    filename: "passport-applications",
    columns: [
      { header: "Reference", value: (p: PassportApplication) => p.reference },
      { header: "Applicant", value: (p: PassportApplication) => p.applicant.name },
      { header: "Email", value: (p: PassportApplication) => p.applicant.email },
      { header: "Category", value: (p: PassportApplication) => p.category },
      { header: "Booklet", value: (p: PassportApplication) => p.bookletType },
      { header: "Validity", value: (p: PassportApplication) => p.validity },
      { header: "Stage", value: (p: PassportApplication) => p.status },
      { header: "Payment", value: (p: PassportApplication) => p.paymentStatus },
      { header: "Submitted", value: (p: PassportApplication) => p.createdAt },
    ],
  },
};

export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { params, response: invalid } = readListParams(request);
  if (invalid) return invalid;

  try {
    const records = await backend<BackendPassportApplication[]>(
      "/passport-application",
      {
        token: session.token,
        query: { search: params.q },
      },
    );
    return listResponse(records.map(toPassportApplication), params, spec);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
