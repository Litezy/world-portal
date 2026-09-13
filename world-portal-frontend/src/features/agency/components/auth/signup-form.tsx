"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
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
import { useAgencySignup } from "@/features/agency/api/use-agency-auth";
import { CountrySelect } from "@/features/trip/components/country-select";
import { ApiError } from "@/lib/api-client";
import { countryName } from "@/lib/countries";
import { type AgencySignupInput, agencySignupSchema } from "@/validations/agency";

const copy = agencyAuth.signup;

function safeNext(next: string | null) {
  return next && next.startsWith("/agency") ? next : "/agency";
}

/**
 * The first thing an agency owner ever fills in, so it asks for the least that
 * still identifies the business — everything else is collected later, in the
 * listing flow. The country is a searchable picker rather than free text: the
 * whole platform keys off ISO codes, and "UK" typed by hand matches nothing.
 */
export function AgencySignupForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { mutateAsync, isPending, error, reset } = useAgencySignup();

  const form = useForm<AgencySignupInput>({
    resolver: zodResolver(agencySignupSchema),
    defaultValues: {
      agencyName: "",
      contactName: "",
      email: "",
      phone: "",
      countryCode: "",
      country: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: AgencySignupInput) {
    try {
      await mutateAsync(values);
      router.replace(safeNext(next));
      router.refresh();
    } catch (submitError) {
      // 422 lights up the offending fields; a 409 (this email already has an
      // agency) stays at form level in the alert.
      if (submitError instanceof ApiError && submitError.errors) {
        for (const [field, messages] of Object.entries(submitError.errors)) {
          form.setError(field as keyof AgencySignupInput, { message: messages[0] });
        }
      }
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onChange={() => error && reset()}
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

        <FormField
          control={form.control}
          name="agencyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{agencyAuth.fields.agencyName}</FormLabel>
              <FormControl>
                <Input autoComplete="organization" {...field} />
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
                  <Input autoComplete="name" {...field} />
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
                  <Input type="tel" autoComplete="tel" {...field} />
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
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Two fields, one control: the code is what everything keys off, the
            name is what gets displayed. */}
        <FormField
          control={form.control}
          name="countryCode"
          render={({ field }) => (
            <FormItem>
              {/* No FormControl: CountrySelect renders and labels its own
                  trigger, so wrapping it in the Slot would only drop props. */}
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

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{agencyAuth.fields.password}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{agencyAuth.fields.confirmPassword}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          size="block"
          isLoading={isPending}
          loadingText="Creating your account"
          className="mt-1"
        >
          {copy.submitLabel}
          <ArrowRight />
        </Button>

        <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
          {copy.consent}
        </p>
      </form>
    </Form>
  );
}
