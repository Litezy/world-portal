"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { startOfToday } from "date-fns";
import {
  ArrowLeftRight,
  CalendarDays,
  Minus,
  PlaneLanding,
  PlaneTakeoff,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { type DateRange, DayPicker } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  airportFlag,
  DEFAULT_ORIGIN,
  findAirport,
  searchAirports,
} from "@/features/flights/airports";
import {
  type Cabin,
  cabinLabels,
  dayLabel,
  type FlightSearch as Query,
  fromDayKey,
  MAX_TRAVELLERS,
  missingField,
  toDayKey,
  toQuery,
  travellersLabel,
  type TripType,
} from "@/features/flights/search";
import { useMediaQuery } from "@/hooks/use-media-query";
import { countryName } from "@/lib/countries";
import { cn } from "@/lib/utils";

import "react-day-picker/style.css";

type Panel = "from" | "to" | "dates" | "travellers";

const FIELD = cn(
  "group/field flex h-14 w-full min-w-0 items-center gap-3 rounded-xl px-3.5 text-left outline-none",
  "bg-background/80 ring-1 ring-border/70 transition-[box-shadow,background-color] duration-200",
  "hover:bg-background hover:ring-primary/45",
  "focus-visible:ring-2 focus-visible:ring-ring/70 data-[state=open]:bg-background data-[state=open]:ring-2 data-[state=open]:ring-primary/60",
  // Phones (2026-11-09, Owen: "the mobile view looks terrible"): rows of one
  // block with hairlines between them, the way booking apps lay it out, not
  // four floating tiles.
  "max-sm:h-[3.25rem] max-sm:rounded-none max-sm:bg-transparent max-sm:ring-0",
  "max-sm:hover:bg-primary/[0.05] max-sm:hover:ring-0 max-sm:focus-visible:ring-inset",
  "max-sm:data-[state=open]:bg-primary/[0.07] max-sm:data-[state=open]:ring-0",
);
/** The hairline between rows on phones. */
const ROW = "max-sm:border-border/70";
const LABEL =
  "block text-[0.6875rem] leading-none font-semibold tracking-[0.12em] text-muted-foreground uppercase";
const VALUE =
  "mt-1.5 block truncate text-[0.9375rem] leading-tight font-semibold text-foreground";
const EMPTY =
  "mt-1.5 block truncate text-[0.9375rem] leading-tight font-medium text-muted-foreground/80";
const ICON = "size-[1.125rem] shrink-0 text-primary";

const NUDGE: Record<NonNullable<ReturnType<typeof missingField>>, string> = {
  from: "Pick the airport you are flying from.",
  to: "Pick where you are flying to.",
  depart: "Pick the day you fly out.",
  back: "Pick the day you fly back, or switch to one way.",
};

/**
 * The hero's front door, laid out like a flight booking site: return or one
 * way, from (Lagos to start with), to, dates, travellers and cabin, then
 * Search flights. The CTO's ask (2026-11-09): the first thing a visitor sees
 * should be "where are you going", ready to book, not a "start your trip"
 * button.
 *
 * Search hands the trip to `/start` in the URL. Flights are not bookable on
 * their own yet, and a seat bought before the visa is how people lose money,
 * so the planner takes the route from here and asks the passport and visa
 * questions first. Missing a field never fails silently: the form says what
 * is missing and opens that picker.
 */
