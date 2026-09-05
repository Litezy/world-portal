import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import {
  type BackendPassportApplication,
  type BackendVisaApplication,
  visaCategoryValues,
  visaStatusValues,
} from "@/server/data/backend-types";
import {
  toCustomers,
  toPassportApplication,
  toVisaApplication,
} from "@/server/data/mappers";
import { backendErrorResponse } from "@/server/http";
import type { DashboardStats } from "@/types";

const ACTIVE_VISA = ["SUBMITTED", "EVALUATED", "UNDER_REVIEW"];
const ACTIVE_PASSPORT = ["SUBMITTED", "UNDER_REVIEW"];
const DAY = 86_400_000;

/**
 * The service exposes no stats endpoint, so the console derives them from the
 * collections it can already read. Cheap today; swap for a real summary
 * endpoint when the volume makes two list calls per load wasteful.
 */
export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const [visaRecords, passportRecords] = await Promise.all([
      backend<BackendVisaApplication[]>("/visa-documentation", {
        token: session.token,
      }),
      backend<BackendPassportApplication[]>("/passport-application", {
        token: session.token,
      }),
    ]);

    const visas = visaRecords.map(toVisaApplication);
    const passports = passportRecords.map(toPassportApplication);

    const now = Date.now();
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(now - (6 - i) * DAY);
      start.setHours(0, 0, 0, 0);
      const end = start.getTime() + DAY;
      const inDay = (iso: string) => {
        const at = Date.parse(iso);
        return at >= start.getTime() && at < end;
      };
      return {
        label: start.toLocaleDateString("en-US", { weekday: "short" }),
        visas: visas.filter((v) => inDay(v.createdAt)).length,
        passports: passports.filter((p) => inDay(p.createdAt)).length,
      };
    });

    const stats: DashboardStats = {
      visas: {
        total: visas.length,
        active: visas.filter((v) => ACTIVE_VISA.includes(v.status)).length,
        approved: visas.filter((v) => v.status === "APPROVED").length,
      },
      passports: {
        total: passports.length,
        active: passports.filter((p) => ACTIVE_PASSPORT.includes(p.status)).length,
      },
      customers: { total: toCustomers(visas, passports).length },
      revenue: {
        collected: visas.reduce((sum, v) => sum + v.amountPaid, 0),
        outstanding: visas.reduce((sum, v) => sum + v.balanceDue, 0),
        currency: visas.find((v) => v.currency)?.currency || "NGN",
      },
      visaPipeline: visaStatusValues.map((status) => ({
        status,
        count: visas.filter((v) => v.status === status).length,
      })),
      visasByCategory: visaCategoryValues.map((category) => ({
        category,
        count: visas.filter((v) => v.category === category).length,
      })),
      weekly,
    };

    return NextResponse.json({
      data: { stats, recent: visas.slice(0, 5) },
    });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
