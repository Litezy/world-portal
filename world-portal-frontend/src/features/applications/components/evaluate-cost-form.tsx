"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ConfirmDialog } from "@/components/admin";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { applications as copy, caseWorkflow, visaStatusLabels } from "@/content/admin";
import { useEvaluateApplication } from "@/features/applications/api/use-evaluate-application";
import { canEvaluate, type CaseStatus } from "@/features/applications/workflow";
import { useEvaluatePassport } from "@/features/passports/api/use-evaluate-passport";
import { ApiError } from "@/lib/api-client";
import { formatCurrency, formatWithCommas } from "@/lib/utils";
import type { BackendPaymentStatus } from "@/server/data/backend-types";
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
  type = "visa",
  status,
  paymentStatus,
  applicantName,
}: {
  id: string;
  totalAmount: number;
  currency?: string;
  allowInstallment: boolean;
  type?: "visa" | "passport";
  status: CaseStatus;
  paymentStatus: BackendPaymentStatus;
  applicantName: string;
}) {
  const evaluateVisa = useEvaluateApplication(id);
  const evaluatePassport = useEvaluatePassport(id);
  const evaluate = type === "passport" ? evaluatePassport : evaluateVisa;
  const form = useForm<EvaluateVisaInput>({
    resolver: zodResolver(evaluateVisaFormSchema),
    defaultValues: {
      // A file that was never priced starts empty rather than at 0.
      totalAmount: totalAmount > 0 ? totalAmount : Number.NaN,
      currency: currency || "USD",
      allowInstallment,
    },
  });
  // Validated values wait here while the "this emails the applicant" check is open.
  const [pending, setPending] = React.useState<EvaluateVisaInput | null>(null);

  if (!canEvaluate(status, paymentStatus)) {
    const moneyHeld =
      paymentStatus === "PARTIALLY_PAID" || paymentStatus === "FULLY_PAID";
    return (
      <div className="grid gap-2">
        <p className="text-[13px] font-semibold text-foreground tabular-nums">
          {totalAmount > 0 ? formatCurrency(totalAmount, currency) : null}
        </p>
        <p className="rounded-xl border border-border/70 bg-muted/30 p-3.5 text-[12.5px] text-muted-foreground">
          {moneyHeld
            ? caseWorkflow.evaluate.locked
            : caseWorkflow.evaluate.closed(visaStatusLabels[status])}
        </p>
      </div>
    );
  }

  async function save(values: EvaluateVisaInput) {
    try {
      await evaluate.mutateAsync(values);
      toast.success(caseWorkflow.evaluate.done);
      setPending(null);
    } catch (error) {
      setPending(null);
      toast.error(caseWorkflow.evaluate.failed, {
        description:
          error instanceof ApiError ? error.message : "Please try again shortly.",
      });
    }
  }

  const amountLabel = pending
    ? formatCurrency(pending.totalAmount, pending.currency)
    : "";
  const instalmentLabel = pending?.allowInstallment
    ? formatCurrency(pending.totalAmount / 2, pending.currency)
    : null;

  return (
    <Form {...form}>
      {pending ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => (!open ? setPending(null) : null)}
          tone="default"
          title={caseWorkflow.evaluate.confirmTitle(amountLabel)}
          description={caseWorkflow.evaluate.confirmBody(
            applicantName,
            instalmentLabel,
          )}
          confirmLabel={caseWorkflow.evaluate.confirmAction}
          isPending={evaluate.isPending}
          onConfirm={() => void save(pending)}
        />
      ) : null}
      <form
        onSubmit={form.handleSubmit((values) => setPending(values))}
        className="grid gap-4"
        noValidate
      >
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
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={
                      Number.isFinite(field.value) ? formatWithCommas(field.value) : ""
                    }
                    onChange={(event) => {
                      const raw = event.target.value.replace(/,/g, "");
                      if (raw === "") {
                        field.onChange(Number.NaN);
                        return;
                      }
                      if (/^\d*\.?\d*$/.test(raw)) {
                        const num = parseFloat(raw);
                        field.onChange(isNaN(num) ? Number.NaN : num);
                      }
                    }}
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
