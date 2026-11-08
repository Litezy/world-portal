import Link from "next/link";

import { Compass, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div
      className={cn(
        "flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center",
      )}
    >
      <div
        className={cn(
          "grid size-14 place-items-center rounded-full bg-primary/10 text-primary",
        )}
      >
        <Compass className={cn("size-7")} />
      </div>
      <div className={cn("space-y-2")}>
        <p className={cn("font-mono text-sm text-muted-foreground")}>404</p>
        <h1
          className={cn(
            "text-[26px] leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-ink-900 sm:text-[30px]",
          )}
        >
          This page took{" "}
          <span className={cn("heading-serif font-normal")}>a different route.</span>
        </h1>
        <p className={cn("max-w-md text-sm text-pretty text-muted-foreground")}>
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <div className={cn("flex flex-wrap justify-center gap-3")}>
        {/* asChild forwards a single child, so the icon lives inside the link. */}
        <Button asChild>
          <Link href="/">
            <Home className={cn("size-4")} />
            Back home
          </Link>
        </Button>
        {/* There is no /contact page; the contact band lives on the landing page. */}
        <Button asChild variant="outline">
          <Link href="/#contact">Contact us</Link>
        </Button>
      </div>
    </div>
  );
}
