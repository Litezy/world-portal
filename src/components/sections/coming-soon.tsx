import { Sparkles } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Shared treatment for the two services that are not open yet. The sections
 * keep their full layout — only the call to action changes, so the page never
 * dead-ends a visitor on something they cannot actually do.
 */
export function ComingSoonNotice({
  notice,
  className,
}: {
  notice: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/12 px-3.5 py-1.5 text-[12.5px] font-medium text-ink-900",
        className,
      )}
    >
      <Sparkles className="size-3.5 text-primary" />
      {notice}
    </p>
  );
}

/** A waitlist mailto rather than a live CTA, so the button still does something. */
export function waitlistHref(subject: string) {
  const body =
    "Please let me know when this service goes live. Thanks!\n\n— Sent from worldportal.travel";
  return `mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}
