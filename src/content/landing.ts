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
  badge: "Passports · Visas · Flights · Stays",
  lead: "Tell us where you want to go. We sort out the passport, the visa, the flights and the hotel — so you just pack.",
  cta: { label: "Start my trip", href: "/start" },
  navCta: { label: "Get started", href: "#start-here" },
  secondaryCta: { label: "See what we do", href: "#visas" },
  image: {
    src: "/images/hero.jpg",
    alt: "Islands scattered across a turquoise lagoon seen from above",
  },
  wordmark: "EXPLORE",
} as const;

export const intro = {
  headingLead: "Travelling abroad takes",
  headingBreak: "a lot of paperwork —",
  headingAccent: "we do it for you.",
  body: "A passport. Then a visa. Then a flight and somewhere to stay. Most people give up somewhere in the middle. Tell us where you are going and we handle every step, in the right order, and tell you what is happening as it happens.",
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
  eyebrow: "Why E-Embassy",
  headingLead: "Why people let us",
  headingAccent: "do it for them.",
  body: "Because chasing embassies, forms and fares is a full-time job, and you already have one.",
  background: {
    src: "/images/why-us.jpg",
    alt: "Mist rising over open country at first light",
  },
  cards: [
    {
      icon: "passport",
      title: "We are licensed to file",
      body: "We are registered agents. Your forms go straight to the embassy or passport office — not to a middleman.",
      cta: "See visa services",
      href: "#visas",
    },
    {
      icon: "bolt",
      title: "You hear back same day",
      body: "Ask us anything before nine, get an answer before you finish work. No waiting a week to find out where you stand.",
      cta: "See passport services",
      href: "#passports",
    },
    {
      icon: "concierge",
      title: "One person, start to finish",
      body: "The same consultant handles your whole trip. You never have to explain your situation twice.",
      cta: "Start my trip",
      href: "/start",
    },
    {
      icon: "compass",
      title: "We tell you what is next",
      body: "You always know which step you are on, what we need from you, and how long it should take.",
      cta: "Track an application",
      href: "/track",
    },
  ],
} as const;

/** Service 1 — sells comfort and ease. */
/** Service 1 — live. Sold on how little the traveller has to do. */
export const visas = {
  eyebrow: "Visas",
  headingLead: "The visa part,",
  headingAccent: "handled.",
  body: "A visa is permission to enter another country. Which one you need depends on your passport, where you are going and why. Tell us those three things and we will say exactly which visa applies, fill in the forms, and follow it up until there is a decision.",
  cta: { label: "Start a visa application", href: "/apply" },
  secondaryCta: { label: "Track an application", href: "/track" },
  items: [
    {
      name: "eVisa",
      tag: "3–7 days",
      body: "Done entirely online — no embassy visit and no queue. We fill in the portal, check every document, and send the approval to your phone.",
      image: {
        src: "/images/visas/evisa.jpg",
        alt: "A modern airport concourse lit at night",
      },
    },
    {
      name: "T.Visa (Traditional Visa)",
      tag: "2–4 weeks",
      body: "The kind you apply for at an embassy in person. We prepare the paperwork, book your appointment, and run you through the interview beforehand.",
      image: {
        src: "/images/visas/consular.jpg",
        alt: "A consular building behind wrought-iron gates",
      },
    },
    {
      name: "ETA",
      tag: "24–72 hours",
      body: "A short online approval for countries you do not need a full visa for. One form, checked and sent the same day, usually back before you pack.",
      image: {
        src: "/images/visas/eta.jpg",
        alt: "A departure hall with flight information boards",
      },
    },
  ],
} as const;

/** Service 2 — live. Nothing else can start until this exists. */
export const passports = {
  eyebrow: "Passports",
  headingLead: "No passport yet?",
  headingAccent: "Start here.",
  body: "Your passport is the one thing you cannot travel without, and every visa is stamped into it. If you do not have one, or it runs out within six months of your trip, this is the first thing to fix. We handle the forms, the photos and the appointment.",
  cta: { label: "Start a passport application", href: "/passport" },
  items: [
    {
      name: "First passport",
      tag: "4–6 weeks",
      body: "Never had one. We tell you which documents prove your identity, check them before you submit, and book your appointment.",
      image: {
        src: "/images/passports/new.jpg",
        alt: "A traveller at an airport departure gate",
      },
    },
    {
      name: "Renewal",
      tag: "2–4 weeks",
      body: "Yours has expired, or expires within six months. Most countries will refuse you a visa on a passport that is running out — renew first.",
      image: {
        src: "/images/passports/renewal.jpg",
        alt: "Travel documents on a desk",
      },
    },
    {
      name: "Lost or damaged",
      tag: "3–5 weeks",
      body: "Gone, stolen or water-damaged. There is a police report and a declaration involved — we walk you through both and file the replacement.",
      image: {
        src: "/images/passports/replacement.jpg",
        alt: "An immigration desk at an airport",
      },
    },
  ],
} as const;

