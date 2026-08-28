"use client";

import * as React from "react";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Copy } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { useSubmitPassportEnquiry } from "@/features/passport/api/submit-passport";
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
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Nationality</FormLabel>
                  <FormControl>
                    <Input placeholder="Nigerian" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
