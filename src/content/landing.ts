/**
 * Every piece of copy and imagery on the landing page, in reading order.
 * Sections render from this file, so re-wording the site never means touching
 * a component.
 *
 * The page sells three services, each with its own section and its own CTA:
 *   1. Visa applications  — comfort and ease
 *   2. Flights and hotels — speed and reliability
 *   3. Experiences & tours — curation and quality
 */

export const hero = {
  badge: "Visas · Flights · Experiences",
  lead: "Visas approved, seats secured, journeys worth the flight — one team handling every part of getting you there.",
  cta: { label: "Plan my trip", href: "#contact" },
  navCta: { label: "Get started", href: "#contact" },
  image: {
    src: "/images/hero.jpg",
    alt: "Islands scattered across a turquoise lagoon seen from above",
  },
  wordmark: "DISCOVER",
} as const;

export const intro = {
  headingLead: "Three things stand between you and",
  headingBreak: "the trip —",
  headingAccent: "we handle all three.",
  body: "The visa, the booking, and the plan itself. World Portal takes all of it: licensed consultants filing your application, fares held while you decide, and itineraries built around how you actually want to travel.",
  thumbnails: [
    {
      src: "/images/intro/temple.jpg",
      alt: "A temple reflected in still water at dawn",
      position: "top-left",
    },
    {
      src: "/images/intro/rice.jpg",
      alt: "Sunlit terraces lined with palm trees",
      position: "top-right",
    },
    {
      src: "/images/intro/beach.jpg",
      alt: "A cliff above turquoise water",
      position: "bottom-left",
    },
    {
      src: "/images/intro/falls.jpg",
      alt: "A waterfall falling through dense forest",
      position: "bottom-right",
    },
  ],
} as const;

export const whyUs = {
  eyebrow: "Why World Portal",
  headingLead: "Why travel with",
  headingAccent: "World Portal?",
  body: "Because approvals, availability and logistics should never be yours to chase.",
  background: {
    src: "/images/why-us.jpg",
    alt: "Mist rising over open country at first light",
  },
  cards: [
    {
      icon: "passport",
      title: "Licensed & accredited",
      body: "Registered consultants who file directly with embassies, consulates and immigration portals.",
      cta: "See our visa services",
      href: "#visas",
    },
    {
      icon: "bolt",
      title: "Answers in hours",
      body: "Fare and room options land in your inbox the same working day, with the price held while you decide.",
      cta: "Book flights & stays",
      href: "#flights-hotels",
    },
    {
      icon: "concierge",
      title: "One point of contact",
      body: "The same consultant from your first enquiry to your return flight. No ticket queues, no handovers.",
      cta: "Talk to a consultant",
      href: "#contact",
    },
    {
      icon: "compass",
      title: "Curated, not just booked",
      body: "Private guides, timed access and the days you cannot assemble from a search results page.",
      cta: "Browse experiences",
      href: "#experiences",
    },
  ],
} as const;

/** Service 1 — sells comfort and ease. */
export const visas = {
  eyebrow: "Visa Applications",
  headingLead: "Visas, without the",
  headingAccent: "guesswork.",
  body: "Tell us where you are going and on which passport. We confirm exactly which visa applies, prepare the file, and track it through to a decision — so the only thing you handle is your trip.",
  cta: { label: "Check my visa options", href: "#contact" },
  items: [
    {
      name: "eVisa",
      tag: "3–7 days",
      body: "Applied for and approved entirely online. We complete the portal submission, validate every document, and send the approval straight to your phone. No embassy visit, no queue.",
      image: {
        src: "/images/visas/evisa.jpg",
        alt: "A modern airport concourse lit at night",
      },
    },
    {
      name: "Consular Visa",
      tag: "2–4 weeks",
      body: "Full embassy filing, handled end to end: document preparation, sponsorship letters, appointment booking and interview coaching before you walk in.",
      image: {
        src: "/images/visas/consular.jpg",
        alt: "A consular building behind wrought-iron gates",
      },
    },
    {
      name: "ETA",
      tag: "24–72 hours",
      body: "Electronic travel authorisation for visa-free routes. A short form, checked and submitted the same day, with approval usually back before you have packed.",
      image: {
        src: "/images/visas/eta.jpg",
        alt: "A departure hall with flight information boards",
      },
    },
  ],
} as const;

