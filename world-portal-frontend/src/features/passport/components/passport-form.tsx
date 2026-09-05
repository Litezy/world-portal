"use client";

import * as React from "react";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, ChevronDown, Copy, Search } from "lucide-react";
import { type UseFormReturn, useForm, useWatch } from "react-hook-form";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { useSubmitPassportEnquiry } from "@/features/passport/api/submit-passport";
import { findNationality, nationalities } from "@/lib/nationalities";
import { cn } from "@/lib/utils";
import {
  passportApplicationTypes,
  type PassportEnquiryInput,
  passportEnquirySchema,
  passportTypeLabels,
} from "@/validations/passport";


const typeHints: Record<(typeof passportApplicationTypes)[number], string> = {
  new: "I have never had a passport",
  renewal: "Mine has expired, or expires soon",
  replacement: "Mine was lost, stolen or damaged",
};

export function PassportForm({
  defaultType,
}: {
  defaultType?: (typeof passportApplicationTypes)[number];
}) {
  const [reference, setReference] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const form = useForm<PassportEnquiryInput>({
    resolver: zodResolver(passportEnquirySchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      applicationType: defaultType ?? "new",
      fullName: "",
      email: "",
      phone: "",
      nationality: "",
      dateOfBirth: "",
      travelDate: "",
      notes: "",
      website: "",
    },
  });

  const selected = useWatch({ control: form.control, name: "applicationType" });
  const { mutateAsync, isPending } = useSubmitPassportEnquiry();

  async function onSubmit(values: PassportEnquiryInput) {
    try {
      const result = await mutateAsync(values);
      setReference(result.data.reference);
    } catch (error) {
      const fieldErrors = (error as { errors?: Record<string, string[]> }).errors;
      if (fieldErrors) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          form.setError(field as keyof PassportEnquiryInput, { message: messages[0] });
        }
        return;
      }
      toast.error("Could not send your request", {
        description:
          error instanceof Error ? error.message : "Please try again shortly.",
      });
    }
  }

  if (reference) {
    return (
      <Card
        variant="glass"
        radius="2xl"
        padding="none"
        className="p-8 text-center sm:p-10"
      >
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/15 text-success">
          <Check className="size-7" strokeWidth={2.5} />
        </span>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-ink-900">
          We have your details
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
          A consultant will call you within one working day to confirm which documents
          you need and book your appointment. Keep this reference.
        </p>

        <div className="mt-7 flex items-center justify-between gap-4 rounded-xl border border-primary/40 bg-primary/12 px-4 py-3.5">
          <span className="text-left">
            <span className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Your reference
            </span>
            <span className="font-mono text-[17px] font-semibold text-ink-900">
              {reference}
            </span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={copied ? <Check /> : <Copy />}
            onClick={() => {
              void navigator.clipboard?.writeText(reference);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="primary" size="md">
            <Link href="/apply">
              Now start your visa
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" size="md">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" radius="2xl" padding="none" className="p-6 sm:p-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5" noValidate>
          {/* Honeypot — hidden from people, irresistible to bots. */}
          <input
            {...form.register("website")}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
          />

          <FormField
            control={form.control}
            name="applicationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Which of these is you?</FormLabel>
                <div
                  role="radiogroup"
                  aria-label="Application type"
                  className="grid gap-2.5"
                >
                  {passportApplicationTypes.map((type) => {
                    const active = selected === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => field.onChange(type)}
                        className={cn(
                          "rounded-xl border px-4 py-3.5 text-left transition-all duration-300",
                          "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
                          active
                            ? "border-primary bg-primary/20"
                            : "border-border/70 bg-ink-50/60 hover:border-primary/50 hover:bg-primary/8",
                        )}
                      >
                        <span className="block text-[14px] font-semibold text-ink-900">
                          {passportTypeLabels[type]}
                        </span>
                        <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
                          {typeHints[type]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Phone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+234 801 234 5678"
                      autoComplete="tel"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PassportNationalitySelect form={form} />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="travelDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>When do you hope to travel?</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anything we should know?</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Previous passport number, urgency, where you live…"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="primary"
            size="block"
            isLoading={isPending}
            loadingText="Sending…"
            className="mt-1"
          >
            Send my details
          </Button>

          <Badge variant="muted" size="sm" className="mx-auto">
            No payment now — we confirm the price first
          </Badge>
        </form>
      </Form>
    </Card>
  );
}

function PassportNationalitySelect({
  form,
}: {
  form: UseFormReturn<PassportEnquiryInput>;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filteredNationalities = React.useMemo(() => {
    if (!query.trim()) return nationalities;
    const q = query.toLowerCase();
    return nationalities.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.country.toLowerCase().includes(q) ||
        n.code.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <FormField
      control={form.control}
      name="nationality"
      render={({ field }) => {
        const selected = findNationality(field.value);

        return (
          <FormItem className="flex flex-col">
            <FormLabel required>Nationality</FormLabel>
            <Popover
              open={open}
              onOpenChange={(next) => {
                setOpen(next);
                if (!next) setQuery("");
              }}
            >
              <PopoverTrigger asChild>
                <FormControl>
                  <button
                    type="button"
                    className={cn(
                      "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border/70 bg-ink-50/70 px-3.5 text-left transition-[color,box-shadow,background-color] outline-none",
                      "focus-visible:border-ring/60 focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-ring/25",
                      !field.value && "text-muted-foreground/70",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      {selected ? (
                        <>
                          <span aria-hidden="true" className="text-lg leading-none">
                            {selected.flag}
                          </span>
                          <span className="truncate text-[14px] text-ink-900">
                            {selected.name}
                          </span>
                        </>
                      ) : (
                        <span className="truncate text-[14px]">
                          {field.value || "Select nationality"}
                        </span>
                      )}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </FormControl>
              </PopoverTrigger>

              <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]"
              >
                <div className="border-b border-border p-2">
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search nationality..."
                    leftIcon={<Search />}
                    size="sm"
                  />
                </div>

                <ul className="max-h-64 overflow-y-auto p-1" role="listbox">
                  {filteredNationalities.length === 0 ? (
                    <li className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                      No nationality matches “{query}”.
                    </li>
                  ) : (
                    filteredNationalities.map((n) => (
                      <li key={n.code + n.name}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={field.value === n.name}
                          onClick={() => {
                            form.setValue("nationality", n.name, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                            setOpen(false);
                            setQuery("");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[14px] transition-colors hover:bg-secondary"
                        >
                          <span aria-hidden="true" className="text-base leading-none">
                            {n.flag}
                          </span>
                          <span className="flex-1 truncate text-ink-900">
                            {n.name} <span className="text-muted-foreground text-xs font-normal">({n.country})</span>
                          </span>
                          {field.value === n.name ? (
                            <Check className="size-4 text-primary" strokeWidth={3} />
                          ) : null}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

