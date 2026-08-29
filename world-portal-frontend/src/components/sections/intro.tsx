import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { intro } from "@/content/landing";
import { cn } from "@/lib/utils";

/** Position classes keyed to the four corners the thumbnails occupy. */
const placement: Record<string, string> = {
  "top-left": "left-0 top-2 lg:left-4 xl:left-10",
  "top-right": "right-0 top-2 lg:right-4 xl:right-10",
  "bottom-left": "left-[12%] bottom-0 lg:left-[16%]",
  "bottom-right": "right-[12%] bottom-0 lg:right-[16%]",
};

export function Intro() {
  return (
    <Section spacing="lg">
      <Container className="relative">
        {/* Thumbnails float around the copy on desktop and become a row below it
            on small screens, where absolute placement would collide. */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          {intro.thumbnails.map((t, i) => (
            <ParallaxImage
              key={t.src}
              src={t.src}
              alt={t.alt}
              fill
              sizes="140px"
              // Alternating strengths so the four never drift in lockstep.
              strength={i % 2 === 0 ? 16 : 9}
              className={cn(
                "absolute size-[120px] rounded-2xl shadow-[0_2px_8px_-2px_rgba(12,14,18,0.18),0_18px_36px_-20px_rgba(12,14,18,0.4)] xl:size-[132px]",
                placement[t.position],
              )}
            />
          ))}
        </div>

        <Reveal
          stagger={0.12}
          className="mx-auto max-w-[560px] py-4 text-center lg:py-16"
        >
          <h2 className="text-[30px] leading-[1.14] font-semibold tracking-[-0.035em] text-balance text-ink-900 sm:text-[38px]">
            {intro.headingLead} {intro.headingBreak}{" "}
            <span className="heading-serif font-normal">{intro.headingAccent}</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-pretty text-muted-foreground">
            {intro.body}
          </p>
        </Reveal>

        <ul className="mt-10 grid grid-cols-4 gap-3 lg:hidden">
          {intro.thumbnails.map((t) => (
            <li key={t.src}>
              <ParallaxImage
                src={t.src}
                alt={t.alt}
                fill
                sizes="24vw"
                strength={10}
                className="aspect-square rounded-2xl shadow-[0_2px_8px_-2px_rgba(12,14,18,0.18)]"
              />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
