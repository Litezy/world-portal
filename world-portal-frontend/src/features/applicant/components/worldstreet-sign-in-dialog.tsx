"use client";

import { usePathname } from "next/navigation";

import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WORLDSTREET_SIGN_UP_URL, worldStreetSignInUrl } from "@/config/auth";
import { worldStreetSignIn as copy } from "@/content/applicant";

/**
 * Sends the applicant to WorldStreet to sign in. E-Embassy has no login of
 * its own: WorldStreet signs them in and returns them to `returnTo` (the
 * current page by default), already authenticated here.
 */
export function WorldStreetSignInDialog({
  open,
  onOpenChange,
  returnTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnTo?: string;
}) {
  const pathname = usePathname();
  const target = returnTo ?? pathname ?? "/";
  const signUpUrl = new URL(WORLDSTREET_SIGN_UP_URL);
  if (typeof window !== "undefined") {
    signUpUrl.searchParams.set(
      "redirect_url",
      new URL(target, window.location.origin).toString(),
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="eyebrow" dot>
              {copy.eyebrow}
            </Badge>
          </div>
          <DialogTitle className="text-[20px] font-semibold text-ink-900">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            {copy.body}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-3">
          <Button asChild variant="primary" size="md" fullWidth>
            <a href={worldStreetSignInUrl(target)}>
              {copy.signInLabel}
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
          <p className="text-center text-[12.5px] text-muted-foreground">
            {copy.signUpPrompt}{" "}
            <a
              href={signUpUrl.toString()}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {copy.signUpLabel}
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
