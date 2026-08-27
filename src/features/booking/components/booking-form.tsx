"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MessageCircle } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
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
import { siteConfig } from "@/config/site";
import { contact } from "@/content/landing";
import { useSubmitBooking } from "@/features/booking/api/submit-booking";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { type BookingInput, bookingSchema } from "@/validations/booking";

/**
 * The glass enquiry card. The service chips at the top are the first thing you
 * touch, because which of the three services you need changes what we ask for
 * next — and it is the single field our consultants route on.
 */
export function BookingForm() {
  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      service: "visa",
      fullName: "",
      email: "",
      destination: "",
      travelDate: "",
      details: "",
      website: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { mutateAsync, isPending } = useSubmitBooking();
  const selected = useWatch({ control: form.control, name: "service" });

  async function onSubmit(values: BookingInput) {
    try {
      const result = await mutateAsync(values);
      toast.success("Request received", {
        description: `A consultant will reply within 24 hours. Reference ${result.data.reference}.`,
      });
      form.reset();
      // reset() leaves the form in its submitted state, so empty fields would
      // immediately re-validate and flash errors.
      form.clearErrors();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        for (const [field, messages] of Object.entries(error.errors)) {
          form.setError(field as keyof BookingInput, { message: messages[0] });
        }
        return;
      }
      toast.error("Could not send your request", {
        description:
          error instanceof Error ? error.message : "Please try again shortly.",
      });
    }
  }

  return (
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
          name="service"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>What do you need?</FormLabel>
              <div
                role="radiogroup"
                aria-label="Service"
                className="grid gap-2 sm:grid-cols-3"
              >
                {contact.services.map((service) => {
                  const active = selected === service.value;
                  return (
                    <button
                      key={service.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => field.onChange(service.value)}
                      className={cn(
                        "rounded-xl border px-3.5 py-3 text-left transition-all duration-300",
                        "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
                        active
                          ? "border-primary bg-primary/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                          : "border-border/70 bg-ink-50/60 hover:border-primary/50 hover:bg-primary/10",
                      )}
                    >
                      <span className="block text-[13px] font-semibold text-ink-900">
                        {service.label}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                        {service.hint}
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
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Destination</FormLabel>
                <FormControl>
                  <Input placeholder="Canada, UK, Japan…" {...field} />
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
                <FormLabel>Travel date</FormLabel>
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
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anything else we should know?</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Passport nationality, previous refusals, budget, who's travelling…"
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
          {contact.submitLabel}
        </Button>

        <a
          href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto inline-flex items-center gap-2 text-[13px] font-medium text-[#25a55f] transition-opacity hover:opacity-80"
        >
          <MessageCircle className="size-4" />
          {contact.whatsappLabel}
        </a>
      </form>
    </Form>
  );
}
