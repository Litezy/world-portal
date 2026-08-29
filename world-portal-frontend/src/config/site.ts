export const siteConfig = {
  name: "World Portal",
  wordmark: "EXPLORE",
  tagline: "Visas, flights and journeys worth the trip",
  description:
    "Licensed visa consultants, flights and hotels booked in hours, and curated travel experiences — handled end to end by one team.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_US",
  contact: {
    phone: "+1 980 971-24-19",
    email: "hello@worldportal.travel",
    address: "1901 Thornridge Cir. Shiloh, Hawaii 81063",
    hours: "/ Everyday",
    whatsapp: "+19809712419",
  },
  social: {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
  },
} as const;

export type SiteConfig = typeof siteConfig;