/** The shared process behind all three services. */
export const journey = {
  eyebrow: "How it works",
  headingLead: "From first question to",
  headingAccent: "final boarding pass.",
  body: "One process behind every service, so you always know exactly where things stand.",
  cta: { label: "Start with a free consultation", href: "#contact" },
  steps: [
    {
      day: 1,
      title: "Tell us the plan",
      body: "A five-minute form or a call. Destination, dates, passport, and what you actually want out of the trip.",
      image: {
        src: "/images/itinerary/day-1.jpg",
        alt: "A temple glowing at sunset over still water",
      },
    },
    {
      day: 2,
      title: "We map the route",
      body: "Which visa applies and what it needs. Which fares and stays are realistic for your dates and budget. You get one clear plan, not twelve tabs.",
      image: {
        src: "/images/itinerary/day-2.jpg",
        alt: "Terraced fields in morning light",
      },
    },
    {
      day: 3,
      title: "We file and book",
      body: "Documents prepared and submitted, seats and rooms held at the quoted price. You approve once; we handle every follow-up from there.",
      image: {
        src: "/images/itinerary/day-3.jpg",
        alt: "A wooden boat crossing clear turquoise water",
      },
    },
    {
      day: 4,
      title: "You travel",
      body: "Approvals, tickets and the full itinerary in one place, with your consultant reachable on WhatsApp for the entire trip.",
      image: {
        src: "/images/itinerary/day-4.jpg",
        alt: "A thatched cabana beside a resort pool",
      },
    },
  ],
} as const;

/** Service 2 — sells speed and reliability. */
export const flightsHotels = {
  eyebrow: "Flights & Hotels",
  headingLead: "Booked in hours,",
  headingAccent: "not days.",
  body: "Live fares, held seats and stays we have actually vetted. We quote fast, hold faster, and never leave you refreshing a booking page at midnight.",
  cta: { label: "Get a quote today", href: "#contact" },
  stats: [
    { value: "4 hrs", label: "Average quote turnaround" },
    { value: "24/7", label: "Rebooking support in transit" },
    { value: "0", label: "Hidden booking fees" },
  ],
  /** Two rows that slide opposite ways as the section scrolls past. */
  marqueeTop: [
    {
      src: "/images/travel/flight-cloud.jpg",
      alt: "An airliner above a layer of cloud",
    },
    {
      src: "/images/stays/ocean-villa.jpg",
      alt: "A modern villa with a long infinity pool",
    },
    { src: "/images/visas/evisa.jpg", alt: "An airport concourse lit at night" },
    {
      src: "/images/stays/grand-palace.jpg",
      alt: "A glass-fronted suite at golden hour",
    },
    { src: "/images/travel/cabin.jpg", alt: "A private cabin interior" },
  ],
  marqueeBottom: [
    { src: "/images/travel/arrival.jpg", alt: "A lit resort entrance at dusk" },
    {
      src: "/images/travel/flight-dusk.jpg",
      alt: "An aircraft climbing through a dusk sky",
    },
    {
      src: "/images/stays/jungle-retreat.jpg",
      alt: "A thatched pavilion beside a curved pool",
    },
    {
      src: "/images/visas/eta.jpg",
      alt: "A departure hall with flight information boards",
    },
    { src: "/images/gallery/1.jpg", alt: "A hut above a secluded beach" },
  ],
} as const;

/** Service 3 — sells curation and quality. */
export const experiences = {
  eyebrow: "Experiences & Tours",
  headingLead: "Journeys worth",
  headingAccent: "retelling.",
  body: "Curated holiday packages, private guides and timed access to the places everyone else queues for. We build the days, you just turn up for them.",
  cta: { label: "Browse experiences", href: "#contact" },
  highlights: [
    "Private guides & drivers",
    "Timed & after-hours access",
    "Small-group departures",
    "Fully bespoke itineraries",
  ],
  images: [
    {
      src: "/images/gallery/1.jpg",
      alt: "A hut above a secluded beach with kayaks",
      span: "small",
    },
    {
      src: "/images/gallery/2.jpg",
      alt: "Dancers in ceremonial dress and gold headpieces",
      span: "small",
    },
    {
      src: "/images/gallery/3.jpg",
      alt: "A tiered temple against a misty mountain",
      span: "tall",
    },
    {
      src: "/images/gallery/4.jpg",
      alt: "A clifftop temple above a breaking surf line",
      span: "small",
    },
    {
      src: "/images/gallery/5.jpg",
      alt: "Sunlight over palm-lined terraces",
      span: "small",
    },
  ],
} as const;

