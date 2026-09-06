"use client";

import * as React from "react";
import { CreditCard, CheckCircle2, ShieldCheck } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatWithCommas } from "@/lib/utils";
import { useConfirmBankPayment } from "../api/use-confirm-bank-payment";

type Props = {
  id: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currency?: string;
  allowInstallment: boolean;
  type?: "visa" | "passport";
};

export function ConfirmBankPaymentModal({
  id,
  totalAmount,
  amountPaid,
  balanceDue,
  currency,
  allowInstallment,
  type = "visa",
}: Props) {
  const [open, setOpen] = React.useState(false);

  const canInstallment = allowInstallment && amountPaid === 0 && totalAmount > 0;
  const [option, setOption] = React.useState<"FULL" | "HALF_INSTALLMENT">(
    canInstallment ? "HALF_INSTALLMENT" : "FULL",
  );

  const defaultAmount =
    option === "HALF_INSTALLMENT" ? Math.round((totalAmount / 2) * 100) / 100 : balanceDue;

  const [amountStr, setAmountStr] = React.useState<string>(defaultAmount.toString());
  const [bankReference, setBankReference] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const confirmMutation = useConfirmBankPayment(id, type);

  React.useEffect(() => {
    if (open) {
      const calculated =
        option === "HALF_INSTALLMENT" ? Math.round((totalAmount / 2) * 100) / 100 : balanceDue;
      setAmountStr(calculated.toString());
      setErrorMsg(null);
    }
  }, [open, option, balanceDue, totalAmount]);

  const handleOptionChange = (newOpt: "FULL" | "HALF_INSTALLMENT") => {
    setOption(newOpt);
    const calculated =
      newOpt === "HALF_INSTALLMENT" ? Math.round((totalAmount / 2) * 100) / 100 : balanceDue;
    setAmountStr(calculated.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericAmount = parseFloat(amountStr);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg("Please enter a valid positive payment amount.");
      return;
    }

    if (numericAmount > balanceDue) {
      setErrorMsg(`Payment amount (${formatCurrency(numericAmount, currency)}) cannot exceed the remaining balance due of ${formatCurrency(balanceDue, currency)}.`);
      return;
    }

    try {
      await confirmMutation.mutateAsync({
        amount: numericAmount,
        paymentOption: option,
        bankReference: bankReference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to confirm bank transfer payment.");
    }
  };

  if (balanceDue <= 0 || totalAmount <= 0) {
    return null;
  }

  return (
    <Card variant="solid" radius="lg" padding="none" className="p-6 border-emerald-500/30 bg-emerald-500/5">
      <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
        <CreditCard className="size-5 shrink-0" />
        <CardTitle className="text-base font-semibold">Bank Transfer Confirmation</CardTitle>
      </div>
      <CardDescription className="mt-1 text-[12.5px] text-muted-foreground">
        Manually record and verify bank wire / transfer payments received from this applicant.
      </CardDescription>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-emerald-500/20 pt-4">
        <div>
          <span className="text-[11px] font-medium text-muted-foreground uppercase block">Balance Outstanding</span>
          <span className="font-mono text-base font-bold text-ink-900">{formatCurrency(balanceDue, currency)}</span>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="primary" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
              <CheckCircle2 className="size-4" />
              Confirm Bank Payment
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md p-6 backdrop-blur-2xl">
            <DialogHeader className="border-b border-border/60 pb-4">
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                Confirm Bank Transfer Payment
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Verify payment receipt. This will update the applicant balance, advance status to <strong>Under Review</strong>, and send an email receipt.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {errorMsg && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {errorMsg}
                </div>
              )}

              {/* Payment Option radios */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Payment Option</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOptionChange("FULL")}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      option === "FULL"
                        ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                        : "border-border/70 bg-card hover:bg-muted/30"
                    }`}
                  >
                    <span className="block text-xs font-bold text-foreground">Full Payment</span>
                    <span className="block text-[11px] text-muted-foreground font-mono mt-0.5">
                      {formatCurrency(balanceDue, currency)}
                    </span>
                  </button>

                  {canInstallment ? (
                    <button
                      type="button"
                      onClick={() => handleOptionChange("HALF_INSTALLMENT")}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        option === "HALF_INSTALLMENT"
                          ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                          : "border-border/70 bg-card hover:bg-muted/30"
                      }`}
                    >
                      <span className="block text-xs font-bold text-foreground">50% Installment</span>
                      <span className="block text-[11px] text-muted-foreground font-mono mt-0.5">
                        {formatCurrency(totalAmount / 2, currency)}
                      </span>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-border/40 bg-muted/20 p-3 text-left opacity-60">
                      <span className="block text-xs font-medium text-muted-foreground">50% Installment</span>
                      <span className="block text-[10.5px] text-muted-foreground mt-0.5">
                        {allowInstallment ? "Installment already paid" : "Not enabled"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <Label htmlFor="amount">Confirmed Amount Received ({currency || "USD"}) *</Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formatWithCommas(amountStr)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                      setAmountStr(raw);
                    }
                  }}
                  className="font-mono text-sm font-semibold"
                  required
                />
              </div>

              {/* Bank Reference */}
              <div className="space-y-1.5">
                <Label htmlFor="bankReference">Bank Reference / Teller Code</Label>
                <Input
                  id="bankReference"
                  placeholder="e.g. REF-TRANSFER-987654"
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  className="font-mono uppercase"
                />
              </div>

              {/* Verification Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">Admin Verification Note</Label>
                <Textarea
                  id="notes"
                  placeholder="Optional internal note (e.g. Verified in Chase bank statement)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={confirmMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={confirmMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Confirm Payment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
