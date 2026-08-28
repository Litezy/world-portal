"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { applications as copy, applicationStatusLabels } from "@/content/admin";
import { useUpdateApplication } from "@/features/applications/api/use-update-application";
import { ApiError } from "@/lib/api-client";
import type { ApplicationStatus } from "@/types";
import {
  applicationStatusValues,
  type UpdateApplicationInput,
  updateApplicationSchema,
} from "@/validations/admin";

export function AdvanceApplicationForm({
  id,
  status,
}: {
  id: string;
  status: ApplicationStatus;
}) {
  const update = useUpdateApplication(id);
  const form = useForm<UpdateApplicationInput>({
    resolver: zodResolver(updateApplicationSchema),
    defaultValues: { status, note: "" },
  });

  async function onSubmit(values: UpdateApplicationInput) {
    try {
      await update.mutateAsync(values);
      form.reset({ status: values.status, note: "" });
      toast.success("Application updated");
    } catch (error) {
      toast.error("Could not update the application", {
        description:
          error instanceof ApiError ? error.message : "Please try again shortly.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.detail.advance}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {applicationStatusValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {applicationStatusLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.detail.noteLabel}</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder={copy.detail.notePlaceholder}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="md"
          isLoading={update.isPending}
          loadingText="Saving"
          className="w-full"
        >
          {copy.detail.updateLabel}
        </Button>
      </form>
    </Form>
  );
}
