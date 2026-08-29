"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { applications as copy, visaStatusLabels } from "@/content/admin";
import { useUpdateApplication } from "@/features/applications/api/use-update-application";
import { ApiError } from "@/lib/api-client";
import { type VisaStatus, visaStatusValues } from "@/server/data/backend-types";
import {
  type UpdateVisaStatusInput,
  updateVisaStatusSchema,
} from "@/validations/admin";

export function AdvanceApplicationForm({
  id,
  status,
}: {
  id: string;
  status: VisaStatus;
}) {
  const update = useUpdateApplication(id);
  const form = useForm<UpdateVisaStatusInput>({
    resolver: zodResolver(updateVisaStatusSchema),
    defaultValues: { status, verificationNotes: "", rejectionReason: "" },
  });
  const selected = useWatch({ control: form.control, name: "status" });

  async function onSubmit(values: UpdateVisaStatusInput) {
    try {
      await update.mutateAsync(values);
      form.reset({ ...values, verificationNotes: "", rejectionReason: "" });
      toast.success("Application updated");
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        for (const [field, messages] of Object.entries(error.errors)) {
          form.setError(field as keyof UpdateVisaStatusInput, {
            message: messages[0],
          });
        }
        return;
      }
      toast.error("Could not update the application", {
        description:
          error instanceof Error ? error.message : "Please try again shortly.",
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
                  {visaStatusValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {visaStatusLabels[value]}
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
          name="verificationNotes"
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

        {selected === "REJECTED" ? (
          <FormField
            control={form.control}
            name="rejectionReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{copy.detail.rejectionLabel}</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

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
