"use client";

import * as React from "react";
import { Building2, Plus, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  useCreateBankAccount,
  useUpdateBankAccount,
  type BankAccount,
} from "../api/bank-accounts";

type Props = {
  accountToEdit?: BankAccount;
  trigger?: React.ReactNode;
};

export function AddBankAccountModal({ accountToEdit, trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const isEditing = Boolean(accountToEdit);

  const [bankName, setBankName] = React.useState(accountToEdit?.bankName ?? "");
  const [accountName, setAccountName] = React.useState(accountToEdit?.accountName ?? "");
  const [accountNumber, setAccountNumber] = React.useState(accountToEdit?.accountNumber ?? "");
  const [swiftCode, setSwiftCode] = React.useState(accountToEdit?.swiftCode ?? "");
  const [iban, setIban] = React.useState(accountToEdit?.iban ?? "");
  const [routingNumber, setRoutingNumber] = React.useState(accountToEdit?.routingNumber ?? "");
  const [currency, setCurrency] = React.useState(accountToEdit?.currency ?? "USD");
  const [instructions, setInstructions] = React.useState(accountToEdit?.instructions ?? "");
  const [isActive, setIsActive] = React.useState(accountToEdit?.isActive ?? true);

  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();

  const isPending = createMutation.isPending || updateMutation.isPending;
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setBankName(accountToEdit?.bankName ?? "");
      setAccountName(accountToEdit?.accountName ?? "");
      setAccountNumber(accountToEdit?.accountNumber ?? "");
      setSwiftCode(accountToEdit?.swiftCode ?? "");
      setIban(accountToEdit?.iban ?? "");
      setRoutingNumber(accountToEdit?.routingNumber ?? "");
      setCurrency(accountToEdit?.currency ?? "USD");
      setInstructions(accountToEdit?.instructions ?? "");
      setIsActive(accountToEdit?.isActive ?? true);
      setErrorMsg(null);
    }
  }, [open, accountToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) {
      setErrorMsg("Bank Name, Account Name, and Account Number are required.");
      return;
    }

    try {
      if (isEditing && accountToEdit) {
        await updateMutation.mutateAsync({
          id: accountToEdit.id,
          payload: {
            bankName: bankName.trim(),
            accountName: accountName.trim(),
            accountNumber: accountNumber.trim(),
            swiftCode: swiftCode.trim() || undefined,
            iban: iban.trim() || undefined,
            routingNumber: routingNumber.trim() || undefined,
            currency: currency.trim().toUpperCase() || "USD",
            instructions: instructions.trim() || undefined,
            isActive,
          },
        });
      } else {
        await createMutation.mutateAsync({
          bankName: bankName.trim(),
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim(),
          swiftCode: swiftCode.trim() || undefined,
          iban: iban.trim() || undefined,
          routingNumber: routingNumber.trim() || undefined,
          currency: currency.trim().toUpperCase() || "USD",
          instructions: instructions.trim() || undefined,
          isActive,
        });
      }
      setOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save bank account details.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="primary" className="gap-1.5 font-medium">
            <Plus className="size-4" />
            Add Bank Account
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg p-6 backdrop-blur-2xl">
        <DialogHeader className="border-b border-border/60 pb-4">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            {isEditing ? "Edit Bank Account" : "Add New Bank Account"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {isEditing
              ? "Update official bank transfer details for applicant payments."
              : "Add official bank account details to collect applicant wire & transfer payments."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                placeholder="e.g. Chase Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                placeholder="USD, EUR, NGN, GBP"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="accountName">Account Name *</Label>
            <Input
              id="accountName"
              placeholder="e.g. World Portal Ltd"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              placeholder="e.g. 9876543210"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="swiftCode">SWIFT / BIC Code</Label>
              <Input
                id="swiftCode"
                placeholder="e.g. CHASUS33"
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value)}
                className="font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="routingNumber">Routing Number</Label>
              <Input
                id="routingNumber"
                placeholder="e.g. 021000021"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="iban">IBAN (International Account Number)</Label>
            <Input
              id="iban"
              placeholder="e.g. GB82SCBL00020012345678"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              className="font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="instructions">Payment Notes / Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Optional notes for applicants (e.g., Include reference code in transfer description)"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
            <Label htmlFor="isActive" className="text-xs cursor-pointer font-medium">
              Set as Active (Visible in emails & tracking page)
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isPending}>
              {isEditing ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