export function FlightSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [search, setSearch] = React.useState<Query>({
    trip: "return",
    from: DEFAULT_ORIGIN,
    to: "",
    depart: null,
    back: null,
    travellers: { adults: 1, children: 0, infants: 0 },
    cabin: "economy",
  });
  const [panel, setPanel] = React.useState<Panel | null>(null);
  const [nudge, setNudge] = React.useState<string | null>(null);
  const [going, startGoing] = React.useTransition();

  const update = (patch: Partial<Query>) => {
    setNudge(null);
    setSearch((s) => ({ ...s, ...patch }));
  };
  const openPanel = (next: Panel | null) => setPanel(next);

  const setTrip = (trip: TripType) =>
    update(trip === "one-way" ? { trip, back: null } : { trip });

  const fromAirport = findAirport(search.from);
  const toAirport = findAirport(search.to);

  const swap = () => update({ from: search.to, to: search.from });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = missingField(search);
    if (missing) {
      setNudge(NUDGE[missing]);
      setPanel(missing === "depart" || missing === "back" ? "dates" : missing);
      return;
    }
    setNudge(null);
    startGoing(() => router.push(`/start?${toQuery(search)}`));
  };

  return (
    <form
      role="search"
      aria-label="Book a flight"
      // Tapped before the page is interactive, it still lands on the planner.
      action="/start"
      onSubmit={submit}
      noValidate
      data-flight-search
      // The hero keeps the search on screen while a picker is open.
      data-picking={panel ? "" : undefined}
      className={cn(
        "glass glass-frost w-full rounded-[1.375rem] p-2.5 text-foreground sm:p-3",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 px-1 pt-0.5 pb-2.5">
        <TripTabs value={search.trip} onChange={setTrip} />
        <p className="hidden text-[0.75rem] font-medium text-muted-foreground sm:block">
          Visa checked before you fly
        </p>
      </div>

      <div className="grid gap-2">
        {/* On phones the fields are one white block; from sm, tiles. */}
        <div
          className={cn(
            "grid gap-2",
            "max-sm:gap-0 max-sm:overflow-hidden max-sm:rounded-2xl max-sm:bg-background max-sm:shadow-[0_1px_3px_rgb(0_0_0/0.06)] max-sm:ring-1 max-sm:ring-border/70",
          )}
        >
          {/* From and to, with the swap between them. */}
          <div className="relative grid gap-2 max-sm:gap-0 sm:grid-cols-2">
            <AirportField
              label="From"
              icon={<PlaneTakeoff className={ICON} />}
              value={search.from}
              exclude={toAirport?.country}
              placeholder="Flying from"
              className={cn("max-sm:border-b max-sm:pr-14", ROW)}
              open={panel === "from"}
              onOpenChange={(o) => openPanel(o ? "from" : null)}
              onChange={(code) => {
                const picked = findAirport(code);
                update({
                  from: code,
                  // A trip abroad: the same country on both ends clears the other.
                  ...(picked && picked.country === toAirport?.country
                    ? { to: "" }
                    : {}),
                });
              }}
            />
            <AirportField
              label="To"
              icon={<PlaneLanding className={ICON} />}
              value={search.to}
              exclude={fromAirport?.country}
              placeholder="Where to?"
              className="max-sm:pr-14"
              open={panel === "to"}
              onOpenChange={(o) => openPanel(o ? "to" : null)}
              onChange={(code) => {
                update({ to: code });
                // Next question straight away, as booking sites do.
                if (search.depart) return false;
                setPanel("dates");
                return true;
              }}
            />
            <button
              type="button"
              onClick={swap}
              disabled={!search.to}
              aria-label="Swap from and to"
              className={cn(
                "absolute z-10 grid size-9 place-items-center rounded-full bg-background text-primary shadow-md ring-1 ring-border/70",
                "transition-[transform,box-shadow] duration-200 hover:ring-primary/50 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-0",
                // Stacked on phones: on the right, on the line between the rows.
                "top-1/2 right-3 -translate-y-1/2 rotate-90 max-sm:size-8 max-sm:shadow-sm",
                // Side by side: in the gap between the two fields.
                "sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:rotate-0",
              )}
            >
              <ArrowLeftRight className="size-4" />
            </button>
          </div>

          <div
            className={cn(
              "grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1.15fr]",
              "max-sm:gap-0 max-sm:border-t",
              ROW,
            )}
          >
            <DatesField
              search={search}
              open={panel === "dates"}
              onOpenChange={(o) => openPanel(o ? "dates" : null)}
              onAddReturn={() => {
                setTrip("return");
                setPanel("dates");
              }}
              onChange={(patch) => update(patch)}
            />
            <TravellersField
              value={search.travellers}
              cabin={search.cabin}
              open={panel === "travellers"}
              onOpenChange={(o) => openPanel(o ? "travellers" : null)}
              onChange={(patch) => update(patch)}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={going}
          className={cn(
            "cx-btn cx-btn--aurora cx-btn--lg w-full justify-center gap-2.5",
            "h-[3.25rem] px-6 text-[1.0625rem] max-sm:h-12 max-sm:text-base",
          )}
        >
          <Search className="size-[1.125rem]" strokeWidth={2.4} />
          {going ? "Searching…" : "Search flights"}
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={cn(
          "px-1 text-[0.8125rem] font-medium text-destructive",
          nudge ? "pt-2.5" : "sr-only",
        )}
      >
        {nudge ?? ""}
      </p>
    </form>
  );
}

function TripTabs({
  value,
  onChange,
}: {
  value: TripType;
  onChange: (trip: TripType) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Trip type"
      className="inline-flex rounded-full bg-background/60 p-1 ring-1 ring-border/60"
    >
      {(
        [
          ["return", "Return"],
          ["one-way", "One way"],
        ] as const
      ).map(([trip, label]) => {
        const active = value === trip;
        return (
          <button
            key={trip}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(trip)}
            className={cn(
              "h-8 rounded-full px-4 text-[0.8125rem] font-semibold transition-colors duration-200",
              "focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/70 hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function AirportField({
  label,
  icon,
  value,
  onChange,
  exclude,
  placeholder,
  open,
  onOpenChange,
  className,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  /** Returns true when it opened the next picker. */
  onChange: (code: string) => boolean | void;
  exclude?: string;
  placeholder: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}) {
  const [query, setQuery] = React.useState("");
  const handoff = React.useRef(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const selected = findAirport(value);
  const results = React.useMemo(
    () => searchAirports(query, exclude).slice(0, 60),
    [query, exclude],
  );

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={close}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(FIELD, className)}>
          {icon}
          <span className="min-w-0 flex-1">
            <span className={LABEL}>{label}</span>
            {selected ? (
              <span className={VALUE}>
                {selected.city}{" "}
                <span className="font-medium text-muted-foreground">
                  {selected.code}
                </span>
              </span>
            ) : (
              <span className={EMPTY}>{placeholder}</span>
            )}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        collisionPadding={12}
        align="start"
        className="w-[min(23rem,calc(100vw-2rem))] p-0"
        // A pick that opens the next picker keeps focus moving forward, not back here.
        onCloseAutoFocus={(e) => {
          if (handoff.current) e.preventDefault();
          handoff.current = false;
        }}
        // With a mouse, straight into the search box. On a touch screen, no:
        // focused before the list is placed, the box sat off-screen and the
        // phone scrolled ~380px to reach it (preventScroll or not), carrying
        // the whole flight search out of the hero (2026-11-09). There the list
        // shows and a tap on the box brings the keyboard, as booking apps do.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          if (window.matchMedia("(pointer: fine)").matches) {
            searchRef.current?.focus({ preventScroll: true });
          }
        }}
      >
        <div className="border-b border-border p-2">
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="City, airport or country"
            aria-label={`${label}: search airports`}
            leftIcon={<Search />}
            size="sm"
            className="max-sm:h-10 max-sm:text-base"
          />
        </div>

        <ul role="listbox" aria-label={label} className="max-h-72 overflow-y-auto p-1">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-[13px] text-muted-foreground">
              No airport matches “{query}”.
            </li>
          ) : (
            results.map((a) => (
              <li key={a.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={a.code === value}
                  onClick={() => {
                    close(false);
                    handoff.current = onChange(a.code) === true;
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-secondary",
                    a.code === value && "bg-secondary",
                  )}
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    {airportFlag(a)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-foreground">
                      {a.city}
                    </span>
                    <span className="block truncate text-[12px] text-muted-foreground">
                      {a.name}, {countryName(a.country)}
                    </span>
                  </span>
                  <span className="text-[12px] font-semibold tracking-wide text-muted-foreground tabular-nums">
                    {a.code}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function DatesField({
  search,
  open,
  onOpenChange,
  onAddReturn,
  onChange,
}: {
  search: Query;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddReturn: () => void;
  onChange: (patch: Partial<Query>) => void;
}) {
  const wide = useMediaQuery("(min-width: 640px)");
  const today = React.useMemo(() => startOfToday(), []);
  const depart = fromDayKey(search.depart);
  const back = fromDayKey(search.back);
  const isReturn = search.trip === "return";

  const calendar = {
    numberOfMonths: wide ? 2 : 1,
    startMonth: today,
    defaultMonth: depart ?? today,
    disabled: { before: today },
    weekStartsOn: 1 as const,
    style: {
      "--rdp-accent-color": "var(--primary)",
      "--rdp-accent-background-color":
        "color-mix(in oklab, var(--primary) 14%, transparent)",
      "--rdp-day-height": "2.5rem",
      "--rdp-day-width": "2.5rem",
      "--rdp-day_button-height": "2.375rem",
      "--rdp-day_button-width": "2.375rem",
      "--rdp-months-gap": "1.75rem",
      "--rdp-nav-height": "2.5rem",
    } as React.CSSProperties,
    className: "text-[0.875rem] text-foreground",
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            "col-span-2 grid grid-cols-2 gap-2 max-sm:gap-0 max-sm:border-b",
            ROW,
          )}
        >
          <PopoverTrigger asChild>
            <button type="button" className={cn(FIELD, "max-sm:border-r", ROW)}>
              <CalendarDays className={ICON} />
              <span className="min-w-0 flex-1">
                <span className={LABEL}>Depart</span>
                {depart ? (
                  <span className={VALUE}>{dayLabel(search.depart)}</span>
                ) : (
                  <span className={EMPTY}>Add date</span>
                )}
              </span>
            </button>
          </PopoverTrigger>
          <button
            type="button"
            className={FIELD}
            data-state={open ? "open" : "closed"}
            onClick={() => (isReturn ? onOpenChange(true) : onAddReturn())}
          >
            <CalendarDays className={ICON} />
            <span className="min-w-0 flex-1">
              <span className={LABEL}>Return</span>
              {isReturn && back ? (
                <span className={VALUE}>{dayLabel(search.back)}</span>
              ) : (
                <span className={EMPTY}>{isReturn ? "Add date" : "Add a return"}</span>
              )}
            </span>
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        collisionPadding={12}
        align="start"
        className="w-auto max-w-[calc(100vw-1rem)] p-3 sm:p-4"
      >
        <p className="px-1 pb-1 text-[0.8125rem] font-semibold text-foreground">
          {!isReturn
            ? "When do you fly out?"
            : !depart || (depart && back)
              ? "Pick the day you fly out"
              : "Now the day you fly back"}
        </p>
        {isReturn ? (
          <DayPicker
            {...calendar}
            mode="range"
            resetOnSelect
            required
            selected={{ from: depart, to: back } as DateRange}
            onSelect={(range) => {
              onChange({
                depart: range?.from ? toDayKey(range.from) : null,
                back: range?.to ? toDayKey(range.to) : null,
              });
              if (range?.from && range?.to) onOpenChange(false);
            }}
          />
        ) : (
          <DayPicker
            {...calendar}
            mode="single"
            required
            selected={depart}
            onSelect={(day) => {
              onChange({ depart: toDayKey(day) });
              onOpenChange(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

const PEOPLE = [
  { key: "adults", label: "Adults", hint: "12 and over" },
  { key: "children", label: "Children", hint: "2 to 11" },
  { key: "infants", label: "Infants", hint: "Under 2, on a lap" },
] as const;

function TravellersField({
  value,
  cabin,
  open,
  onOpenChange,
  onChange,
  className,
}: {
  value: Query["travellers"];
  cabin: Cabin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (patch: Partial<Query>) => void;
  className?: string;
}) {
  const total = value.adults + value.children + value.infants;
  const max = {
    adults: MAX_TRAVELLERS - value.children - value.infants,
    children: MAX_TRAVELLERS - value.adults - value.infants,
    // One lap per adult.
    infants: Math.min(value.adults, MAX_TRAVELLERS - value.adults - value.children),
  };
  const min = { adults: 1, children: 0, infants: 0 };

  const set = (key: keyof typeof max, n: number) => {
    const next = { ...value, [key]: n };
    if (next.infants > next.adults) next.infants = next.adults;
    onChange({ travellers: next });
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(FIELD, className)}>
          <Users className={ICON} />
          <span className="min-w-0 flex-1">
            <span className={LABEL}>Travellers</span>
            <span className={VALUE}>
              {travellersLabel(value)}
              <span className="font-medium text-muted-foreground">
                {" "}
                · {cabinLabels[cabin]}
              </span>
            </span>
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        collisionPadding={12}
        className="w-[min(20rem,calc(100vw-2rem))] p-0"
      >
        <ul className="divide-y divide-border px-4">
          {PEOPLE.map(({ key, label, hint }) => (
            <li key={key} className="flex items-center justify-between gap-4 py-3">
              <span>
                <span className="block text-[14px] font-semibold text-foreground">
                  {label}
                </span>
                <span className="block text-[12px] text-muted-foreground">{hint}</span>
              </span>
              <span className="flex items-center gap-3">
                <StepButton
                  label={`Fewer ${label.toLowerCase()}`}
                  disabled={value[key] <= min[key]}
                  onClick={() => set(key, value[key] - 1)}
                >
                  <Minus className="size-4" />
                </StepButton>
                <span
                  aria-live="polite"
                  aria-label={`${value[key]} ${label.toLowerCase()}`}
                  className="w-5 text-center text-[15px] font-semibold tabular-nums"
                >
                  {value[key]}
                </span>
                <StepButton
                  label={`More ${label.toLowerCase()}`}
                  disabled={value[key] >= max[key]}
                  onClick={() => set(key, value[key] + 1)}
                >
                  <Plus className="size-4" />
                </StepButton>
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-border p-4">
          <p className="text-[12px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Cabin
          </p>
          <div
            role="radiogroup"
            aria-label="Cabin"
            className="mt-2.5 grid grid-cols-2 gap-1.5"
          >
            {(Object.keys(cabinLabels) as Cabin[]).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={cabin === c}
                onClick={() => onChange({ cabin: c })}
                className={cn(
                  "rounded-lg border px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
                  cabin === c
                    ? "border-primary bg-primary/12 text-foreground"
                    : "border-border text-foreground/80 hover:border-primary/50",
                )}
              >
                {cabinLabels[c]}
              </button>
            ))}
          </div>
          {total >= MAX_TRAVELLERS ? (
            <p className="mt-3 text-[12px] text-muted-foreground">
              Nine is the most on one booking. For a bigger group, contact us.
            </p>
          ) : null}
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => onOpenChange(false)}
            className="mt-4 w-full"
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-full border border-border text-foreground transition-colors",
        "hover:border-primary/60 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-35",
      )}
    >
      {children}
    </button>
  );
}
