import Link from "next/link";

import { Chip } from "@/ds/components/chip";
import { Icon } from "@/ds/components/icon";
import { cn } from "@/lib/utils";

/**
 * Shared treatment for services that are not open yet. The sections keep their
 * full layout — only the call to action changes, and it still leads somewhere
 * real (the service's own page) rather than dead-ending the visitor.
 *
 * `soon` leads the line with the design system's "Coming soon" chip, which is
 * what Flights & Hotels and Experiences use so the two read as one family.
 * Without it (WorldSpace's sample-feed note) the line opens on an info glyph.
 * The notice is chip + text with no pill around it, so it can wrap on a phone
 * without a rounded box breaking in two.
 */
export function ComingSoonNotice({
  notice,
  soon = false,
  className,
  ...props
}: React.ComponentProps<"p"> & { notice: string; soon?: boolean }) {
  return (
    <p
      {...props}
      className={cn(
        "mt-6 inline-flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] leading-snug text-muted-foreground",
        className,
      )}
    >
      {soon ? (
        <Chip tone="brand" dot>
          Coming soon
        </Chip>
      ) : (
        <Icon name="info" size={18} />
      )}
      <span>{notice}</span>
    </p>
  );
}

/**
 * The one call to action a coming-soon section carries: a quiet ghost pill to
 * the service's explainer page. Never the blue primary — the service is not
 * bookable, so it must not compete with the live ones.
 */
export function ComingSoonLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("cx-btn cx-btn--ghost cx-btn--arrow", className)}>
      {label}
      <Icon name="arrow-right" tone="current" size={18} />
    </Link>
  );
}
