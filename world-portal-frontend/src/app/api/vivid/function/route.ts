import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { hasVividAccess } from "@/server/vivid/access";
import { serverFunctions } from "@/server/vivid/functions.server";

export const runtime = "nodejs";

/**
 * Runs Vivid's server-side tools. The browser's tool bridge
 * (features/vivid/components/sira-provider.tsx) posts { name, args } here for
 * any tool whose executionContext is "server"; the answer is
 * { success, result | error }, exactly what the bridge hands back to the model.
 *
 * Tools act as the applicant: their WorldStreet session token is minted here
 * and passed to the tool, which forwards it to the World Portal API — so the
 * API scopes every read to them. It never leaves the server.
 */
export async function POST(request: Request) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  if (!(await hasVividAccess(userId))) {
    return NextResponse.json(
      { success: false, error: "Vivid access required" },
      { status: 402 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    args?: Record<string, unknown>;
  } | null;
  const fn = serverFunctions.find((f) => f.name === body?.name);
  if (!fn) {
    return NextResponse.json(
      { success: false, error: `Unknown function: ${body?.name}` },
      { status: 404 },
    );
  }
  try {
    const token = (await getToken()) ?? null;
    const result = await fn.handler({ ...(body?.args ?? {}), userId, token });
    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Function failed" },
      { status: 500 },
    );
  }
}
