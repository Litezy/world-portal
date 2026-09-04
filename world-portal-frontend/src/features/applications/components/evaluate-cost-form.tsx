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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { applications as copy } from "@/content/admin";
import { useEvaluateApplication } from "@/features/applications/api/use-evaluate-application";
import { ApiError } from "@/lib/api-client";
import { evaluateVisaFormSchema, type EvaluateVisaInput } from "@/validations/admin";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "NGN", symbol: "₦", label: "NGN (₦)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "CAD", symbol: "$", label: "CAD ($)" },
  { code: "AUD", symbol: "$", label: "AUD ($)" },
];

/** Sets the price the applicant is asked to pay, so it is its own deliberate step. */
export function EvaluateCostForm({
  id,
  totalAmount,
  currency = "USD",
  allowInstallment,
}: {
  id: string;
  totalAmount: number;
  currency?: string;
  allowInstallment: boolean;
}) {
  const evaluate = useEvaluateApplication(id);
  const form = useForm<EvaluateVisaInput>({
    resolver: zodResolver(evaluateVisaFormSchema),
    defaultValues: { totalAmount, currency: currency || "USD", allowInstallment },
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
        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel required>Currency</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger size="sm" className="font-semibold">
                      <SelectValue placeholder="USD ($)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
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
            name="totalAmount"
            render={({ field }) => (
              <FormItem className="col-span-2">
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
                    className="font-mono text-sm font-semibold"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <p className="text-[12px] text-muted-foreground">{copy.detail.evaluateHint}</p>

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
