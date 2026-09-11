"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
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
import { useAgencyLogin } from "@/features/agency/api/use-agency-auth";
import { ApiError } from "@/lib/api-client";
import { type AgencyLoginInput, agencyLoginSchema } from "@/validations/agency";

const copy = agencyAuth.login;

/** Only ever send someone back inside the agency dashboard. */
function safeNext(next: string | null) {
  return next && next.startsWith("/agency") ? next : "/agency";
}

export function AgencyLoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { mutateAsync, isPending, error, reset } = useAgencyLogin();

  const form = useForm<AgencyLoginInput>({
    resolver: zodResolver(agencyLoginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: AgencyLoginInput) {
    try {
      await mutateAsync(values);
      router.replace(safeNext(next));
      router.refresh();
    } catch (submitError) {
      // A 422 carries a field map; anything else (a 401 for bad credentials)
      // stays at form level in the alert above.
      if (submitError instanceof ApiError && submitError.errors) {
        for (const [field, messages] of Object.entries(submitError.errors)) {
          form.setError(field as keyof AgencyLoginInput, { message: messages[0] });
        }
        return;
      }
      form.setFocus("password");
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
              {error instanceof ApiError ? error.message : "Could not sign you in."}
            </AlertDescription>
          </Alert>
        ) : null}

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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{agencyAuth.fields.password}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <Button
          type="submit"
          size="block"
          isLoading={isPending}
          loadingText="Signing in"
          className="mt-2"
        >
          {copy.submitLabel}
          <ArrowRight />
        </Button>

        <p className="text-center text-[12px] text-muted-foreground">{copy.hint}</p>
      </form>
    </Form>
  );
}
