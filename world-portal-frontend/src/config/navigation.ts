export type NavItem = { title: string; href: string };

/**
 * Primary nav — the pill in the header and the large list in the footer.
 *
 * Section links are root-relative ("/#visas", not "#visas") so they still work
 * from the standalone pages under (app): a bare hash there only rewrites the
 * URL, because the section it names lives on the landing page.
 */
export const mainNav: NavItem[] = [
  { title: "Passports", href: "/#passports" },
  { title: "Visas", href: "/#visas" },
  { title: "Flights", href: "/#flights-hotels" },
  { title: "Tours", href: "/#experiences" },
  { title: "Hire a pro", href: "/hire" },
  { title: "How it works", href: "/#journey" },
];

export const locales = [
  { label: "Eng", value: "en", active: true },
  { label: "中国", value: "zh", active: false },
];
