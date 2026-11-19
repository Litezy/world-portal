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
import { homeFor } from "@/config/admin-navigation";
import { login } from "@/content/admin";
import { useLogin } from "@/features/auth/api/use-login";
import { ApiError } from "@/lib/api-client";
import { type LoginInput, loginSchema } from "@/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { mutateAsync, isPending, error, reset } = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: LoginInput) {
    try {
      const { data: user } = await mutateAsync(values);
      // Without a `next`, land on the first page this role can open: Overview
      // is desk-only, so a partner sent to /admin met "your role can't open
      // this" on every sign-in.
      router.replace(next && next.startsWith("/admin") ? next : homeFor(user.role));
      router.refresh();
    } catch {
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
              <FormLabel required>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@worldportal.travel"
                  className="rounded-md"
                  {...field}
                />
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
              <FormLabel required>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  className="rounded-md"
                  {...field}
                />
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
                Keep me signed in for a week
              </FormLabel>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="block"
          isLoading={isPending}
          loadingText="Signing in"
          className="mt-2 rounded-md"
        >
          {login.submitLabel}
          <ArrowRight />
        </Button>
      </form>
    </Form>
  );
}
