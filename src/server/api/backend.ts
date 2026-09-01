import { serverEnv } from "@/config/env";

export class BackendError extends Error {
  readonly status: number;
  readonly errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "BackendError";
    this.status = status;
    this.errors = errors;
  }
}

type Envelope<T> = { success?: boolean; data?: T };

function baseUrl() {
  const url = serverEnv().WORLD_PORTAL_API_URL;
  return url.replace(/\/$/, "");
}

/**
 * Server-side caller for the World Portal API.
 *
 * The console never talks to it from the browser: the access token lives in an
 * httpOnly cookie, so every call is proxied through a route handler. Responses
 * are unwrapped here — the service wraps each 2xx as `{ success, data }`.
 */
export async function backend<T>(
  path: string,
  init: RequestInit & { token?: string | null; query?: Record<string, unknown> } = {},
): Promise<T> {
  const { token, query, headers, ...rest } = init;

  const url = new URL(`${baseUrl()}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new BackendError(
      "Could not reach the E-Embassy service. It may be offline.",
      503,
    );
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const shape = body as {
      message?: string | string[];
      errors?: Record<string, string[]>;
    } | null;
    const message = Array.isArray(shape?.message)
      ? shape.message.join(", ")
      : (shape?.message ?? `Request failed with status ${response.status}`);
    throw new BackendError(message, response.status, shape?.errors);
  }

  const envelope = body as Envelope<T> | null;
  return (
    envelope && typeof envelope === "object" && "data" in envelope
      ? envelope.data
      : envelope
  ) as T;
}
