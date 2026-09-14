"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail, KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAgencyLogin, useAgencySendOtp } from "@/features/agency/api/use-agency-auth";
import { ApiError } from "@/lib/api-client";
import { type AgencyLoginInput, agencyLoginSchema } from "@/validations/agency";

const copy = agencyAuth.login;

function safeNext(next: string | null) {
  return next && next.startsWith("/agency") ? next : "/agency";
}

export function AgencyLoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");

  const [otpSent, setOtpSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sendOtpMutation = useAgencySendOtp();
  const loginMutation = useAgencyLogin();

  const form = useForm<AgencyLoginInput>({
    resolver: zodResolver(agencyLoginSchema),
    defaultValues: { email: "", otp: "", remember: true },
  });

  async function handleSendOtp() {
    const isValidEmail = await form.trigger("email");
    if (!isValidEmail) return;

    const email = form.getValues("email");
    try {
      const res = await sendOtpMutation.mutateAsync({ email, intent: "login" });
      setOtpSent(true);
      setSuccessMessage(res.message || "Verification code sent to your email.");
    } catch (err) {
      if (err instanceof ApiError) {
        form.setError("email", { message: err.message });
      }
    }
  }

  async function onSubmit(values: AgencyLoginInput) {
    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    try {
      await loginMutation.mutateAsync(values);
      router.replace(safeNext(next));
      router.refresh();
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.errors) {
        for (const [field, messages] of Object.entries(submitError.errors)) {
          form.setError(field as keyof AgencyLoginInput, { message: messages[0] });
        }
        return;
      }
      form.setFocus("otp");
    }
  }

  const error = loginMutation.error || sendOtpMutation.error;
  const isPending = sendOtpMutation.isPending || loginMutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onChange={() => {
          if (loginMutation.error) loginMutation.reset();
          if (sendOtpMutation.error) sendOtpMutation.reset();
        }}
        className="grid gap-5"
        noValidate
      >
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof ApiError ? error.message : "Could not complete sign in."}
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{agencyAuth.fields.email}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="email"
                    autoComplete="email"
                    disabled={otpSent || isPending}
                    placeholder="agency@example.com"
                    {...field}
                  />
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

        {otpSent && (
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2.5 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal text-muted-foreground">
                  {agencyAuth.fields.remember}
                </FormLabel>
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
            className="mt-2"
          >
            <Mail className="mr-2 h-4 w-4" />
            {copy.sendOtpLabel}
          </Button>
        ) : (
          <Button
            type="submit"
            size="block"
            isLoading={loginMutation.isPending}
            loadingText="Signing in"
            className="mt-2"
          >
            <KeyRound className="mr-2 h-4 w-4" />
            {copy.submitLabel}
            <ArrowRight />
          </Button>
        )}

        <p className="text-center text-[12px] text-muted-foreground">{copy.hint}</p>
      </form>
    </Form>
  );
}
