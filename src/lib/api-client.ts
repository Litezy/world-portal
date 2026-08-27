import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { env } from "@/config/env";

export type ApiErrorShape = {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
};

/** Normalised error every caller can rely on, regardless of transport failure mode. */
export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly errors?: Record<string, string[]>;

  constructor({ message, status, code, errors }: ApiErrorShape) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }

  /** Validation failures should render inline on the form, not as a toast. */
  get isValidation() {
    return this.status === 422 || Boolean(this.errors);
  }

  get isUnauthorized() {
    return this.status === 401 || this.status === 403;
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL ?? "/api",
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Attach auth here once the backend contract is known, e.g.
  // config.headers.Authorization = `Bearer ${token}`
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorShape>) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const data = error.response?.data;
    return Promise.reject(
      new ApiError({
        message:
          data?.message ?? error.message ?? "Something went wrong. Please try again.",
        status: error.response?.status,
        code: data?.code ?? error.code,
        errors: data?.errors,
      }),
    );
  },
);

/** Thin typed wrappers so call sites never touch `AxiosResponse`. */
export const api = {
  get: <T>(url: string, config?: Parameters<AxiosInstance["get"]>[1]) =>
    apiClient.get<T>(url, config).then((r) => r.data),
  post: <T>(
    url: string,
    body?: unknown,
    config?: Parameters<AxiosInstance["post"]>[2],
  ) => apiClient.post<T>(url, body, config).then((r) => r.data),
  put: <T>(url: string, body?: unknown, config?: Parameters<AxiosInstance["put"]>[2]) =>
    apiClient.put<T>(url, body, config).then((r) => r.data),
  patch: <T>(
    url: string,
    body?: unknown,
    config?: Parameters<AxiosInstance["patch"]>[2],
  ) => apiClient.patch<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: Parameters<AxiosInstance["delete"]>[1]) =>
    apiClient.delete<T>(url, config).then((r) => r.data),
};
