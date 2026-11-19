"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Confirmation for anything that can't be taken back or that tells an
 * applicant something. WorldStreet's rules, adopted here:
 * - the title names the action and its object ("Delete GTBank account?");
 * - the description states the consequence and whether it can be undone;
 * - the destructive button says what it does, next to a quiet "Keep";
 * - it's a centred dialog on desktop and a bottom sheet on phones.
 *
 * Pass `children` for the inputs a decision needs (a reason, an amount); the
 * caller keeps `confirmDisabled` true until they are valid.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Keep",
  tone = "danger",
  onConfirm,
  isPending = false,
  confirmDisabled = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  onConfirm: () => void;
  isPending?: boolean;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (!isPending ? onOpenChange(next) : undefined)}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-2xl max-sm:rounded-b-none",
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {children}

        <DialogFooter className="gap-2 max-sm:flex-col-reverse">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="max-sm:w-full"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "destructive" : "primary"}
            onClick={onConfirm}
            isLoading={isPending}
            disabled={confirmDisabled}
            className="max-sm:w-full"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
