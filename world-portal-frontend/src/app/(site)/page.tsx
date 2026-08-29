import { Contact } from "@/components/sections/contact";
import { Experiences } from "@/components/sections/experiences";
import { Faq } from "@/components/sections/faq";
import { FlightsHotels } from "@/components/sections/flights-hotels";
import { Hero } from "@/components/sections/hero";
import { Intro } from "@/components/sections/intro";
import { Journey } from "@/components/sections/journey";
import { Passports } from "@/components/sections/passports";
import { Visas } from "@/components/sections/visas";
import { WhyUs } from "@/components/sections/why-us";
import { buildMetadata } from "@/lib/seo";

// Parked, not deleted — the components still live in src/components/sections.
// import { Packages } from "@/components/sections/packages";
// import { Testimonials } from "@/components/sections/testimonials";

export const metadata = buildMetadata();

export default function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <WhyUs />

      {/* Live services, in the order they have to happen. */}
      <Passports />
      <Visas />

      {/* The process behind all of them */}
      <Journey />

      {/* Not open yet — full sections, waitlist CTAs */}
      <FlightsHotels />
      {/* <Packages /> */}
      {/* <Testimonials /> */}
      <Experiences />

      <Contact />
      <Faq />
    </>
  );
}
