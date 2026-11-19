"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import {
  BookUser,
  Clock,
  CornerDownLeft,
  FileCheck2,
  type LucideIcon,
  Search,
  Users,
} from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { adminNav } from "@/config/admin-navigation";
import {
  commandPalette as copy,
  passportStatusLabels,
  visaStatusLabels,
} from "@/content/admin";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { internalApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AdminRole, AdminSearchResults } from "@/types";

type Option = {
  id: string;
  group: keyof typeof copy.groups;
  label: string;
  hint?: string;
  href: string;
  icon: LucideIcon;
};

/** What "Recent" remembers — labels and links only, never search text. */
type RecentEntry = Pick<Option, "id" | "label" | "hint" | "href">;

const RECENT_KEY = "e-embassy-admin-recent";
const RECENT_MAX = 5;

function useSearch(q: string) {
  return useQuery({
    queryKey: ["admin", "search", q],
    queryFn: () =>
      internalApi.get<{ data: AdminSearchResults }>("/admin/search", { params: { q } }),
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}

/**
 * Global ⌘K search, modelled on WorldStreet's `GlobalSearchBox`: grouped
 * results, recent picks, full keyboard control, and full-screen on phones.
 * It searches the service — not just the current page — and jumps straight to
 * the record.
 */
export function CommandPalette({
  role,
  open,
  onOpenChange,
}: {
  role: AdminRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const listId = React.useId();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [recent, setRecent] = useLocalStorage<RecentEntry[]>(RECENT_KEY, []);

  const trimmed = query.trim();
  const debounced = useDebounce(trimmed, 200);
  const search = useSearch(debounced);
  const results = search.data?.data;

  const options = React.useMemo<Option[]>(() => {
    const needle = trimmed.toLowerCase();
    const pages: Option[] = adminNav
      .filter((item) => item.roles.includes(role))
      .filter((item) => !needle || item.title.toLowerCase().includes(needle))
      .map((item) => ({
        id: `page:${item.href}`,
        group: "pages",
        label: item.title,
        href: item.href,
        icon: item.icon,
      }));

    if (trimmed.length < 2) {
      const recentOptions: Option[] = recent.map((entry) => ({
        ...entry,
        group: "recent",
        icon: Clock,
      }));
      return [...recentOptions, ...pages];
    }

    return [
      ...pages,
      ...(results?.visas ?? []).map<Option>((v) => ({
        id: `visa:${v.id}`,
        group: "visas",
        label: `${v.reference} · ${v.name}`,
        hint: visaStatusLabels[v.status],
        href: `/admin/applications/${v.id}`,
        icon: FileCheck2,
      })),
      ...(results?.passports ?? []).map<Option>((p) => ({
        id: `passport:${p.id}`,
        group: "passports",
        label: `${p.reference} · ${p.name}`,
        hint: passportStatusLabels[p.status],
        href: `/admin/passports/${p.id}`,
        icon: BookUser,
      })),
      ...(results?.applicants ?? []).map<Option>((a) => ({
        id: `applicant:${a.name}`,
        group: "applicants",
        label: a.name,
        hint: copy.applicantHint(a.applications),
        // Filter by name, never by email: an email must not sit in a URL.
        href: `/admin/customers?q=${encodeURIComponent(a.name)}`,
        icon: Users,
      })),
    ];
  }, [trimmed, role, recent, results]);

  const activeIndex = options.length === 0 ? -1 : Math.min(active, options.length - 1);

  function close() {
    onOpenChange(false);
    setQuery("");
    setActive(0);
  }

  function choose(option: Option) {
    const entry: RecentEntry = {
      id: option.id,
      label: option.label,
      hint: option.hint,
      href: option.href,
    };
    setRecent((previous) =>
      [entry, ...previous.filter((r) => r.id !== option.id)].slice(0, RECENT_MAX),
    );
    close();
    router.push(option.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (options.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((activeIndex + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((activeIndex - 1 + options.length) % options.length);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      choose(options[activeIndex]);
    }
  }

  const status =
    trimmed.length >= 2 && search.isError
      ? copy.failed
      : trimmed.length >= 2 && (search.isFetching || debounced !== trimmed)
        ? copy.searching
        : trimmed.length >= 2 && options.length === 0
          ? copy.noMatches(trimmed)
          : trimmed.length < 2 && trimmed.length > 0
            ? copy.typeMore
            : null;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          "gap-0 overflow-hidden p-0 sm:top-[12vh] sm:max-w-xl sm:translate-y-0",
          "max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none",
        )}
      >
        <DialogTitle className="sr-only">{copy.label}</DialogTitle>

        <div className="flex items-center gap-3 border-b border-border/60 px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          {/* The dialog moves focus here on open — it is the first focusable element. */}
          <input
            role="combobox"
            aria-label={copy.label}
            aria-expanded={options.length > 0}
            aria-controls={listId}
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-${options[activeIndex].id}` : undefined
            }
            aria-autocomplete="list"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={copy.placeholder}
            className="h-14 w-full bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-md border border-border/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
          >
            Esc
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 max-sm:max-h-none max-sm:flex-1">
          {status ? (
            <p role="status" className="px-3 py-3 text-[13px] text-muted-foreground">
              {status}
            </p>
          ) : null}

          <ul
            id={listId}
            role="listbox"
            aria-label={copy.label}
            className="flex flex-col"
          >
            {options.map((option, index) => {
              const first = index === 0 || options[index - 1].group !== option.group;
              const Icon = option.icon;
              return (
                <React.Fragment key={option.id}>
                  {first ? (
                    <li
                      role="presentation"
                      className="px-3 pt-3 pb-1 text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                      {copy.groups[option.group]}
                    </li>
                  ) : null}
                  <li
                    id={`${listId}-${option.id}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseMove={() => setActive(index)}
                    onClick={() => choose(option)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13px]",
                      index === activeIndex
                        ? "bg-muted text-foreground"
                        : "text-foreground/90",
                    )}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {option.label}
                    </span>
                    {option.hint ? (
                      <span className="shrink-0 text-[11.5px] text-muted-foreground">
                        {option.hint}
                      </span>
                    ) : null}
                    {index === activeIndex ? (
                      <CornerDownLeft
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    ) : null}
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        </div>

        <p className="hidden border-t border-border/60 px-4 py-2.5 text-[11px] text-muted-foreground sm:block">
          {copy.footer}
        </p>
      </DialogContent>
    </Dialog>
  );
}
