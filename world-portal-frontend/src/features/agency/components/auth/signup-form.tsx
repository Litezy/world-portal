"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail, KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { agencyAuth } from "@/content/agency";
import { useAgencySendOtp, useAgencySignup } from "@/features/agency/api/use-agency-auth";
import { CountrySelect } from "@/features/trip/components/country-select";
import { ApiError } from "@/lib/api-client";
import { countryName } from "@/lib/countries";
import { type AgencySignupInput, agencySignupSchema } from "@/validations/agency";

const copy = agencyAuth.signup;

function safeNext(next: string | null) {
  return next && next.startsWith("/agency") ? next : "/agency";
}

export function AgencySignupForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");

  const [otpSent, setOtpSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sendOtpMutation = useAgencySendOtp();
  const signupMutation = useAgencySignup();

  const form = useForm<AgencySignupInput>({
    resolver: zodResolver(agencySignupSchema),
    defaultValues: {
      agencyName: "",
      contactName: "",
      email: "",
      phone: "",
      countryCode: "",
      country: "",
      otp: "",
    },
  });

  async function handleSendOtp() {
    const isStep1Valid = await form.trigger([
      "agencyName",
      "contactName",
      "email",
      "phone",
      "countryCode",
      "country",
    ]);

    if (!isStep1Valid) return;

    const email = form.getValues("email");
    try {
      const res = await sendOtpMutation.mutateAsync({ email, intent: "signup" });
      setOtpSent(true);
      setSuccessMessage(res.message || "Verification code sent to your email.");
    } catch (err) {
      if (err instanceof ApiError) {
        form.setError("email", { message: err.message });
      }
    }
  }

  async function onSubmit(values: AgencySignupInput) {
    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    try {
      await signupMutation.mutateAsync(values);
      router.replace(safeNext(next));
      router.refresh();
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.errors) {
        for (const [field, messages] of Object.entries(submitError.errors)) {
          form.setError(field as keyof AgencySignupInput, { message: messages[0] });
        }
        return;
      }
      form.setFocus("otp");
    }
  }

  const error = signupMutation.error || sendOtpMutation.error;
  const isPending = sendOtpMutation.isPending || signupMutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onChange={() => {
          if (signupMutation.error) signupMutation.reset();
          if (sendOtpMutation.error) sendOtpMutation.reset();
        }}
        className="grid gap-5"
        noValidate
      >
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof ApiError
                ? error.message
                : "Could not create your account."}
            </AlertDescription>
          </Alert>
        ) : null}

        {successMessage && !error ? (
          <Alert variant="default" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="agencyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{agencyAuth.fields.agencyName}</FormLabel>
              <FormControl>
                <Input autoComplete="organization" disabled={otpSent || isPending} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{agencyAuth.fields.contactName}</FormLabel>
                <FormControl>
                  <Input autoComplete="name" disabled={otpSent || isPending} {...field} />
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
                <FormLabel required>{agencyAuth.fields.phone}</FormLabel>
                <FormControl>
                  <Input type="tel" autoComplete="tel" disabled={otpSent || isPending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{agencyAuth.fields.email}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type="email" autoComplete="email" disabled={otpSent || isPending} {...field} />
                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary underline"
                    >
                      Change
                    </button>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="countryCode"
          render={({ field }) => (
            <FormItem>
              <CountrySelect
                label={agencyAuth.fields.country}
                value={field.value}
                onChange={(code) => {
                  field.onChange(code);
                  form.setValue("country", countryName(code), {
                    shouldValidate: true,
                    });
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {otpSent && (
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{agencyAuth.fields.otp}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="000000"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!otpSent ? (
          <Button
            type="button"
            size="block"
            onClick={handleSendOtp}
            isLoading={sendOtpMutation.isPending}
            loadingText="Sending code"
            className="mt-1"
          >
            <Mail className="mr-2 h-4 w-4" />
            {copy.sendOtpLabel}
          </Button>
        ) : (
          <Button
            type="submit"
            size="block"
            isLoading={signupMutation.isPending}
            loadingText="Creating your account"
            className="mt-1"
          >
            <KeyRound className="mr-2 h-4 w-4" />
            {copy.submitLabel}
            <ArrowRight />
          </Button>
        )}

        <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
          {copy.consent}
        </p>

        <p className="text-center text-[12px] text-muted-foreground">{copy.hint}</p>
      </form>
    </Form>
  );
}
