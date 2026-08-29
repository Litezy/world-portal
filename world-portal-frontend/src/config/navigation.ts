export type NavItem = { title: string; href: string };

/** Primary nav — the pill in the header and the large list in the footer. */
export const mainNav: NavItem[] = [
  { title: "Passports", href: "#passports" },
  { title: "Visas", href: "#visas" },
  { title: "Flights", href: "#flights-hotels" },
  { title: "Tours", href: "#experiences" },
  { title: "How it works", href: "#journey" },
];

export const locales = [
  { label: "Eng", value: "en", active: true },
  { label: "中国", value: "zh", active: false },
];