export const contact = {
  eyebrow: "Start here",
  headingLead: "Which part can we",
  headingAccent: "take off your hands?",
  body: "Pick a service, tell us the details, and a consultant replies within 24 hours with the next steps and a fixed quote. No obligation, no call centre.",
  getInTouch: "Or reach us directly",
  background: {
    src: "/images/contact.jpg",
    alt: "A coastline silhouetted against a golden sunset",
  },
  submitLabel: "Send my request",
  whatsappLabel: "Chat with us on WhatsApp",
  /** Drives the chips at the top of the form and the `service` field. */
  services: [
    { value: "visa", label: "Visa application", hint: "eVisa, Consular or ETA" },
    { value: "booking", label: "Flights & hotels", hint: "Quote in about 4 hours" },
    {
      value: "experience",
      label: "Experiences & tours",
      hint: "Curated or fully bespoke",
    },
  ],
  assurances: [
    "Replies within 24 hours",
    "Fixed quotes, no hidden fees",
    "Licensed consultants",
  ],
} as const;

export const faq = {
  eyebrow: "FAQ",
  headingLead: "Frequently Asked",
  headingAccent: "Questions?",
  body: "The things travellers ask us most, before they book anything.",
  items: [
    {
      question: "Which visa do I actually need?",
      answer:
        "That depends on your passport, your destination and why you are going — and it changes more often than most people expect. Send us those three things and we will confirm whether you need an eVisa, a consular visa or just an ETA, usually the same working day and before you pay us anything.",
    },
    {
      question: "How fast can you book flights and hotels?",
      answer:
        "Most quotes go out within about four hours of your request during business hours. Once you approve, seats and rooms are held at the quoted price while payment clears, so a fare cannot move under you mid-decision.",
    },
    {
      question: "What does it cost, and when do I pay?",
      answer:
        "You get a fixed quote up front covering our service fee and any government charges, itemised separately. Nothing is payable until you approve that quote, and the figure you approve is the figure you pay.",
    },
    {
      question: "What happens if my visa is refused?",
      answer:
        "We read the refusal notice with you, identify exactly what triggered it, and rebuild the case before reapplying. Where the refusal was down to an error on our side, the reapplication is handled at no further service charge.",
    },
    {
      question: "Can you handle an entire trip end to end?",
      answer:
        "Yes — that is the point of running all three services under one roof. One consultant takes the visa, the flights, the accommodation and the day-to-day itinerary, so nothing falls between providers and you only ever have one person to ask.",
    },
  ],
} as const;

/* -------------------------------------------------------------------------
 * Parked sections
 *
 * Not rendered by the page right now (their JSX is commented out in
 * app/(site)/page.tsx), but kept in sync so switching either back on is a
 * one-line change rather than a rewrite.
 * ---------------------------------------------------------------------- */

export const packages = {
  eyebrow: "Packages",
  headingLead: "Everything, handled —",
  headingAccent: "one price.",
  body: "Visa, flights, stays and the itinerary bundled into a single fixed quote.",
  background: {
    src: "/images/packages.jpg",
    alt: "Aerial view of islands in a turquoise lagoon",
  },
  offer: {
    badge: "Most popular",
    name: "The Full Portal",
    duration: "Visa + flights + 7 nights",
    price: 1450,
    priceUnit: "/person",
    includesLabel: "What's included:",
    includes: [
      "Visa filing and tracking",
      "Return flights, seats selected",
      "7 nights in vetted stays",
      "Airport transfers both ends",
      "24/7 consultant on WhatsApp",
    ],
    cta: { label: "Request this package", href: "#contact" },
  },
} as const;

export const testimonials = {
  eyebrow: "Testimonials",
  headingLead: "What our travellers",
  headingAccent: "say",
  body: "A few notes from people who let us handle the difficult half.",
  items: [
    {
      quote:
        "My visa had been refused once before. World Portal found the exact line that caused it, rebuilt the application, and it was approved in under three weeks.",
      name: "Sarah Jenkins",
      location: "London, UK",
      avatar: "/images/avatars/1.jpg",
    },
    {
      quote:
        "I sent one message on a Tuesday morning and had flights, a hotel and a full quote back before lunch. I have never booked a trip that fast.",
      name: "Michael Ross",
      location: "Madrid, Spain",
      avatar: "/images/avatars/2.jpg",
    },
    {
      quote:
        "The itinerary was the part I didn't know I needed. Private guides, nothing rushed, and not one queue the whole trip.",
      name: "Amelia Cole",
      location: "Sydney, Australia",
      avatar: "/images/avatars/3.jpg",
    },
    {
      quote:
        "Same consultant from the first email to the return flight. When a connection was cancelled they had me rebooked before I reached the desk.",
      name: "Daniel Okafor",
      location: "Toronto, Canada",
      avatar: "/images/avatars/4.jpg",
    },
  ],
} as const;
