import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and let later Tailwind utilities win.
 * `cn("px-2", condition && "px-4")` -> "px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Absolute URL against the configured site origin — needed for OG tags and canonicals. */
export function absoluteUrl(path = "/") {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

export function formatCurrency(amount: number, currency = "NGN", locale = "en-US") {
  const targetLocale = currency === "NGN" ? "en-NG" : locale;
  return new Intl.NumberFormat(targetLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatWithCommas(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "" || Number.isNaN(value)) return "";
  const numStr = value.toString().replace(/,/g, "");
  const parts = numStr.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
  locale = "en-US",
) {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

/** "3–5 business days", "2 weeks" — a compact human range. */
export function formatRange(min: number, max: number, unit: string) {
  if (min === max) return `${min} ${unit}`;
  return `${min}–${max} ${unit}`;
}

export function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function initials(name: string, max = 2) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** Never resolves — pair with `Promise.race` for timeouts, or use in loading demos. */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** "3 hours ago", "2 days ago" — for activity columns. */
export function formatRelative(date: Date | string | number) {
  const diff = Date.now() - new Date(date).getTime();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const sign = diff > 0 ? -1 : 1;
  if (abs < hour) return rtf.format(sign * Math.round(abs / minute), "minute");
  if (abs < day) return rtf.format(sign * Math.round(abs / hour), "hour");
  if (abs < 30 * day) return rtf.format(sign * Math.round(abs / day), "day");
  return formatDate(date, { day: "numeric", month: "short" });
}
