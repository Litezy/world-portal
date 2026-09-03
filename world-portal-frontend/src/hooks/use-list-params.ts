"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { ListParams } from "@/types";

/**
 * List state (search, filter, page) lives in the URL so a filtered view can be
 * shared, refreshed and navigated back to.
 */
export function useListParams(defaults: Pick<ListParams, "perPage"> = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params: ListParams = {
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    page: Number(searchParams.get("page") ?? 1),
    perPage: defaults.perPage ?? 10,
  };

  const set = React.useCallback(
    (patch: Partial<ListParams> & Record<string, string | number | undefined | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "" || value === null) next.delete(key);
        else next.set(key, String(value));
      }
      // Any change to the query resets pagination unless the page itself moved.
      if (!("page" in patch)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );


  return { params, set };
}
