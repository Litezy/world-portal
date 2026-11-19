"use client";

import { RotateCcw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { detailErrors } from "@/content/admin";

/**
 * A list that failed to load: say so and offer Retry in place, instead of
 * "refresh the page" — which throws away filters and scroll position.
 */
export function TableError({
  title,
  error,
  onRetry,
  isRetrying = false,
}: {
  title: string;
  error?: unknown;
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        {error instanceof Error ? error.message : detailErrors.failedBody}
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          isLoading={isRetrying}
          leftIcon={<RotateCcw />}
        >
          {detailErrors.retry}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
