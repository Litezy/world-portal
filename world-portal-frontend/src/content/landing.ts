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

/** The five weather glyphs the hero forecast card knows how to draw. */
export type ForecastIcon = "sun" | "cloud-sun" | "cloud" | "rain" | "storm";

export const hero = {
  badge: "Passports · Visas · Flights · Stays",
  headingLead: "The world is closer",
  headingAccent: "than you think.",
  lead: "Tell us where you want to go. We sort out the passport, the visa, the flights and the hotel — so you just pack.",
  navCta: { label: "Get started", href: "/start" },
  /**
   * Under the flight search, for anyone who is not booking a seat yet. The
   * search itself is the hero's first action now (the CTO, 2026-11-09:
   * "let it look like you're already ready to book your flight").
   */
  planLink: {
    lead: "Only need a passport or visa?",
    label: "Start here",
    href: "/start",
  },
  /** Phones: the booking sheet that rises once the paper plane has landed. */
  sheet: {
    title: "Book a flight",
  },
  /**
   * "Cleared for take-off": the scene behind the copy. A visa form gets
   * stamped, folds into a paper plane as the visitor scrolls, and flies
   * through the cloud to the lagoon. All of it is decoration (aria-hidden).
   */
  scene: {
    // The opening sky, and the LCP image. Generated with Antigravity
    // (2026-11-08): late-morning daylight just above a cumulus deck, a low
    // flat horizon with the reef showing on the right, open sky for the
    // headline and the paper. Upscaled 2x (Lanczos3, light sharpen) to
    // 2752 x 1536 and saved at q88, so a 1536 px laptop at DPR 2 is not
    // stretching a 1376 px plate.
    sky: "/images/hero/sky-day.jpg",
    // Greyscale cumulus plates (Antigravity, 2026-11-07), the same cloud type
    // as the sky's deck, used as luminance masks so their dark gaps are
    // see-through; hero.module.css colours them for daylight. The near ones
    // are blurred.
    clouds: {
      body: "/images/hero/arrival-clouds.jpg",
      matte: "/images/hero/arrival-clouds-matte.jpg",
      nearWisps: "/images/hero/near-wisps.jpg",
      nearBank: "/images/hero/near-bank.jpg",
    },
    // The folded plane mid-glide, rendered from the hero's own 3D scene (in
    // its daylight, 2026-11-08) at 2x and trimmed. It is the whole plane
    // under reduced motion, and the fallback without WebGL.
    still: "/images/hero/paper-plane-day.webp",
  },
  /** Where the flight lands: revealed under the cloud at the end. */
  image: {
    // Generated with Antigravity (2026-11-08) in the same shoot as the sky:
    // the same late-morning light and the same soft cumulus, so the flight
    // lands in the world it took off from. Upscaled 2x like the sky, q77.
    // `LAGOON` in hero-paper.tsx holds where its villas are; move it with
    // the picture. A new filename rather than overwriting, because
    // next/image caches per format (see CLAUDE.md, "Swapping an image?").
    src: "/images/hero/lagoon-day.jpg",
    alt: "Thatched overwater villas curving across a turquoise Maldives lagoon in morning sun, seen from the air",
  },
  /**
   * Static placeholder copy for the hero forecast card — a hand-written sample
   * of the destination it pictures, not a live weather feed. Nothing here is
   * fetched, and no API is wired up behind it. If a real forecast service ever
   * lands, replace this object with the response rather than assuming these
   * figures update themselves.
   */
  forecast: {
    eyebrow: "Right now in",
    place: "Malé",
    region: "Maldives",
    condition: "Clear skies",
    temperature: 29,
    unit: "°C",
    local: "14:20 local",
    metrics: [
      { label: "Humidity", value: "78%" },
      { label: "Wind", value: "14 km/h" },
      { label: "UV", value: "11 · Extreme" },
    ],
    days: [
      { day: "Mon", icon: "sun", high: 31, low: 27 },
      { day: "Tue", icon: "cloud-sun", high: 31, low: 27 },
      { day: "Wed", icon: "rain", high: 30, low: 26 },
      { day: "Thu", icon: "storm", high: 29, low: 26 },
      { day: "Fri", icon: "cloud-sun", high: 30, low: 27 },
    ],
    note: "January to April is the dry season — calm water, and far fewer afternoon showers.",
  },
} as const;

