/**
 * The services that are not open yet. Each gets a real page rather than a dead
 * link, so a visitor who clicks always lands somewhere that explains what is
 * coming and gives them something to do in the meantime.
 */
export type ServicePage = {
  slug: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  intro: string;
  image: { src: string; alt: string };
  steps: { title: string; body: string }[];
  includes: string[];
  /** What they can actually do today. */
  meanwhile: { title: string; body: string; cta: string; href: string };
};

export const servicePages: ServicePage[] = [
  {
    slug: "flights",
    eyebrow: "Flights",
    title: "Flights, quoted",
    titleAccent: "the same day.",
    intro:
      "Send us your dates and where you are going. We come back with real prices — the fare, the taxes and our fee, all in one number — and hold the seat while you decide. No refreshing a booking site at midnight, and no price that changes at checkout.",
    image: {
      src: "/images/travel/flight-cloud.jpg",
      alt: "An airliner above a layer of cloud",
    },
    steps: [
      {
        title: "Tell us the dates",
        body: "Where from, where to, roughly when, and how many of you are travelling.",
      },
      {
        title: "We look at real fares",
        body: "Not just what a search engine shows. We check the routes that actually make sense for your visa and your connection times.",
      },
      {
        title: "You get one number",
        body: "Fare, taxes and our fee itemised. You will know exactly what you are paying for before you agree to anything.",
      },
      {
        title: "We hold it while you think",
        body: "The price does not move underneath you. Say yes and we ticket it; say no and nothing is lost.",
      },
    ],
    includes: [
      "Seats chosen for you, not left to chance",
      "Connections that leave enough time",
      "Someone to call if a flight is cancelled",
      "No booking fee added at the end",
    ],
    meanwhile: {
      title: "Sort your paperwork first",
      body: "There is no point booking a flight before you are allowed to enter the country. Get the passport and visa moving now and the flight is the easy part later.",
      cta: "Start my trip",
      href: "/start",
    },
  },
  {
    slug: "hotels",
    eyebrow: "Hotels",
    title: "Somewhere to stay",
    titleAccent: "that we have checked.",
    intro:
      "We do not just forward you a listings page. Every place we book has been vetted — location, cleanliness, whether the photos match the room — and we hold it at the price we quoted while you make up your mind.",
    image: {
      src: "/images/stays/ocean-villa.jpg",
      alt: "A modern villa with a long infinity pool",
    },
    steps: [
      {
        title: "Tell us how you travel",
        body: "Budget, area, whether you need to be near a station, an office, or the beach.",
      },
      {
        title: "We shortlist three",
        body: "Not thirty. Three places that fit, with the honest trade-off of each one spelled out.",
      },
      {
        title: "We hold your room",
        body: "At the quoted rate, while you decide. Cancellation terms in plain English before you commit.",
      },
      {
        title: "We confirm on arrival day",
        body: "So you are not the person standing at a reception desk that has no record of you.",
      },
    ],
    includes: [
      "Places we have actually vetted",
      "Cancellation terms explained up front",
      "Rooms held at the quoted price",
      "Someone to call if something is wrong on arrival",
    ],
    meanwhile: {
      title: "Sort your paperwork first",
      body: "Accommodation is often the last thing that matters and the first thing people book. Get your passport and visa underway and the rest falls into place.",
      cta: "Start my trip",
      href: "/start",
    },
  },
  {
    slug: "experiences",
    eyebrow: "Tours & Experiences",
    title: "The days themselves,",
    titleAccent: "planned properly.",
    intro:
      "The part of a trip you actually remember. Guides who know the place rather than a script, tickets bought ahead so you are not queueing, and a plan with enough room in it that you are not exhausted by day three.",
    image: {
      src: "/images/gallery/3.jpg",
      alt: "A tiered temple against a misty mountain",
    },
    steps: [
      {
        title: "Tell us what you enjoy",
        body: "Food, history, hiking, doing nothing at all. And who is coming — kids and grandparents change everything.",
      },
      {
        title: "We build a draft week",
        body: "Day by day, with travel time between things accounted for, and deliberate gaps.",
      },
      {
        title: "You cut what you do not want",
        body: "It is your holiday. We would rather you did four things properly than nine badly.",
      },
      {
        title: "We book everything ahead",
        body: "Guides, tickets, transfers. You get one itinerary with everything in it.",
      },
    ],
    includes: [
      "Private guides and drivers",
      "Timed tickets, no queueing",
      "Small groups, not coach parties",
      "Or built entirely around you",
    ],
    meanwhile: {
      title: "Sort your paperwork first",
      body: "None of it happens without permission to enter the country. Start there and we will have the fun part waiting when you are ready.",
      cta: "Start my trip",
      href: "/start",
    },
  },
];

export function findServicePage(slug: string) {
  return servicePages.find((s) => s.slug === slug);
}
