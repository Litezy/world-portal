export type NavItem = { title: string; href: string };

/** The floating pill in the header, and the large list in the footer. */
export const mainNav: NavItem[] = [
  { title: "Visas", href: "#visas" },
  { title: "Flights & Hotels", href: "#flights-hotels" },
  { title: "Experiences", href: "#experiences" },
  { title: "How it works", href: "#journey" },
];

export const locales = [
  { label: "Eng", value: "en", active: true },
  { label: "中国", value: "zh", active: false },
];
