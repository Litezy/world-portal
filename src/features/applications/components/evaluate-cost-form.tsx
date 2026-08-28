"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { applications as copy } from "@/content/admin";
import { useEvaluateApplication } from "@/features/applications/api/use-evaluate-application";
import { ApiError } from "@/lib/api-client";
import { evaluateVisaFormSchema, type EvaluateVisaInput } from "@/validations/admin";

/** Sets the price the applicant is asked to pay, so it is its own deliberate step. */
export function EvaluateCostForm({
  id,
  totalAmount,
  allowInstallment,
}: {
  id: string;
  totalAmount: number;
  allowInstallment: boolean;
}) {
  const evaluate = useEvaluateApplication(id);
  const form = useForm<EvaluateVisaInput>({
    resolver: zodResolver(evaluateVisaFormSchema),
    defaultValues: { totalAmount, allowInstallment },
  });

  async function onSubmit(values: EvaluateVisaInput) {
    try {
      await evaluate.mutateAsync(values);
      toast.success("Cost evaluated", {
        description: "The applicant has been emailed the amount due.",
      });
    } catch (error) {
      toast.error("Could not save the evaluation", {
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
          name="totalAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{copy.detail.amountLabel}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={Number.isFinite(field.value) ? field.value : ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === ""
                        ? Number.NaN
                        : event.target.valueAsNumber,
                    )
                  }
                />
              </FormControl>
              <FormDescription>{copy.detail.evaluateHint}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowInstallment"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2.5 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal text-muted-foreground">
                {copy.detail.installmentLabel}
              </FormLabel>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="outline"
          size="md"
          isLoading={evaluate.isPending}
          loadingText="Saving"
          className="w-full"
        >
          {copy.detail.evaluateAction}
        </Button>
      </form>
    </Form>
  );
}