/** The shared process behind all three services. */
/** The shared process behind every service. */
export const journey = {
  eyebrow: "How it works",
  headingLead: "Four steps. That is",
  headingAccent: "the whole thing.",
  body: "No jargon, no chasing. Here is exactly what happens once you get in touch.",
  cta: { label: "Start my trip", href: "/start" },
  /** Sits behind the whole panel, heavily dimmed — texture, not subject. */
  background: {
    src: "/images/journey/panel.jpg",
    alt: "",
  },
  steps: [
    {
      day: 1,
      title: "Tell us the plan",
      body: "Where you want to go, roughly when, and which passport you hold. A short form or a quick call — five minutes either way.",
      image: {
        src: "/images/journey/plan.jpg",
        alt: "A world map and notebook laid out for trip planning",
      },
    },
    {
      day: 2,
      title: "We map the route",
      body: "We work out what you actually need and in what order: passport first if it is missing, then the right visa, then flights and a place to stay. You get one clear list.",
      image: {
        src: "/images/journey/route.jpg",
        alt: "A route traced across a map",
      },
    },
    {
      day: 3,
      title: "We file and book",
      body: "We fill in the forms, submit them, and hold your seats and rooms at the price we quoted. You approve once — we chase everything after that.",
      image: {
        src: "/images/journey/documents.jpg",
        alt: "Documents being prepared and signed at a desk",
      },
    },
    {
      day: 4,
      title: "You travel",
      body: "Approvals, tickets and your day-by-day plan all in one place, with your consultant on WhatsApp the whole way there and back.",
      image: {
        src: "/images/journey/travel.jpg",
        alt: "An airliner climbing away after takeoff",
      },
    },
  ],
} as const;

/** Service 2 — sells speed and reliability. */
/** Service 3 — not open yet. Sold on speed. */
export const flightsHotels = {
  eyebrow: "Flights & Hotels",
  headingLead: "Flights and rooms,",
  headingAccent: "sorted in hours.",
  body: "Send us your dates and we come back the same day with real prices, not an estimate. We hold the seat and the room while you think about it, so nothing goes up in price while you decide.",
  comingSoon: true,
  notice: "Not open yet. Passports and visas are live today.",
  cta: { label: "See how it will work", href: "/services/flights" },
  stats: [
    { value: "4 hrs", label: "Typical time to get your prices" },
    { value: "24/7", label: "Someone to call if a flight changes" },
    { value: "0", label: "Extra fees added at the end" },
  ],
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
/** Service 4 — not open yet. Sold on curation. */
export const experiences = {
  eyebrow: "Tours & Experiences",
  headingLead: "The trip itself,",
  headingAccent: "planned properly.",
  body: "Days worth remembering, booked before you land: a guide who actually knows the place, tickets that skip the queue, and a plan that leaves room to do nothing.",
  comingSoon: true,
  notice: "Not open yet. Passports and visas are live today.",
  cta: { label: "See how it will work", href: "/services/experiences" },
  highlights: [
    "Private guides and drivers",
    "Tickets booked ahead, no queues",
    "Small groups, not coach parties",
    "Or built entirely around you",
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
  headingLead: "Tell us where you want",
  headingAccent: "to go.",
  body: "Passport, visa, flights, hotel, the days in between — you do not have to know which parts you need. Answer a few questions and we will tell you exactly what applies to you, in the order it has to happen, and what each step costs.",
  getInTouch: "Or just talk to someone",
  background: {
    src: "/images/contact.jpg",
    alt: "A coastline silhouetted against a golden sunset",
  },
  whatsappLabel: "Chat with us on WhatsApp",
  primary: {
    title: "Start my trip",
    body: "Two questions about where you are going, then a few about what you already have. Takes a minute, and there is nothing to pay.",
    cta: "Start my trip",
    href: "/start",
  },
  /** Every service, so nobody has to guess which door is theirs. */
  services: [
    { label: "Passport application", href: "/passport", status: "live" },
    { label: "Visa application", href: "/apply", status: "live" },
    { label: "Flight booking", href: "/services/flights", status: "soon" },
    { label: "Hotel booking", href: "/services/hotels", status: "soon" },
    { label: "Tours & experiences", href: "/services/experiences", status: "soon" },
    { label: "Track an application", href: "/track", status: "live" },
  ],
  assurances: [
    "We reply the same working day",
    "Fixed price, quoted up front",
    "Licensed and registered agents",
  ],
} as const;

export const faq = {
  eyebrow: "Questions",
  headingLead: "Things people ask",
  headingAccent: "before they book.",
  body: "Short answers, no jargon.",
  items: [
    {
      question: "What is the difference between a passport and a visa?",
      answer:
        "Your passport is your own country saying who you are — you need it before anything else, and it is the booklet everything gets stamped into. A visa is a different country giving you permission to enter, and it goes inside that passport. So passport first, always, then the visa.",
    },
    {
      question: "Which visa do I actually need?",
      answer:
        "It depends on three things: the passport you hold, where you are going, and why. The rules change more often than most people expect. Send us those three details and we will tell you whether it is an eVisa, a T.Visa or just an ETA — usually the same working day, and before you pay us anything.",
    },
    {
      question: "My passport expires next year. Is that a problem?",
      answer:
        "Probably, yes. Most countries want at least six months left on your passport on the day you arrive, and many will refuse a visa outright if it is running out. If yours expires within six months of your trip, renew it first — we can start that today.",
    },
    {
      question: "What does it cost, and when do I pay?",
      answer:
        "You get one fixed price up front, split into our fee and the government's fee so you can see both. Nothing is payable until you have seen and agreed that number. The price you agree is the price you pay.",
    },
    {
      question: "What if my visa is refused?",
      answer:
        "We read the refusal letter with you, work out exactly what caused it, and rebuild the application before trying again. If the refusal was down to a mistake on our side, we redo it at no extra charge.",
    },
    {
      question: "Can you do the whole trip, not just the paperwork?",
      answer:
        "That is the plan. Passports and visas are live now; flights, hotels and tours are opening soon. When they are, one person will handle everything from your passport to your last day away, so nothing falls between two companies.",
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
        "My visa had been refused once before. E-Embassy found the exact line that caused it, rebuilt the application, and it was approved in under three weeks.",
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
