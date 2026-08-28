"use client";

import * as React from "react";

import { Check, ChevronDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { countries, findCountry, matchesQuery } from "@/lib/countries";
import { cn } from "@/lib/utils";

/**
 * A searchable country picker. A native <select> with 200 options is miserable
 * on a phone, and this is the very first thing anyone touches — so it gets a
 * type-to-filter list instead.
 */
export function CountrySelect({
  label,
  value,
  onChange,
  placeholder = "Choose a country",
  exclude,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  /** Stops someone picking the same country for both origin and destination. */
  exclude?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const selected = findCountry(value);
  const id = React.useId();

  const results = React.useMemo(
    () =>
      countries
        .filter((c) => c.code !== exclude)
        .filter((c) => matchesQuery(c, query))
        .slice(0, 80),
    [query, exclude],
  );

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-[13px] font-semibold tracking-tight">
        {label}
      </label>

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            // Radix supplies aria-expanded / aria-haspopup / aria-controls.
            className={cn(
              "flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-border/70 bg-ink-50/70 px-3.5 text-left transition-[color,box-shadow,background-color] outline-none",
              "focus-visible:border-ring/60 focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-ring/25",
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              {selected ? (
                <>
                  <span aria-hidden="true" className="text-lg leading-none">
                    {selected.flag}
                  </span>
                  <span className="truncate text-[15px] text-ink-900">
                    {selected.name}
                  </span>
                </>
              ) : (
                <span className="text-[15px] text-muted-foreground/70">
                  {placeholder}
                </span>
              )}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <div className="border-b border-border p-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries"
              leftIcon={<Search />}
              size="sm"
            />
          </div>

          <ul className="max-h-64 overflow-y-auto p-1" role="listbox">
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                No country matches “{query}”.
              </li>
            ) : (
              results.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.code === value}
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[14px] transition-colors hover:bg-secondary"
                  >
                    <span aria-hidden="true" className="text-base leading-none">
                      {c.flag}
                    </span>
                    <span className="flex-1 truncate text-ink-900">{c.name}</span>
                    {c.code === value ? (
                      <Check className="size-4 text-primary" strokeWidth={3} />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
