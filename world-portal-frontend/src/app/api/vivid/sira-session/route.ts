import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { hasVividAccess } from "@/server/vivid/access";
import { createSiraSession, siraConfigured, SiraError } from "@/server/vivid/sira";
import {
  buildVividVoiceInstructions,
  vividVoiceTools,
} from "@/server/vivid/voice-instructions";

export const runtime = "nodejs";

const MAX_FIELD = 200;

/**
 * Session gate for Vivid's voice engine (Sira).
 *
 * Sira authenticates callers with one shared API key, which must never reach
 * the browser. So the browser asks here: this route checks the caller has a
 * WorldStreet session and Vivid access (`server/vivid/access.ts`), mints a
 * session with the key — sending Vivid's persona and tool list along — and
 * hands back only what the browser needs to open the stream: a single-use
 * token that expires in a minute, the audio formats and the session's clock.
 *
 * The voice is fixed server-side (DEFAULT_SIRA_VOICE), and the vendor's own
 * fields (provider, model, voice) are dropped from the reply.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let stage = "access";
  try {
    if (!(await hasVividAccess(userId))) {
      return NextResponse.json(
        { error: "Vivid access required", code: "vivid_locked" },
        { status: 402 },
      );
    }

    stage = "config";
    if (!siraConfigured()) {
      return NextResponse.json(
        { error: "sira_unconfigured", stage, detail: "SIRA_API_KEY is not set" },
        { status: 503 },
      );
    }

    stage = "mint";
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const str = (v: unknown) =>
      typeof v === "string" && v.length <= MAX_FIELD ? v : undefined;
    const session = await createSiraSession({
      instructions: buildVividVoiceInstructions({
        pathname: str(body?.pathname),
        userName: str(body?.userName),
        userLastName: str(body?.userLastName),
      }),
      tools: vividVoiceTools(),
    });
    console.info(`[vivid/sira-session] minted ${session.id} for ${userId}`);
    return NextResponse.json(
      {
        id: session.id,
        stream_url: session.stream_url,
        token: session.token,
        connect_within_seconds: session.connect_within_seconds,
        max_session_seconds: session.max_session_seconds,
        input_audio: session.input_audio,
        output_audio: session.output_audio,
      },
      { status: 201 },
    );
  } catch (err) {
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[vivid/sira-session] ${stage} failed for ${userId}:`, err);
    // Sira's own status codes (a bad key is a 401 from Sira) must not read as
    // "you are signed out" in the browser — collapse them to 502.
    const status = err instanceof SiraError && err.status === 503 ? 503 : 502;
    return NextResponse.json(
      { error: "session_mint_failed", stage, detail },
      { status },
    );
  }
}
