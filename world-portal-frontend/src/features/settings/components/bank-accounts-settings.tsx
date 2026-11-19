"use client";

import * as React from "react";

import {
  Building2,
  CreditCard,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, TableError } from "@/components/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SkeletonList } from "@/components/ui/skeleton";
import { bankAccounts as copy } from "@/content/admin";
import { toastWithUndo } from "@/lib/toast";
import { cn } from "@/lib/utils";

import {
  type BankAccount,
  useBankAccounts,
  useDeleteBankAccount,
  useUpdateBankAccount,
} from "../api/bank-accounts";

import { AddBankAccountModal } from "./add-bank-account-modal";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : copy.genericError;

/**
 * `canManage`: the signed-in role is MANAGER. The routes refuse anyone else's
 * changes (403); this hides the controls so a staff member or partner isn't
 * offered buttons that can only fail.
 */
export function BankAccountsSettings({ canManage }: { canManage: boolean }) {
  const {
    data: accounts,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
  } = useBankAccounts();
  const deleteMutation = useDeleteBankAccount();
  const updateMutation = useUpdateBankAccount();

  const [toDelete, setToDelete] = React.useState<BankAccount | null>(null);

  const setActive = (account: BankAccount, isActive: boolean) =>
    updateMutation.mutateAsync({ id: account.id, payload: { isActive } });

  // Reversible, so no confirmation — just an Undo for a slip of the finger.
  const handleToggleActive = async (account: BankAccount) => {
    const next = !account.isActive;
    try {
      await setActive(account, next);
      toastWithUndo(copy.toggled(account.bankName, next), () => {
        setActive(account, !next).catch((err) => toast.error(errorMessage(err)));
      });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  // Not reversible: confirmed first, with the consequence spelled out.
  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(copy.deleted(toDelete.bankName));
      setToDelete(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (isPending) return <SkeletonList count={2} />;

  if (isError) {
    return (
      <TableError
        title={copy.loadFailed}
        error={error}
        onRetry={() => void refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Official Bank Accounts
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Configure multiple bank accounts for applicants to wire processing payments
            to. Active accounts are automatically included in evaluation emails and the
            tracking portal.
          </p>
        </div>
        {canManage ? <AddBankAccountModal /> : null}
      </div>

      {!canManage ? (
        <Alert>
          <AlertDescription>{copy.managerOnly}</AlertDescription>
        </Alert>
      ) : null}

      {!accounts || accounts.length === 0 ? (
        <Card
          variant="solid"
          radius="lg"
          padding="none"
          className="flex flex-col items-center justify-center gap-3 p-8 text-center"
        >
          <div className="grid size-12 place-items-center rounded-2xl bg-muted/40 text-muted-foreground">
            <Building2 className="size-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              No Bank Accounts Configured
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Add your organization&apos;s bank accounts so applicants receive official
              transfer details when their cost evaluation is complete.
            </p>
          </div>
          {canManage ? <AddBankAccountModal /> : null}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((account) => (
            <Card
              key={account.id}
              variant="solid"
              radius="lg"
              padding="none"
              className={cn(
                "flex flex-col justify-between border p-5 transition-all",
                account.isActive
                  ? "border-primary/40 bg-card shadow-sm"
                  : "border-border/60 bg-muted/10 opacity-75",
              )}
            >
              <div>
                {/* Header Badge & Bank Name */}
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <CreditCard className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
                        {account.bankName}
                        <span className="text-xs font-normal text-muted-foreground">
                          ({account.currency})
                        </span>
                      </p>
                      <p className="truncate text-[11.5px] text-muted-foreground">
                        {account.accountName}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={account.isActive ? "success" : "softNeutral"}
                    size="sm"
                    className="shrink-0"
                  >
                    {account.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {/* Account Details Table */}
                <div className="mt-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">Account Number:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {account.accountNumber}
                    </span>
                  </div>

                  {account.swiftCode && (
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-muted-foreground">SWIFT / BIC:</span>
                      <span className="font-mono text-foreground">
                        {account.swiftCode}
                      </span>
                    </div>
                  )}

                  {account.iban && (
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-muted-foreground">IBAN:</span>
                      <span className="font-mono text-foreground">{account.iban}</span>
                    </div>
                  )}

                  {account.routingNumber && (
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-muted-foreground">Routing Number:</span>
                      <span className="font-mono text-foreground">
                        {account.routingNumber}
                      </span>
                    </div>
                  )}

                  {account.instructions && (
                    <div className="mt-2 rounded-lg border border-border/40 bg-muted/30 p-2.5 text-[11.5px] text-muted-foreground italic">
                      &ldquo;{account.instructions}&rdquo;{" "}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions: Edit, Toggle Active, Delete — managers only */}
              {canManage ? (
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleToggleActive(account)}
                    disabled={updateMutation.isPending}
                  >
                    {account.isActive ? (
                      <>
                        <ToggleRight className="size-4 text-success-text" />
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs font-medium"
                        >
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
                      onClick={() => setToDelete(account)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => (!open ? setToDelete(null) : undefined)}
        title={copy.deleteTitle(toDelete?.bankName ?? "")}
        description={copy.deleteBody}
        confirmLabel={copy.deleteConfirm}
        onConfirm={() => void handleDelete()}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
