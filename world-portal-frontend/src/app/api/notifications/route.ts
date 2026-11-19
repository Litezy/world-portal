import { NextResponse } from "next/server";

import { z } from "zod";

import { getAgencySession } from "@/app/api/agency/_session";
import { backend } from "@/server/api/backend";
import { applicantBackend } from "@/server/applicant/backend";
import { getSession } from "@/server/auth";
import { backendErrorResponse } from "@/server/http";

/**
 * The notification bell, for whichever console the caller is in.
 *
 * **The inbox comes from the caller's own session, never from the request.**
 * A recipient id is an applicant's email or an agency id — both guessable — so
 * any `recipientId` in the query string or body is ignored. `audience` only
 * picks which session to read, and each branch reads only its own:
 *
 * - `agency` — the agency cookie's `agencyId`, sent with this server's key;
 * - `admin` — the console member's email, sent with this server's key;
 * - `applicant` — the WorldStreet session token, forwarded to `/me/notifications`,
 *   where the API reads the applicant's verified email itself.
 *
 * Without the matching session the answer is a 401 and the API is not called.
 */

const audienceSchema = z.enum(["applicant", "agency", "admin"]);
type Audience = z.infer<typeof audienceSchema>;

const listQuerySchema = z.object({
  audience: audienceSchema,
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** Notification ids are UUIDs; nothing that could re-route the API path. */
const notificationId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

const patchSchema = z.union([
  z.object({ audience: audienceSchema, readAll: z.literal(true) }),
  z.object({ audience: audienceSchema, id: notificationId }),
]);

type Inbox = { kind: "me" } | { kind: "recipient"; recipientId: string };

const signIn = () =>
  NextResponse.json({ message: "Sign in to continue" }, { status: 401 });

/** The caller's own inbox for `audience`, or null without that session. */
async function inboxFor(audience: Audience): Promise<Inbox | null> {
  switch (audience) {
    case "agency": {
      const session = await getAgencySession();
      return session ? { kind: "recipient", recipientId: session.agencyId } : null;
    }
    case "admin": {
      const session = await getSession();
      return session ? { kind: "recipient", recipientId: session.email } : null;
    }
    case "applicant":
      // applicantBackend() refuses with a 401 when there is no WorldStreet session.
      return { kind: "me" };
  }
}

const recipientPath = (recipientId: string) =>
  encodeURIComponent(recipientId.trim().toLowerCase());

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listQuerySchema.safeParse({
    audience: url.searchParams.get("audience") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ message: "Say which inbox to read." }, { status: 400 });
  }
  const { audience, limit } = parsed.data;

  try {
    const inbox = await inboxFor(audience);
    if (!inbox) return signIn();

    const result =
      inbox.kind === "me"
        ? await applicantBackend<unknown>("/me/notifications", { query: { limit } })
        : await backend<unknown>(`/notifications/${recipientPath(inbox.recipientId)}`, {
            service: true,
            query: { limit },
          });
    return NextResponse.json(result ?? { data: [], unreadCount: 0 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const payload: unknown = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Say which notification to mark as read." },
      { status: 422 },
    );
  }
  const body = parsed.data;

  try {
    const inbox = await inboxFor(body.audience);
    if (!inbox) return signIn();

    let result: unknown;
    if ("readAll" in body) {
      result =
        inbox.kind === "me"
          ? await applicantBackend("/me/notifications/read-all", { method: "PATCH" })
          : await backend(
              `/notifications/recipient/${recipientPath(inbox.recipientId)}/read-all`,
              { method: "PATCH", service: true },
            );
    } else {
      const id = encodeURIComponent(body.id);
      result =
        inbox.kind === "me"
          ? await applicantBackend(`/me/notifications/${id}/read`, { method: "PATCH" })
          : await backend(`/notifications/${id}/read`, {
              method: "PATCH",
              service: true,
              // The API checks the notification belongs to this recipient.
              body: JSON.stringify({ recipientId: inbox.recipientId }),
            });
    }
    return NextResponse.json(result ?? { success: true });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
