"use client";

import * as React from "react";
import { Building2, CheckCircle2, CreditCard, Trash2, Pencil, ToggleLeft, ToggleRight, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SkeletonList } from "@/components/ui/skeleton";
import {
  useBankAccounts,
  useDeleteBankAccount,
  useUpdateBankAccount,
  type BankAccount,
} from "../api/bank-accounts";
import { AddBankAccountModal } from "./add-bank-account-modal";

export function BankAccountsSettings() {
  const { data: accounts, isPending, isError, error } = useBankAccounts();
  const deleteMutation = useDeleteBankAccount();
  const updateMutation = useUpdateBankAccount();

  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleToggleActive = async (account: BankAccount) => {
    try {
      await updateMutation.mutateAsync({
        id: account.id,
        payload: { isActive: !account.isActive },
      });
    } catch (err) {
      console.error("Failed to toggle bank account status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bank account? Applicants will no longer see this account for payments.")) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error("Failed to delete bank account:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (isPending) return <SkeletonList count={2} />;

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center gap-2">
        <AlertCircle className="size-4 shrink-0" />
        {error instanceof Error ? error.message : "Failed to load bank accounts."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Official Bank Accounts</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure multiple bank accounts for applicants to wire processing payments to. Active accounts are automatically included in evaluation emails and the tracking portal.
          </p>
        </div>
        <AddBankAccountModal />
      </div>

      {!accounts || accounts.length === 0 ? (
        <Card variant="solid" radius="lg" padding="none" className="p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-muted/40 text-muted-foreground">
            <Building2 className="size-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No Bank Accounts Configured</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Add your organization's bank accounts so applicants receive official transfer details when their cost evaluation is complete.
            </p>
          </div>
          <AddBankAccountModal />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((account) => (
            <Card
              key={account.id}
              variant="solid"
              radius="lg"
              padding="none"
              className={`p-5 flex flex-col justify-between transition-all border ${
                account.isActive
                  ? "border-primary/40 bg-card shadow-sm"
                  : "border-border/60 bg-muted/10 opacity-75"
              }`}
            >
              <div>
                {/* Header Badge & Bank Name */}
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <CreditCard className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">
                        {account.bankName}
                        <span className="text-xs font-normal text-muted-foreground">({account.currency})</span>
                      </p>
                      <p className="text-[11.5px] text-muted-foreground truncate">{account.accountName}</p>
                    </div>
                  </div>

                  <Badge variant={account.isActive ? "success" : "softNeutral"} size="sm" className="shrink-0">
                    {account.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {/* Account Details Table */}
                <div className="mt-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted-foreground">Account Number:</span>
                    <span className="font-mono font-semibold text-foreground">{account.accountNumber}</span>
                  </div>

                  {account.swiftCode && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-muted-foreground">SWIFT / BIC:</span>
                      <span className="font-mono text-foreground">{account.swiftCode}</span>
                    </div>
                  )}

                  {account.iban && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-muted-foreground">IBAN:</span>
                      <span className="font-mono text-foreground">{account.iban}</span>
                    </div>
                  )}

                  {account.routingNumber && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-muted-foreground">Routing Number:</span>
                      <span className="font-mono text-foreground">{account.routingNumber}</span>
                    </div>
                  )}

                  {account.instructions && (
                    <div className="mt-2 rounded-lg bg-muted/30 p-2.5 text-[11.5px] text-muted-foreground italic border border-border/40">
                      "{account.instructions}"
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions: Edit, Toggle Active, Delete */}
              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => handleToggleActive(account)}
                  disabled={updateMutation.isPending}
                >
                  {account.isActive ? (
                    <>
                      <ToggleRight className="size-4 text-emerald-500" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="size-4 text-muted-foreground" />
                      Activate
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-1.5">
                  {/* EDIT MODAL TRIGGER */}
                  <AddBankAccountModal
                    accountToEdit={account}
                    trigger={
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs font-medium">
                        <Pencil className="size-3.5 text-primary" />
                        Edit
                      </Button>
                    }
                  />

                  {/* DELETE BUTTON */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(account.id)}
                    isLoading={deletingId === account.id}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
