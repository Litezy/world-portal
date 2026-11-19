"use client";

import * as React from "react";
import Link from "next/link";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { consoleError as copy } from "@/content/admin";

/**
 * The console's own boundary: it keeps the sidebar and topbar on screen, so a
 * crash in one page never strands staff on the site-wide error screen.
 */
export default function ConsoleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">{copy.title}</h1>
        <p className="max-w-md text-sm text-pretty text-muted-foreground">
          {copy.body}
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-muted-foreground">
            {copy.reference}: {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset} leftIcon={<RotateCcw />}>
          {copy.retry}
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">{copy.home}</Link>
        </Button>
      </div>
    </div>
  );
}
