"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { bankPayment as copy } from "@/content/admin";
import { useConfirmBankPayment } from "@/features/applications/api/use-confirm-bank-payment";
import { cn, formatCurrency, formatWithCommas } from "@/lib/utils";
import {
  type ConfirmBankPaymentInput,
  confirmBankPaymentSchema,
} from "@/validations/admin";

type Props = {
  id: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currency?: string;
  allowInstallment: boolean;
  type?: "visa" | "passport";
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-[11.5px] text-destructive-text">
      {message}
    </p>
  ) : null;
}

/** Records a transfer seen in the bank account. Hidden once nothing is owed. */
export function ConfirmBankPaymentModal({
  id,
  totalAmount,
  amountPaid,
  balanceDue,
  currency = "USD",
  allowInstallment,
  type = "visa",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const confirm = useConfirmBankPayment(id, type);

  const canInstallment = allowInstallment && amountPaid === 0 && totalAmount > 0;
  const amountFor = React.useCallback(
    (option: ConfirmBankPaymentInput["paymentOption"]) =>
      option === "HALF_INSTALLMENT" ? round2(totalAmount / 2) : balanceDue,
    [totalAmount, balanceDue],
  );
  const defaults = React.useCallback(
    (): ConfirmBankPaymentInput => ({
      paymentOption: canInstallment ? "HALF_INSTALLMENT" : "FULL",
      amount: amountFor(canInstallment ? "HALF_INSTALLMENT" : "FULL"),
      bankReference: "",
      notes: "",
    }),
    [canInstallment, amountFor],
  );

  const form = useForm<ConfirmBankPaymentInput>({
    resolver: zodResolver(confirmBankPaymentSchema),
    defaultValues: defaults(),
  });
  const { errors } = form.formState;

  if (balanceDue <= 0 || totalAmount <= 0) return null;

  const submit = form.handleSubmit(async (values) => {
    if (values.amount > balanceDue) {
      form.setError("amount", {
        message: copy.overBalance(formatCurrency(balanceDue, currency)),
      });
      return;
    }
    try {
      await confirm.mutateAsync({
        ...values,
        bankReference: values.bankReference || undefined,
        notes: values.notes || undefined,
      });
      toast.success(copy.done(formatCurrency(values.amount, currency)));
      setOpen(false);
    } catch {
      // Shown in the dialog so nothing typed is lost.
    }
  });

  return (
    <Card
      variant="solid"
      radius="lg"
      padding="none"
      className="border-success/30 bg-success-wash p-6"
    >
      <div className="flex items-center gap-2.5 text-success-text">
        <CreditCard className="size-5 shrink-0" aria-hidden />
        <CardTitle className="text-base font-semibold">{copy.title}</CardTitle>
      </div>
      <CardDescription className="mt-1 text-[12.5px] text-muted-foreground">
        {copy.body}
      </CardDescription>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-success/20 pt-4">
        <div>
          <span className="block text-[11px] font-medium text-muted-foreground uppercase">
            {copy.outstanding}
          </span>
          <span className="font-mono text-base font-bold text-foreground">
            {formatCurrency(balanceDue, currency)}
          </span>
        </div>

        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            // Every opening starts from the current balance, not the last attempt.
            if (next) {
              form.reset(defaults());
              confirm.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="primary"
              className="gap-1.5 bg-success font-medium text-success-foreground hover:bg-success/90"
            >
              <CheckCircle2 className="size-4" />
              {copy.trigger}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md p-6">
            <DialogHeader className="border-b border-border/60 pb-4">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <ShieldCheck className="size-4 text-success-text" aria-hidden />
                {copy.dialogTitle}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                {copy.dialogBody}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => void submit(e)}
              className="mt-4 space-y-4"
              noValidate
            >
              {confirm.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {confirm.error instanceof Error
                      ? confirm.error.message
                      : copy.failed}
                  </AlertDescription>
                </Alert>
              ) : null}

              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold text-foreground">
                  {copy.option}
                </legend>
                <Controller
                  control={form.control}
                  name="paymentOption"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={(value) => {
                        const option =
                          value as ConfirmBankPaymentInput["paymentOption"];
                        field.onChange(option);
                        form.setValue("amount", amountFor(option), {
                          shouldValidate: true,
                        });
                      }}
                      className="grid grid-cols-2 gap-2"
                    >
                      <OptionCard
                        value="FULL"
                        id="option-full"
                        title={copy.full}
                        detail={formatCurrency(balanceDue, currency)}
                        selected={field.value === "FULL"}
                      />
                      <OptionCard
                        value="HALF_INSTALLMENT"
                        id="option-half"
                        title={copy.half}
                        detail={
                          canInstallment
                            ? formatCurrency(totalAmount / 2, currency)
                            : copy.halfUnavailable(allowInstallment)
                        }
                        selected={field.value === "HALF_INSTALLMENT"}
                        disabled={!canInstallment}
                      />
                    </RadioGroup>
                  )}
                />
              </fieldset>

              <div className="space-y-1.5">
                <Label htmlFor="bank-amount">{copy.amount(currency)}</Label>
                <Controller
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <Input
                      id="bank-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={
                        Number.isFinite(field.value)
                          ? formatWithCommas(field.value)
                          : ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "");
                        if (raw === "") return field.onChange(Number.NaN);
                        if (/^\d*\.?\d*$/.test(raw))
                          field.onChange(Number.parseFloat(raw));
                      }}
                      aria-invalid={Boolean(errors.amount)}
                      aria-describedby="bank-amount-error"
                      className="font-mono text-sm font-semibold"
                    />
                  )}
                />
                <FieldError id="bank-amount-error" message={errors.amount?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bank-reference">{copy.reference}</Label>
                <Input
                  id="bank-reference"
                  autoComplete="off"
                  className="font-mono uppercase"
                  aria-invalid={Boolean(errors.bankReference)}
                  aria-describedby="bank-reference-hint"
                  {...form.register("bankReference")}
                />
                <p
                  id="bank-reference-hint"
                  className={cn(
                    "text-[11.5px]",
                    errors.bankReference
                      ? "text-destructive-text"
                      : "text-muted-foreground",
                  )}
                >
                  {errors.bankReference?.message ?? copy.referenceHint}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bank-notes">{copy.notes}</Label>
                <Textarea
                  id="bank-notes"
                  rows={2}
                  placeholder={copy.notesPlaceholder}
                  aria-invalid={Boolean(errors.notes)}
                  aria-describedby="bank-notes-error"
                  {...form.register("notes")}
                />
                <FieldError id="bank-notes-error" message={errors.notes?.message} />
              </div>

              <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={confirm.isPending}
                >
                  {copy.cancel}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={confirm.isPending}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  {copy.submit}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}

function OptionCard({
  value,
  id,
  title,
  detail,
  selected,
  disabled = false,
}: {
  value: string;
  id: string;
  title: string;
  detail: string;
  selected: boolean;
  disabled?: boolean;
}) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors",
        selected
          ? "border-success bg-success-wash ring-1 ring-success"
          : "border-border/70 bg-card",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <RadioGroupItem value={value} id={id} disabled={disabled} className="mt-0.5" />
      <span className="min-w-0">
        <span className="block text-xs font-bold text-foreground">{title}</span>
        <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
          {detail}
        </span>
      </span>
    </Label>
  );
}
