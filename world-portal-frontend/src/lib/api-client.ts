import axios, { type AxiosError, type AxiosInstance } from "axios";

import { env } from "@/config/env";

export type FieldErrors = Record<string, string[]>;

/**
 * What the API actually returns. Every success is wrapped by the backend's
 * TransformInterceptor; every failure is shaped by its AllExceptionsFilter.
 */
type NestErrorBody = {
  success?: false;
  statusCode?: number;
  message?: string | string[];
  errors?: FieldErrors;
  error?: string;
};

type Wrapped<T> = { success: true; data: T };

function isWrapped<T>(body: unknown): body is Wrapped<T> {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as { success?: unknown }).success === true &&
    "data" in body
  );
}

/**
 * The API wraps every 2xx body as `{ success: true, data }`. Callers want the
 * payload, so unwrap here — once — rather than in every hook. Anything not
 * wrapped (a plain proxy, a future endpoint) passes straight through.
 */
export function unwrap<T>(body: unknown): T {
  return isWrapped<T>(body) ? body.data : (body as T);
}

/** Normalised error every caller can rely on, whatever the transport did. */
export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly errors?: FieldErrors;

  constructor(init: {
    message: string;
    status?: number;
    code?: string;
    errors?: FieldErrors;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.errors = init.errors;
  }

  /** Render these inline on the form rather than as a toast. */
  get isValidation() {
    return Boolean(this.errors) || this.status === 422;
  }

  get isUnauthorized() {
    return this.status === 401 || this.status === 403;
  }

  /** The tunnel is down, or the device is offline. Worth saying so plainly. */
  get isNetwork() {
    return this.status === undefined;
  }
}

/**
 * Turn class-validator's flat message list into per-field errors.
 *
 * The API has no exception filter, so DTO validation failures come back as
 * `400` with `message` as a string array and no `errors` object — meaning a
 * naive client would render "email must be an email,firstName should not be
 * empty" as one garbled sentence and never light up the offending fields.
 * class-validator prefixes each message with the property name, which is
 * enough to reconstruct the mapping.
 */
export function parseValidationMessages(messages: string[]): FieldErrors {
  const errors: FieldErrors = {};

  for (const raw of messages) {
    const message = raw.trim();
    // `forbidNonWhitelisted` produces "property foo should not exist".
    const forbidden = message.match(/^property (\w+) should not exist$/);
    const field = forbidden ? forbidden[1] : message.match(/^([A-Za-z0-9_]+)\b/)?.[1];
    if (!field) continue;

    (errors[field] ??= []).push(
      // Sentence-case the message once its field prefix has done its job.
      message.charAt(0).toUpperCase() + message.slice(1),
    );
  }

  return errors;
}

/**
 * Without NEXT_PUBLIC_API_URL every call falls back to a relative `/api`,
 * which hits this Next app rather than the World Portal backend and 404s in a
 * way that looks like a bug in the form. Say so once, loudly, at startup.
 */
if (!env.NEXT_PUBLIC_API_URL && typeof window !== "undefined") {
  console.warn(
    "[world-portal] NEXT_PUBLIC_API_URL is not set — API calls will fall back " +
      "to a relative /api path and fail. Copy .env.example to .env.local and " +
      "set the current backend URL (the Cloudflare tunnel host changes on every restart).",
  );
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL ?? "/api",
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
  // Harmless today (auth is a Bearer header, not a cookie) but the API sets
  // `credentials: true`, so this is ready for cookie auth later.
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  // Let the browser set the multipart boundary for FormData bodies.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  // Auth token attaches here once a real login flow exists. Every endpoint the
  // public applicant flow touches is unauthenticated by design.
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<NestErrorBody>) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const status = error.response?.status;
    const body = error.response?.data;
    const raw = body?.message;

    // The current API sends a real field map on 422 ("Validation failed").
    // Prefer it over reconstructing anything from prose.
    if (body?.errors && Object.keys(body.errors).length > 0) {
      const count = Object.keys(body.errors).length;
      return Promise.reject(
        new ApiError({
          message:
            count === 1
              ? (Object.values(body.errors)[0]?.[0] ??
                "Please check the highlighted field.")
              : `${count} fields need attention before this can be submitted.`,
          status,
          code: body?.error,
          errors: body.errors,
        }),
      );
    }

    // Older builds sent a flat string array on a 400 with no `errors` object.
    if (Array.isArray(raw) && raw.length > 0) {
      const errors = parseValidationMessages(raw);
      return Promise.reject(
        new ApiError({
          message:
            raw.length === 1
              ? raw[0]
              : `${raw.length} fields need attention before this can be submitted.`,
          status,
          code: body?.error,
          errors: Object.keys(errors).length > 0 ? errors : undefined,
        }),
      );
    }

    const message =
      (typeof raw === "string" && raw) ||
      (error.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : undefined) ||
      (status === undefined
        ? "Could not reach the World Portal service. It may be offline — please try again shortly."
        : undefined) ||
      error.message ||
      "Something went wrong. Please try again.";

    return Promise.reject(
      new ApiError({ message, status, code: body?.error ?? error.code }),
    );
  },
);

/** Thin typed wrappers so call sites never touch `AxiosResponse`. */
export const api = {
  get: <T>(url: string, config?: Parameters<AxiosInstance["get"]>[1]) =>
    apiClient.get(url, config).then((r) => unwrap<T>(r.data)),
  post: <T>(
    url: string,
    body?: unknown,
    config?: Parameters<AxiosInstance["post"]>[2],
  ) => apiClient.post(url, body, config).then((r) => unwrap<T>(r.data)),
  patch: <T>(
    url: string,
    body?: unknown,
    config?: Parameters<AxiosInstance["patch"]>[2],
  ) => apiClient.patch(url, body, config).then((r) => unwrap<T>(r.data)),
  delete: <T>(url: string, config?: Parameters<AxiosInstance["delete"]>[1]) =>
    apiClient.delete(url, config).then((r) => unwrap<T>(r.data)),
};

/* ---------------------------------------------------------------------------
 * The console talks to this Next app, not the World Portal backend.
 * ------------------------------------------------------------------------- */

type InternalErrorBody = { message?: string; code?: string; errors?: FieldErrors };

/**
 * Same-origin client for the route handlers under `src/app/api`.
 *
 * Deliberately not `NEXT_PUBLIC_API_URL`: those handlers live in this app, so
 * pointing them at the backend origin would 404 every console screen the
 * moment the tunnel URL is set. It also speaks the internal error shape —
 * a 422 with an `errors` object — rather than NestJS's message array.
 */
export const internalClient: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

internalClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<InternalErrorBody>) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const body = error.response?.data;
    return Promise.reject(
      new ApiError({
        message:
          body?.message ?? error.message ?? "Something went wrong. Please try again.",
        status: error.response?.status,
        code: body?.code ?? error.code,
        errors: body?.errors,
      }),
    );
  },
);

export const internalApi = {
  get: <T>(url: string, config?: Parameters<AxiosInstance["get"]>[1]) =>
    internalClient.get<T>(url, config).then((r) => r.data),
  post: <T>(
    url: string,
    body?: unknown,
    config?: Parameters<AxiosInstance["post"]>[2],
  ) => internalClient.post<T>(url, body, config).then((r) => r.data),
  patch: <T>(
    url: string,
    body?: unknown,
    config?: Parameters<AxiosInstance["patch"]>[2],
  ) => internalClient.patch<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: Parameters<AxiosInstance["delete"]>[1]) =>
    internalClient.delete<T>(url, config).then((r) => r.data),
};
