import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SectionHeadingProps = {
  /** Pill above the heading, e.g. "Destinations". */
  eyebrow?: string;
  /** Sans-serif first half of the heading. */
  lead: React.ReactNode;
  /** Serif-italic second half — the signature move in this design. */
  accent?: React.ReactNode;
  body?: React.ReactNode;
  align?: "left" | "center";
  /** Inverts colours for headings sitting on photography. */
  onDark?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  /** Heading level. Sections use h2; a page title is an h1. */
  as?: "h1" | "h2" | "h3";
  className?: string;
  children?: React.ReactNode;
};

const headingSize = {
  xs: "text-[24px] sm:text-[28px]",
  sm: "text-[26px] sm:text-3xl lg:text-[34px]",
  md: "text-[30px] sm:text-4xl lg:text-[44px]",
  lg: "text-[34px] sm:text-5xl lg:text-[56px]",
};

/**
 * The heading pattern used by every section: a pill eyebrow, a two-tone
 * headline that switches from sans to serif italic mid-sentence, and an
 * optional supporting line.
 */
export function SectionHeading({
  eyebrow,
  lead,
  accent,
  body,
  align = "left",
  onDark = false,
  size = "md",
  as: Heading = "h2",
  className,
  children,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={cn("flex flex-col", centered && "items-center text-center", className)}
    >
      {eyebrow ? (
        <Badge
          variant={onDark ? "eyebrow" : "eyebrow"}
          dot
          className="mb-4"
          dotClassName={onDark ? "bg-ink-900" : "bg-ink-900"}
        >
          {eyebrow}
        </Badge>
      ) : null}

      <Heading
        className={cn(
          "font-semibold tracking-[-0.03em] text-balance",
          headingSize[size],
          onDark ? "text-white" : "text-ink-900",
          centered ? "leading-[1.12]" : "leading-[1.08]",
        )}
      >
        {lead}
        {accent ? (
          <>
            {" "}
            <span className="heading-serif font-normal">{accent}</span>
          </>
        ) : null}
      </Heading>

      {body ? (
        <p
          className={cn(
            "mt-4 max-w-lg text-[15px] leading-relaxed text-pretty",
            onDark ? "text-white/80" : "text-muted-foreground",
            centered && "mx-auto",
          )}
        >
          {body}
        </p>
      ) : null}

      {children}
    </div>
  );
}
