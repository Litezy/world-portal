import { paginate } from "@/server/http";

type Page<T> = {
  data: T[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
};

/**
 * Page a store result for the wire.
 *
 * The store filters (search, status) and this pages — the same split the admin
 * console uses, via `paginate()` in `src/server/http.ts`. It also accepts a
 * store method that already returns a page, so the two sides of the seam can
 * be written independently without one of them silently paging twice.
 */
export function pageOf<T>(
  result: T[] | Page<T>,
  page: number,
  perPage: number,
): Page<T> {
  return Array.isArray(result) ? paginate(result, page, perPage) : result;
}
