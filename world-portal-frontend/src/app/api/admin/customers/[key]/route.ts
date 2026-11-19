import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import type {
  BackendPassportApplication,
  BackendVisaApplication,
} from "@/server/data/backend-types";
import { customerKey, isCustomerKey } from "@/server/data/customer-key";
import {
  toCustomers,
  toPassportApplication,
  toVisaApplication,
} from "@/server/data/mappers";
import { backendErrorResponse } from "@/server/http";
import type { CustomerDetail } from "@/types";

const notFound = () =>
  NextResponse.json({ message: "No applicant matches that link." }, { status: 404 });

/**
 * One applicant: everything they've applied for, newest first. The key is
 * an HMAC of their email (`customerKey`), so the email never sits in a URL.
 * There is no customer table, so the applications are read and matched here.
 */
export async function GET(_: Request, ctx: RouteContext<"/api/admin/customers/[key]">) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { key } = await ctx.params;
  if (!isCustomerKey(key)) return notFound();

  try {
    const [visas, passports] = await Promise.all([
      backend<BackendVisaApplication[]>("/visa-documentation", {
        token: session.token,
      }),
      backend<BackendPassportApplication[]>("/passport-application", {
        token: session.token,
      }),
    ]);

    const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) =>
      b.createdAt.localeCompare(a.createdAt);
    const theirVisas = visas
      .filter((v) => customerKey(v.email) === key)
      .map(toVisaApplication)
      .sort(newestFirst);
    const theirPassports = passports
      .filter((p) => customerKey(p.email) === key)
      .map(toPassportApplication)
      .sort(newestFirst);

    const [customer] = toCustomers(theirVisas, theirPassports);
    if (!customer) return notFound();

    const detail: CustomerDetail = {
      customer,
      visas: theirVisas,
      passports: theirPassports,
    };
    return NextResponse.json({ data: detail });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
