import { Reveal } from "@/components/motion/reveal";
import { IntroRoute } from "@/components/sections/intro-route";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { intro } from "@/content/landing";

/** Keeps the em dash on the line it ends, instead of opening the next one. */
const keepDash = (text: string) => text.replace(/ —/g, " —");

/**
 * Editorial opener: the promise on the left, the plain-words explanation on
 * the right, then the route it describes (passport, visa, flight, stay) as
 * four photographs on separate depth planes over a self-drawing rail
 * (`IntroRoute`).
 */
export function Intro() {
  return (
    <Section spacing="lg" className="overflow-x-clip">
      <Container>
        <Reveal
          stagger={0.12}
          className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-x-12"
        >
          <SectionHeading
            lead={keepDash(`${intro.headingLead} ${intro.headingBreak}`)}
            accent={intro.headingAccent}
            size="lg"
            className="lg:col-span-7"
          />
          <p className="max-w-xl text-[16px] leading-[1.7] text-pretty text-muted-foreground sm:text-[17px] lg:col-span-5 lg:pb-1.5">
            {intro.body}
          </p>
        </Reveal>

        <IntroRoute />
      </Container>
    </Section>
  );
}
