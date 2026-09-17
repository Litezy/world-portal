"use client";

import * as React from "react";

import { Search, Users } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Professional,
  professionalCities,
  professionLabels,
  professions,
  unifiedDisplayCategories,
} from "@/content/professionals";
import { type BasketItem, useBasketStore } from "@/features/basket/store";
import { ProCard } from "@/features/hire/components/pro-card";
import { ProModal } from "@/features/hire/components/pro-modal";
import { useDebounce } from "@/hooks/use-debounce";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

const ALL = "all";

/** One professional, as a basket line. Keeps the id shape in one place. */
export function toBasketItem(pro: Professional): BasketItem {
  return {
    id: `pro:${pro.id}`,
    type: "pro",
    title: `${pro.name} · ${professionLabels[pro.profession]}`,
    subtitle: `${pro.unit} · ${pro.city}`,
    city: pro.city,
    price: pro.price,
    currency: pro.currency,
    unit: pro.unit,
    href: "/hire",
  };
}

function ProCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card shadow-card animate-pulse">
      <div className="flex flex-1 flex-col items-stretch justify-start p-5">
        <div className="flex items-start gap-3.5">
          <Skeleton shape="block" className="size-14 rounded-xl shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Skeleton shape="text" className="h-4 w-32" />
              <Skeleton shape="text" className="h-4 w-10" />
            </div>
            <Skeleton shape="text" className="h-3.5 w-full" />
            <Skeleton shape="text" className="h-3.5 w-3/4" />
            <div className="mt-3 flex items-center gap-2">
              <Skeleton shape="pill" className="h-6 w-20" />
              <Skeleton shape="pill" className="h-6 w-16" />
            </div>
            <Skeleton shape="text" className="mt-2 h-3 w-28" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border p-5">
        <div className="space-y-1">
          <Skeleton shape="text" className="h-5 w-16" />
          <Skeleton shape="text" className="h-3 w-12" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton shape="block" className="h-8 w-16 rounded-lg" />
          <Skeleton shape="block" className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function HireBrowser() {
  const [profession, setProfession] = React.useState<string>(ALL);
  const [city, setCity] = React.useState<string>(ALL);
  const [query, setQuery] = React.useState("");
  const [openPro, setOpenPro] = React.useState<Professional | null>(null);
  const [proList, setProList] = React.useState<Professional[]>([]);
  const [loading, setLoading] = React.useState(true);

  const debouncedQuery = useDebounce(query, 250);
  const toggle = useBasketStore((s) => s.toggle);
  const items = useBasketStore((s) => s.items);
  const mounted = useMounted();

  React.useEffect(() => {
    let active = true;
    setLoading(true);

    const params = new URLSearchParams();
    if (profession && profession !== ALL) params.set("category", profession);
    if (city && city !== ALL) params.set("city", city);
    if (debouncedQuery) params.set("search", debouncedQuery);

    const queryString = params.toString();
    const endpoint = `/api/hire/professionals${queryString ? `?${queryString}` : ""}`;

    fetch(endpoint)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) {
          setProList(data);
        }
      })
      .catch(() => {
        if (active) setProList([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [profession, city, debouncedQuery]);

  const inBasket = React.useCallback(
    (pro: Professional) => mounted && items.some((i) => i.id === `pro:${pro.id}`),
    [items, mounted],
  );

  return (
    <div>
      <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)]">
        <label className="sr-only" htmlFor="hire-profession">
          Category
        </label>
        <Select value={profession} onValueChange={setProfession}>
          <SelectTrigger id="hire-profession" size="lg">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {unifiedDisplayCategories.map((p) => (
              <SelectItem key={p} value={p}>
                {professionLabels[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="sr-only" htmlFor="hire-city">
          City
        </label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger id="hire-city" size="lg">
            <SelectValue placeholder="Any city" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any city</SelectItem>
            {professionalCities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="sr-only" htmlFor="hire-search">
          Search professionals
        </label>
        <Input
          id="hire-search"
          size="lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search names, skills, cities…"
          leftIcon={<Search />}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[ALL, ...unifiedDisplayCategories].map((value) => {
          const active = profession === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setProfession(value)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-ink-800 hover:border-primary/50 hover:bg-primary/8",
              )}
            >
              {value === ALL ? "All" : professionLabels[value as never]}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="mt-6 space-y-6">
          <p className="flex items-center gap-2 text-[13px] text-muted-foreground animate-pulse">
            <Users className="size-4 opacity-50" />
            <span>Loading professionals…</span>
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <p className="mt-6 flex items-center gap-2 text-[13px] text-muted-foreground">
            <Users className="size-4" />
            <span aria-live="polite">
              {proList.length} professional{proList.length === 1 ? "" : "s"} available
            </span>
          </p>

          {proList.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon={Search}
              title="Nobody matches that yet"
              description="Try a different profession or city — we are adding vetted professionals in new destinations every month."
            />
          ) : (
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {proList.map((pro) => (
                <li key={pro.id}>
                  <ProCard
                    pro={pro}
                    inBasket={inBasket(pro)}
                    onOpen={() => setOpenPro(pro)}
                    onToggle={() => toggle(toBasketItem(pro))}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ProModal
        pro={openPro}
        open={Boolean(openPro)}
        inBasket={openPro ? inBasket(openPro) : false}
        onOpenChange={(next) => !next && setOpenPro(null)}
        onToggle={() => openPro && toggle(toBasketItem(openPro))}
      />

      {/* Announced when the basket changes, for anyone not watching the header. */}
      <span className="sr-only" role="status" aria-live="polite">
        {mounted
          ? `${items.length} item${items.length === 1 ? "" : "s"} in your basket`
          : ""}
      </span>
    </div>
  );
}
