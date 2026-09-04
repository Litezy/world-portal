"use client";

import * as React from "react";
import { Building2, CreditCard, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { usePublicActiveBankAccounts } from "@/features/settings/api/bank-accounts";

type Props = {
  applicationNo: string;
};

export function BankAccountPaymentInfo({ applicationNo }: Props) {
  const { data: bankAccounts, isPending, isError } = usePublicActiveBankAccounts();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isPending || isError || !bankAccounts || bankAccounts.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6">
      <div className="flex items-center gap-2.5 text-primary">
        <Building2 className="size-5 shrink-0" />
        <h3 className="text-base font-semibold tracking-tight text-ink-900">
          Official Bank Transfer & Payment Instructions
        </h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Please wire or transfer your payment to any of our official bank accounts below. Always reference your application number <strong className="font-mono text-foreground">{applicationNo}</strong> in your transfer remark.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {bankAccounts.map((account) => (
          <div
            key={account.id}
            className="rounded-xl border border-border/70 bg-card p-4 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <CreditCard className="size-4 text-primary shrink-0" />
                  <span className="font-semibold text-xs text-foreground truncate">
                    {account.bankName}
                  </span>
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary">
                  {account.currency || "USD"}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Account Name</span>
                  <span className="font-semibold text-foreground">{account.accountName}</span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Account Number</span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {account.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(account.accountNumber, account.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                  >
                    {copiedId === account.id ? (
                      <>
                        <Check className="size-3 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 text-muted-foreground" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {account.swiftCode && (
                  <div className="pt-1">
                    <span className="text-[11px] text-muted-foreground block">SWIFT / BIC</span>
                    <span className="font-mono text-foreground">{account.swiftCode}</span>
                  </div>
                )}

                {account.iban && (
                  <div className="pt-1">
                    <span className="text-[11px] text-muted-foreground block">IBAN</span>
                    <span className="font-mono text-foreground">{account.iban}</span>
                  </div>
                )}

                {account.routingNumber && (
                  <div className="pt-1">
                    <span className="text-[11px] text-muted-foreground block">Routing Number</span>
                    <span className="font-mono text-foreground">{account.routingNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {account.instructions && (
              <p className="mt-3 border-t border-border/50 pt-2 text-[11px] italic text-primary/90">
                "{account.instructions}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
