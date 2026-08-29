"use client";

import * as React from "react";

import { CheckCircle2, FileUp, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ACCEPT_ATTRIBUTE,
  useUploadDocument,
  validateFile,
} from "@/features/visa/api/upload";
import { cn } from "@/lib/utils";

export type DocumentFieldProps = {
  label: string;
  hint?: string;
  required?: boolean;
  value: string;
  onChange: (url: string) => void;
  error?: string;
};

/**
 * One document slot: pick a file, upload it immediately, and hand the returned
 * URL back to the form. Uploading on selection rather than on submit means a
 * failed upload is visible while the applicant is still looking at that field.
 */
export function DocumentField({
  label,
  hint,
  required,
  value,
  onChange,
  error,
}: DocumentFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const { mutateAsync, isPending } = useUploadDocument();
  const id = React.useId();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLocalError(null);

    const invalid = validateFile(file);
    if (invalid) {
      setLocalError(invalid);
      return;
    }

    try {
      const uploaded = await mutateAsync(file);
      setFileName(uploaded.originalName ?? file.name);
      onChange(uploaded.url);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "That upload failed. Please try again.",
      );
    }
  }

  function clear() {
    setFileName(null);
    setLocalError(null);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const shown = localError ?? error;

  return (
    <div className="grid gap-2">
      <label
        htmlFor={id}
        className="flex items-center gap-px text-[13px] font-semibold tracking-tight"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="text-ink-900">
            *
          </span>
        ) : null}
      </label>

      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border/70 bg-ink-50/70 px-3.5 py-3 transition-colors",
          value && "border-success/50 bg-success/8",
          shown && "border-destructive/60 bg-destructive/5",
        )}
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg",
            value ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground",
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : value ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <FileUp className="size-4" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-ink-900">
            {isPending
              ? "Uploading…"
              : (fileName ?? (value ? "Uploaded" : "No file chosen"))}
          </span>
          {hint && !shown ? (
            <span className="block text-[11.5px] text-muted-foreground">{hint}</span>
          ) : null}
        </span>

        {value && !isPending ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={clear}
            aria-label={`Remove ${label}`}
          >
            <X className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </Button>
        )}

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {shown ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {shown}
        </p>
      ) : null}
    </div>
  );
}
