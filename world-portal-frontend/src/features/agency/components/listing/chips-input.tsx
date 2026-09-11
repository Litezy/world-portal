"use client";

import * as React from "react";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listingFlowCopy } from "@/features/agency/components/listing/copy";
import { cn } from "@/lib/utils";

/**
 * A multi-value field: cities, languages.
 *
 * Deliberately not a comma-separated text box. "Lagos, Abuja,Port Harcourt"
 * has to be guessed at on the way in and never survives a round trip cleanly,
 * and the agency cannot see what the platform actually stored. Chips show
 * exactly what is on file and let one of them be removed.
 */
export function ChipsInput({
  label,
  hint,
  placeholder,
  values,
  onChange,
  disabled,
  required,
  suggestions,
}: {
  label: string;
  hint?: string;
  placeholder?: string;
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  required?: boolean;
  /** Offered as one-tap additions — languages, mostly. */
  suggestions?: readonly string[];
}) {
  const [draft, setDraft] = React.useState("");
  const id = React.useId();
  const hintId = `${id}-hint`;

  function add(raw: string) {
    const value = raw.trim();
    if (!value) return;
    // Case-insensitive, so "lagos" cannot sit next to "Lagos".
    const exists = values.some((v) => v.toLowerCase() === value.toLowerCase());
    if (!exists) onChange([...values, value]);
    setDraft("");
  }

  function remove(value: string) {
    onChange(values.filter((v) => v !== value));
  }

  const open = (suggestions ?? []).filter(
    (s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="grid gap-2">
      <label
        htmlFor={id}
        className="flex items-center gap-px text-[13px] leading-none font-semibold tracking-tight"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="text-ink-900">
            *
          </span>
        ) : null}
      </label>

      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          disabled={disabled}
          placeholder={placeholder}
          aria-describedby={hintId}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              // Enter inside a form submits it; this field means "add a chip".
              event.preventDefault();
              add(draft);
            }
            if (event.key === "Backspace" && !draft && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
        />
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={disabled || !draft.trim()}
          onClick={() => add(draft)}
        >
          <Plus className="size-4" />
          <span className="sr-only sm:not-sr-only">{listingFlowCopy.chipAdd}</span>
        </Button>
      </div>

      <p id={hintId} className="text-[11.5px] text-muted-foreground">
        {hint ? `${hint} ` : null}
        {listingFlowCopy.chipHint}
      </p>

      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <li key={value}>
              <span
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full bg-secondary pr-1.5 pl-3 text-[13px] text-secondary-foreground",
                  disabled && "opacity-70",
                )}
              >
                {value}
                {!disabled ? (
                  <button
                    type="button"
                    onClick={() => remove(value)}
                    aria-label={listingFlowCopy.chipRemove(value)}
                    className="grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-ink-900/10 hover:text-ink-900 focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:outline-none"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {open.length > 0 && !disabled ? (
        <ul className="flex flex-wrap gap-1.5">
          {open.slice(0, 6).map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => add(suggestion)}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-border px-2.5 text-[12px] text-muted-foreground transition-colors hover:border-border hover:bg-secondary hover:text-ink-900"
              >
                <Plus className="size-3" />
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
