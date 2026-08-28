import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Shared treatment for services that are not open yet. The sections keep their
 * full layout — only the call to action changes, and it still leads somewhere
 * real (the service's own page) rather than dead-ending the visitor.
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
