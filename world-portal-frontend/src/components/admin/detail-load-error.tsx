"use client";

import Link from "next/link";

import { FileQuestion, RotateCcw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { detailErrors } from "@/content/admin";
import { ApiError } from "@/lib/api-client";

/**
 * What a detail page shows when its record did not load. A 404 is a dead link
 * or a deleted file — nothing to retry — so it gets a calm "not found" with a
 * way back. Anything else is an outage, so it says so and offers Retry instead
 * of telling the reader the record "may have been removed".
 */
export function DetailLoadError({
  error,
  onRetry,
  backHref,
  backLabel,
  noun,
}: {
  error: unknown;
  onRetry: () => void;
  backHref: string;
  backLabel: string;
  /** "application", "passport application" … used in the copy. */
  noun: string;
}) {
  const back = (
    <Button asChild variant="outline" size="sm">
      <Link href={backHref}>{backLabel}</Link>
    </Button>
  );

  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState
        icon={FileQuestion}
        title={detailErrors.notFoundTitle(noun)}
        description={detailErrors.notFoundBody}
        action={back}
      />
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>{detailErrors.failedTitle(noun)}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        {error instanceof Error ? error.message : detailErrors.failedBody}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCcw />}
          >
            {detailErrors.retry}
          </Button>
          {back}
        </div>
      </AlertDescription>
    </Alert>
  );
}
