import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import {
  type BackendPassportApplication,
  type BackendVisaApplication,
  toAmount,
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

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const [visaRecords, passportRecords, rawTx] = await Promise.all([
      backend<BackendVisaApplication[]>("/visa-documentation", {
        token: session.token,
      }).catch(() => []),
      backend<BackendPassportApplication[]>("/passport-application", {
        token: session.token,
      }).catch(() => []),
      backend<any[]>("/payments/transactions", {
        token: session.token,
      }).catch(() => []),
    ]);

    const visas = (visaRecords || []).map(toVisaApplication);
    const passports = (passportRecords || []).map(toPassportApplication);
    const allApps = [...visas, ...passports];

    const revenueByCurrency: Record<string, number> = {};
    const outstandingByCurrency: Record<string, number> = {};

    (rawTx || []).forEach((t) => {
      const cur = t.currency || t.visaDocumentation?.currency || t.passportApplication?.currency || "NGN";
      const amt = toAmount(t.amount);
      if (t.status === "CONFIRMED") {
        revenueByCurrency[cur] = (revenueByCurrency[cur] || 0) + amt;
      }
    });

    allApps.forEach((app) => {
      const cur = app.currency || "NGN";
      if (app.balanceDue > 0) {
        outstandingByCurrency[cur] = (outstandingByCurrency[cur] || 0) + app.balanceDue;
      }
    });

    if (Object.keys(revenueByCurrency).length === 0) {
      allApps.forEach((app) => {
        const cur = app.currency || "NGN";
        if (app.amountPaid > 0) {
          revenueByCurrency[cur] = (revenueByCurrency[cur] || 0) + app.amountPaid;
        }
      });
    }

    const primaryCurrency = allApps.find((app) => app.currency)?.currency || "NGN";
    const totalCollected = Object.values(revenueByCurrency).reduce((sum, amt) => sum + amt, 0);
    const totalOutstanding = Object.values(outstandingByCurrency).reduce((sum, amt) => sum + amt, 0);

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
        collected: totalCollected,
        outstanding: totalOutstanding,
        currency: primaryCurrency,
        revenueByCurrency,
        outstandingByCurrency,
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
