import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import type {
  BackendPassportApplication,
  BackendVisaApplication,
} from "@/server/data/backend-types";
import { byDate, byNumber, byText, listResponse } from "@/server/data/list";
import {
  toCustomers,
  toPassportApplication,
  toVisaApplication,
} from "@/server/data/mappers";
import { backendErrorResponse, readListParams } from "@/server/http";
import type { Customer } from "@/types";

const spec = {
  dateOf: (c: Customer) => c.lastActiveAt,
  sorters: {
    name: byText((c: Customer) => c.name),
    country: byText((c: Customer) => c.country),
    applications: byNumber((c: Customer) => c.applications),
    lastActive: byDate((c: Customer) => c.lastActiveAt),
  },
  defaultSort: { key: "lastActive", dir: "desc" as const },
  csv: {
    filename: "applicants",
    columns: [
      { header: "Name", value: (c: Customer) => c.name },
      { header: "Email", value: (c: Customer) => c.email },
      { header: "Phone", value: (c: Customer) => c.phone },
      { header: "Country", value: (c: Customer) => c.country },
      { header: "Applications", value: (c: Customer) => c.applications },
      {
        header: "Paid",
        value: (c: Customer) =>
          Object.entries(c.paidByCurrency)
            .map(([currency, amount]) => `${currency} ${amount}`)
            .join("; "),
      },
      { header: "First seen", value: (c: Customer) => c.createdAt },
      { header: "Last active", value: (c: Customer) => c.lastActiveAt },
    ],
  },
};

export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { params, response: invalid } = readListParams(request);
  if (invalid) return invalid;

  try {
    // No customer table exists — applicants are derived from their applications.
    const [visas, passports] = await Promise.all([
      backend<BackendVisaApplication[]>("/visa-documentation", {
        token: session.token,
      }),
      backend<BackendPassportApplication[]>("/passport-application", {
        token: session.token,
      }),
    ]);

    const needle = params.q?.toLowerCase();
    const customers = toCustomers(
      visas.map(toVisaApplication),
      passports.map(toPassportApplication),
    ).filter(
      (customer) =>
        !needle ||
        customer.name.toLowerCase().includes(needle) ||
        customer.email.toLowerCase().includes(needle),
    );

    return listResponse(customers, params, spec);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