export const intro = {
  headingLead: "Travelling abroad takes",
  headingBreak: "a lot of paperwork —",
  headingAccent: "we do it for you.",
  body: "A passport. Then a visa. Then a flight and somewhere to stay. Most people give up somewhere in the middle. Tell us where you are going and we handle every step, in the right order, and tell you what is happening as it happens.",
  /**
   * One photograph per step of the route the body copy describes (passport,
   * visa, flight, stay), in that order. Generated with Antigravity
   * (2026-11-07) to show the step itself; the landscapes that used to sit
   * here (temple.jpg and co.) did not match their labels and still serve
   * WorldSpace.
   */
  thumbnails: [
    {
      src: "/images/intro/passport.jpg",
      alt: "A plain navy passport on a linen bedspread beside sunglasses and a folded map",
      position: "top-left",
    },
    {
      src: "/images/intro/visa.jpg",
      alt: "An open passport page covered in colourful entry stamps, with a rubber stamp beside it",
      position: "top-right",
    },
    {
      src: "/images/intro/flight.jpg",
      alt: "An aircraft wing over a sea of clouds at golden hour, seen through the cabin window",
      position: "bottom-left",
    },
    {
      src: "/images/intro/stay.jpg",
      alt: "An overwater villa bedroom with its doors open onto a turquoise lagoon",
      position: "bottom-right",
    },
  ],
} as const;

