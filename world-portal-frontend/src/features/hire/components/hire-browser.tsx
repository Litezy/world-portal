"use client";

import * as React from "react";

import { Search, Users } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
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
  professionals,
  professionLabels,
  professions,
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
    unit: pro.unit,
    href: "/hire",
  };
}

/** Name, tagline, profession, city, languages and skills are all searchable. */
function matches(pro: Professional, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    pro.name,
    pro.tagline,
    professionLabels[pro.profession],
    pro.city,
    pro.country,
    ...pro.languages,
    ...pro.skills,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function HireBrowser() {
  const [profession, setProfession] = React.useState<string>(ALL);
  const [city, setCity] = React.useState<string>(ALL);
  const [query, setQuery] = React.useState("");
  const [openPro, setOpenPro] = React.useState<Professional | null>(null);

  const debouncedQuery = useDebounce(query, 200);
  const toggle = useBasketStore((s) => s.toggle);
  const items = useBasketStore((s) => s.items);
  const mounted = useMounted();

  const inBasket = React.useCallback(
    (pro: Professional) => mounted && items.some((i) => i.id === `pro:${pro.id}`),
    [items, mounted],
  );

  const results = React.useMemo(
    () =>
      professionals
        .filter((p) => profession === ALL || p.profession === profession)
        .filter((p) => city === ALL || p.city === city)
        .filter((p) => matches(p, debouncedQuery)),
    [profession, city, debouncedQuery],
  );

  return (
    <div>
      <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)]">
        <label className="sr-only" htmlFor="hire-profession">
          Profession
        </label>
        <Select value={profession} onValueChange={setProfession}>
          <SelectTrigger id="hire-profession" size="lg">
            <SelectValue placeholder="All professionals" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All professionals</SelectItem>
            {professions.map((p) => (
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
        {[ALL, ...professions].map((value) => {
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

      <p className="mt-6 flex items-center gap-2 text-[13px] text-muted-foreground">
        <Users className="size-4" />
        <span aria-live="polite">
          {results.length} professional{results.length === 1 ? "" : "s"} available
        </span>
      </p>

      {results.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Search}
          title="Nobody matches that yet"
          description="Try a different profession or city — we are adding vetted professionals in new destinations every month."
        />
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((pro) => (
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