export const whyUs = {
  eyebrow: "Why E-Embassy",
  headingLead: "Why people let us",
  headingAccent: "do it for them.",
  body: "Because chasing embassies, forms and fares is a full-time job, and you already have one.",
  /** The words in `body` that get the gold marker stroke as it inks in. Must occur in `body`. */
  bodyMark: "a full-time job",
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
  /**
   * The destination picker. Which visa a destination needs comes from the
   * application's own ruleset (`resolveVisaRoute` in
   * src/features/visa/requirement.ts), for the passport below — the same one
   * the example trip in `journey.demo` uses. Nothing here states a requirement
   * of its own.
   *
   * The destinations are the pairs that ruleset gets right for a Nigerian
   * passport. Its ETA list (UK, US, Canada…) is for visa-exempt passports, so
   * no ETA destination is offered here: the ETA card is reached from the deck.
   */
  picker: {
    passport: "NG",
    prompt: "Where are you going?",
    passportNote: "On a Nigerian passport",
    destinations: [
      { code: "AE", city: "Dubai" },
      { code: "FR", city: "Paris" },
      { code: "IN", city: "Delhi" },
      { code: "ZA", city: "Cape Town" },
      { code: "TH", city: "Bangkok" },
      { code: "GH", city: "Accra" },
    ],
    resultLabel: "What happens next",
    note: "Based on the usual rules for this pair. A consultant confirms it against the current requirements before anything is filed — and before you pay.",
    browsing: "Pick a destination to see which of the three applies to you.",
    visaFree: "No visa needed",
    deckLabel: "The three kinds of visa",
    showCard: "Show",
    previous: "Previous visa",
    next: "Next visa",
  },
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
        alt: "Automated immigration gates in an airport arrivals hall",
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
  /**
   * The passport drawn beside the three situations, filling in as they scroll
   * past. Illustration only: every value is specimen data, the page says
   * "Specimen" on its face, and the drawing is hidden from assistive tech
   * behind `description`. Never wire it to a record.
   */
  specimen: {
    description:
      "Illustration of a specimen passport: the photo and details fill in, the dates renew, and an issued stamp lands on the visa page.",
    watermark: "Specimen",
    title: "Passport",
    visaPage: "Visas",
    fields: {
      surname: { label: "Surname", value: "SPECIMEN" },
      given: { label: "Given names", value: "YOUR NAME" },
      birth: { label: "Date of birth", value: "01 JAN 1995" },
      number: { label: "Passport no.", value: "A00000000", renewed: "B00000000" },
      issue: { label: "Date of issue", value: "12 MAR 2016", renewed: "12 MAR 2026" },
      expiry: { label: "Date of expiry", value: "12 MAR 2026", renewed: "12 MAR 2036" },
    },
    mrz: [
      "P<<<SPECIMEN<<YOUR<NAME<<<<<<<<<<<<<<<<<<<<<",
      "B00000000<0<<<9501010<3603120<<<<<<<<<<<<<<0",
    ],
    stamp: { word: "Issued", detail: "E-Embassy" },
  },
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
  /** Sits behind the whole panel in dark, heavily dimmed — texture, not subject. */
  background: {
    src: "/images/journey/panel.jpg",
    alt: "",
  },
  /** The light theme's texture: the hero's daylight sky, under a pale wash. */
  backgroundDay: {
    src: "/images/hero/sky-day.jpg",
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
  /**
   * The example trip the section plays through, one mock-up per step.
   *
   * Every value here is illustrative sample data, exactly like
   * `hero.forecast`: not a booking, not a record and not a live status. The
   * stage always shows the `label` chip so it can never be read as one, and
   * the mock-ups are hidden from assistive tech behind `description`. Edit it
   * like the rest of the copy; never wire it to an API.
   */
  demo: {
    label: "Example trip",
    description:
      "Illustration of an example trip from Lagos to Dubai moving through the four steps. Sample details only, not a real booking.",
    from: { city: "Lagos", code: "LOS", country: "NG" },
    to: { city: "Dubai", code: "DXB", country: "AE" },
    dates: "12–19 Mar",
    /** Step 1 — the trip request filling in. */
    plan: {
      title: "Plan a trip",
      subtitle: "About five minutes",
      draft: "Draft",
      sent: "Sent",
      labels: {
        from: "From",
        to: "To",
        dates: "Dates",
        travellers: "Travellers",
        passport: "Passport",
      },
      travellers: "1 adult",
      passport: "Nigerian",
      action: "Send my plan",
      confirmation: "Sent to your consultant",
      confirmationTime: "Just now",
    },
    /** Step 2 — the route checklist, in the order it has to happen. */
    route: {
      title: "Your route",
      count: "4 items",
      next: "Next",
      items: [
        { key: "passport", label: "Passport", detail: "Valid until 2029" },
        { key: "visa", label: "Visa", detail: "Tourist eVisa · 3–7 days" },
        { key: "flight", label: "Flight", detail: "LOS → DXB" },
        { key: "stay", label: "Stay", detail: "7 nights" },
      ],
      note: "One clear list, in the order it has to happen.",
    },
    /** Step 3 — the application moving to approved, seats and rooms held. */
    filing: {
      title: "UAE eVisa",
      subtitle: "Tourist visa",
      statuses: ["Submitted", "Under review", "Approved"],
      stages: ["Filed", "Review", "Decision"],
      outcome: "Outcome",
      awaiting: "Awaiting decision",
      stamp: "Approved",
      holds: [
        { key: "seat", label: "Seat held", detail: "LOS → DXB · 12 Mar" },
        { key: "room", label: "Room held", detail: "7 nights · 12–19 Mar" },
      ],
    },
    /** Step 4 — the boarding pass, the consultant's message, the plan. */
    travel: {
      pass: {
        title: "Boarding pass",
        date: "12 Mar",
        details: [
          { label: "Date", value: "12 Mar" },
          { label: "Gate", value: "E14" },
          { label: "Seat", value: "23A" },
          { label: "Boards", value: "08:40" },
        ],
      },
      message: {
        from: "Your consultant",
        channel: "WhatsApp",
        // A no-break space keeps the plane on the same line as "travels".
        body: "Your visa is approved. Safe travels ✈",
        time: "09:12",
      },
      plan: {
        title: "Day by day",
        days: [
          { day: "Day 1", text: "Land, check in, marina walk" },
          { day: "Day 2", text: "Old Dubai and the souks" },
          { day: "Day 3", text: "An evening in the desert" },
        ],
      },
    },
  },
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
  /**
   * The stage: a boarding pass that tears away, as you scroll, to the room key
   * under it. Same example trip as `journey.demo` (Lagos → Dubai, 12–19 Mar),
   * sample details only and always labelled as an example.
   */
  stage: {
    label: "Example booking",
    description:
      "Illustration of an example booking: a boarding pass from Lagos to Dubai that gives way, as you scroll, to the room key for the stay. Sample details only, not a real booking.",
    pass: {
      kicker: "Boarding pass",
      step: "The seat",
      from: { code: "LOS", city: "Lagos" },
      to: { code: "DXB", city: "Dubai" },
      rows: [
        { label: "Date", value: "12 Mar" },
        { label: "Seat", value: "23A" },
        { label: "Gate", value: "E14" },
        { label: "Boards", value: "08:40" },
      ],
      note: "Fare held at today's price",
      image: {
        src: "/images/intro/flight.jpg",
        alt: "The view from a window seat: a wing over the clouds at golden hour",
      },
    },
    room: {
      kicker: "Room key",
      step: "The room",
      name: "Ocean villa",
      place: "Dubai · 7 nights",
      rows: [
        { label: "Check-in", value: "12 Mar" },
        { label: "Room", value: "1204" },
        { label: "Nights", value: "7" },
        { label: "Guests", value: "1 adult" },
      ],
      status: "Held while you decide",
      image: {
        src: "/images/stays/ocean-villa.jpg",
        alt: "A modern villa with a long infinity pool",
      },
    },
  },
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
  /**
   * The stacking cards, one per highlight and in the same order. Each slides
   * up over the one before it as the visitor scrolls.
   */
  stack: [
    {
      title: "Private guides and drivers",
      body: "Someone who knows the place meets you at arrivals and stays with you for the day, instead of a script read off a clipboard.",
      image: {
        src: "/images/gallery/3.jpg",
        alt: "A tiered temple against a misty mountain",
      },
    },
    {
      title: "Tickets booked ahead, no queues",
      body: "The ceremony, the gallery, the sunset slot: booked before you fly, so the day is spent there and not in a line.",
      image: {
        src: "/images/gallery/2.jpg",
        alt: "Dancers in ceremonial dress and gold headpieces",
      },
    },
    {
      title: "Small groups, not coach parties",
      body: "A handful of people on the terraces at first light, not a coachload, and a pace that leaves time to stop and look.",
      image: {
        src: "/images/gallery/5.jpg",
        alt: "Sunlight over palm-lined terraces",
      },
    },
    {
      title: "Or built entirely around you",
      body: "Tell us how you like to travel and we plan the days from scratch, slow mornings and empty afternoons included.",
      image: {
        src: "/images/gallery/1.jpg",
        alt: "A hut above a secluded beach with kayaks",
      },
      inset: {
        src: "/images/gallery/4.jpg",
        alt: "A clifftop temple above a breaking surf line",
      },
    },
  ],
} as const;

/**
 * Posts from WorldSpace, the sister platform under the same parent company.
 * The section is fed by `getWorldSpaceFeed()`, and falls back to curated
 * placeholder posts until the live feed exists — which is when
 * `placeholderNotice` is shown.
 *
 * The CTA carries a label and no href on purpose: WorldSpace lives at its own
 * origin, which differs per environment, so the URL is read from
 * `WORLDSPACE.exploreUrl` in `src/features/worldspace/config.ts` rather than
 * being written into copy.
 */
export const worldspace = {
  eyebrow: "From WorldSpace",
  headingLead: "Places other people",
  headingAccent: "have already been.",
  body: "WorldSpace is our sister platform, where travellers write up the trips they have actually taken. Open any post to read the whole thing over there.",
  cta: { label: "See more on WorldSpace" },
  placeholderNotice:
    "These are sample posts, standing in until the WorldSpace feed is connected.",
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
  /** The quiet way out under the heading, for a question that is not here. */
  more: { lead: "Something we have not covered?", cta: "Ask us on WhatsApp" },
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
