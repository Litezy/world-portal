"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookUser,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Globe,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicantLoginModal } from "@/features/applicant/components/applicant-login-modal";
import { useApplicantAuthStore } from "@/features/applicant/store/applicant-auth-store";
import { BankAccountPaymentInfo } from "@/features/visa/components/bank-account-payment-info";
import {
  paymentStatusCopy,
  STATUS_FLOW,
  statusCopy,
  statusIndex,
} from "@/features/visa/status";
import { toAmount } from "@/features/visa/types";
import { useDebounce } from "@/hooks/use-debounce";
import { useMounted } from "@/hooks/use-mounted";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { PassportStatus } from "@/server/data/backend-types";

type UnifiedApplication = {
  id: string;
  applicationNo: string;
  type: "VISA" | "PASSPORT";
  firstName: string;
  lastName?: string;
  surname?: string;
  email: string;
  phone?: string;
  targetCountry?: string;
  visaCategory?: string;
  passportCategory?: string;
  bookletType?: string;
  validity?: string;
  status: string;
  paymentStatus?: string;
  totalAmount?: string | number | null;
  amountPaid?: string | number | null;
  balanceDue?: string | number | null;
  currency?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

function parseAmount(val?: string | number | null): number | null {
  if (val === null || val === undefined || val === "") return null;
  return toAmount(String(val));
}

const PASSPORT_STATUS_FLOW: PassportStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
];

const passportStatusCopy: Record<
  PassportStatus,
  { label: string; description: string }
> = {
  SUBMITTED: {
    label: "Submitted",
    description:
      "We have received your e-Passport application and uploaded documents. An immigration officer is reviewing your file.",
  },
  EVALUATED: {
    label: "Evaluated",
    description:
      "Cost evaluation is complete. Please review processing fee and complete payment.",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    description:
      "Your details and National Identity Number (NIN) records are under official processing & verification.",
  },
  APPROVED: {
    label: "Approved & Ready",
    description:
      "Your passport application is approved and scheduled for physical biometric capture / passport collection.",
  },
  REJECTED: {
    label: "Rejected",
    description: "This passport application was not approved. The reason is shown below.",
  },
};

export default function ApplicantApplicationsPage() {
  const mounted = useMounted();

  const email = useApplicantAuthStore((s) => s.email);
  const profileId = useApplicantAuthStore((s) => s.profileId);
  const isAuthenticated = useApplicantAuthStore((s) => s.isAuthenticated);

  const [loginModalOpen, setLoginModalOpen] = React.useState(false);
  const [applications, setApplications] = React.useState<UnifiedApplication[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedApp, setSelectedApp] = React.useState<UnifiedApplication | null>(null);

  // Search & Filter state
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("ALL");
  const debouncedSearch = useDebounce(search, 250);

  const fetchApplications = React.useCallback(() => {
    if (!mounted || !isAuthenticated || !email) return;

    setLoading(true);
    const identifier = email || profileId;

    fetch(`/api/applicant/applications/${encodeURIComponent(identifier!)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setApplications(data);
        } else {
          setApplications([]);
        }
      })
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [mounted, isAuthenticated, email, profileId]);

  React.useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = React.useMemo(() => {
    return applications.filter((app) => {
      const appName = `${app.firstName || ""} ${app.lastName || app.surname || ""}`.trim().toLowerCase();
      const matchSearch =
        !debouncedSearch ||
        app.applicationNo.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        appName.includes(debouncedSearch.toLowerCase()) ||
        (app.targetCountry && app.targetCountry.toLowerCase().includes(debouncedSearch.toLowerCase()));

      const matchType = typeFilter === "ALL" || app.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [applications, debouncedSearch, typeFilter]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton shape="text" className="h-8 w-48" />
        <Skeleton shape="block" className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Admin-Style Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          lead="My Applications &"
          accent="Document Vault"
          body="View all your active visa documentations and e-Passport applications, track live verification timelines, and review cost evaluations."
        />

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Button asChild variant="primary" size="md">
            <Link href="/apply">
              <Plus className="mr-1.5 size-4" /> New Visa Application
            </Link>
          </Button>
          <Button asChild variant="outline" size="md">
            <Link href="/passport">
              <BookUser className="mr-1.5 size-4" /> Apply for Passport
            </Link>
          </Button>
        </div>
      </div>

      {!isAuthenticated ? (
        <Card variant="solid" radius="lg" padding="none" className="p-12 text-center space-y-4 border border-border">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-7" />
          </div>
          <h2 className="text-[22px] font-semibold text-ink-900">
            Sign in to view your applications
          </h2>
          <p className="text-[14px] text-muted-foreground max-w-md mx-auto leading-relaxed">
            Sign in to view all your active visa applications, track verification progression, view officer notes, and download documents.
          </p>
          <div className="pt-2 flex justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => setLoginModalOpen(true)}
              leftIcon={<Mail className="size-4" />}
            >
              Sign In with Email OTP
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center gap-3 flex-1">
              <Input
                placeholder="Search by ref #, country, or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="size-4 text-muted-foreground" />}
                className="max-w-md"
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Applications</SelectItem>
                  <SelectItem value="VISA">Visa Documentations</SelectItem>
                  <SelectItem value="PASSPORT">e-Passport Files</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              Showing <span className="text-ink-900 font-bold">{filteredApplications.length}</span> application(s)
            </p>
          </div>

          {/* Card Grid */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <EmptyState
              icon={FileCheck2}
              title="No applications found"
              description="You have not submitted any visa documentations or e-passport applications yet."
              className="mt-6"
              action={
                <div className="flex gap-3">
                  <Button asChild variant="primary" size="sm">
                    <Link href="/apply">Apply for Visa</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/passport">Apply for Passport</Link>
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredApplications.map((app) => {
                const isVisa = app.type === "VISA";
                const fullName = `${app.firstName || ""} ${app.lastName || app.surname || ""}`.trim();
                const total = parseAmount(app.totalAmount);
                const paid = parseAmount(app.amountPaid);
                const due = parseAmount(app.balanceDue);

                return (
                  <Card
                    key={app.id}
                    variant="solid"
                    radius="lg"
                    padding="none"
                    onClick={() => setSelectedApp(app)}
                    className="p-5 flex flex-col justify-between cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 group border border-border"
                  >
                    <div>
                      {/* Top Header & Type Badge */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
                        <Badge
                          variant={isVisa ? "solid" : "outline"}
                          size="sm"
                          className="flex items-center gap-1.5 font-medium"
                        >
                          {isVisa ? <Globe className="size-3.5" /> : <BookUser className="size-3.5" />}
                          {isVisa ? "Visa Documentation" : "e-Passport File"}
                        </Badge>

                        <Badge
                          variant={
                            app.status === "APPROVED"
                              ? "solid"
                              : app.status === "REJECTED"
                                ? "destructive"
                                : "muted"
                          }
                          size="sm"
                          className="uppercase text-[11px] font-bold tracking-wider"
                        >
                          {app.status.replace("_", " ")}
                        </Badge>
                      </div>

                      {/* Main Title & Ref */}
                      <div className="mt-4 space-y-1">
                        <span className="font-mono text-xs font-bold text-muted-foreground tracking-wider uppercase block">
                          Ref #{app.applicationNo}
                        </span>
                        <h3 className="text-lg font-bold text-ink-900 group-hover:text-primary transition-colors leading-tight">
                          {isVisa
                            ? app.targetCountry || "Visa Application"
                            : `Passport (${app.passportCategory || "Standard"})`}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                          <User className="size-3.5 text-primary shrink-0" />
                          {fullName}
                        </p>
                      </div>

                      {/* Financial / Summary Metadata */}
                      <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Processing Fee</span>
                          <span className="font-mono font-semibold text-foreground">
                            {total === null
                              ? "Pending Costing"
                              : formatCurrency(total, app.currency)}
                          </span>
                        </div>
                        {app.paymentStatus && (
                          <div className="flex justify-between items-center text-muted-foreground pt-1 border-t border-border/40">
                            <span>Payment Status</span>
                            <span className="font-semibold text-primary">
                              {paymentStatusCopy[app.paymentStatus as keyof typeof paymentStatusCopy] || app.paymentStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Action CTA */}
                    <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
                      <span className="flex items-center gap-1.5">
                        <Eye className="size-4" /> Click to inspect status & details
                      </span>
                      <span className="text-[11px] text-muted-foreground font-normal">
                        {formatDate(app.createdAt)}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Application Detail Inspection Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        {selectedApp && (
          <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="solid" size="sm">
                      {selectedApp.type === "VISA" ? "Visa Documentation" : "e-Passport File"}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      #{selectedApp.applicationNo}
                    </span>
                  </div>
                  <DialogTitle className="text-2xl font-bold text-ink-900 mt-1">
                    {selectedApp.type === "VISA"
                      ? `${selectedApp.targetCountry} Visa Application`
                      : `Nigeria e-Passport (${selectedApp.passportCategory || "Standard"})`}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Applicant: {selectedApp.firstName} {selectedApp.lastName || selectedApp.surname} · {selectedApp.email}
                  </DialogDescription>
                </div>

                <Badge
                  variant={
                    selectedApp.status === "APPROVED"
                      ? "solid"
                      : selectedApp.status === "REJECTED"
                        ? "destructive"
                        : "muted"
                  }
                  size="lg"
                  className="uppercase text-xs tracking-wider"
                >
                  {selectedApp.status.replace("_", " ")}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-2">
              {/* Progress Flow */}
              {selectedApp.type === "VISA" ? (
                <div className="bg-card p-5 rounded-2xl border border-border space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Verification & Processing Progression
                  </h4>
                  <ol className="grid gap-0">
                    {STATUS_FLOW.map((st, i) => {
                      const cur = statusIndex(selectedApp.status as any);
                      const done = i < cur;
                      const active = i === cur;
                      const last = i === STATUS_FLOW.length - 1;

                      return (
                        <li key={st} className="relative flex gap-4 pb-6 last:pb-0">
                          {!last && (
                            <span
                              className={cn(
                                "absolute top-7 left-[13px] h-[calc(100%-1.75rem)] w-px",
                                done ? "bg-success" : "bg-border"
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              "z-10 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                              done && "bg-success text-success-foreground",
                              active && "bg-primary text-primary-foreground ring-4 ring-primary/30",
                              !done && !active && "bg-secondary text-muted-foreground"
                            )}
                          >
                            {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                          </span>
                          <div className="pt-0.5">
                            <p
                              className={cn(
                                "text-[14px] font-semibold",
                                active || done ? "text-ink-900" : "text-muted-foreground"
                              )}
                            >
                              {statusCopy[st].label}
                            </p>
                            <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                              {statusCopy[st].description}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ) : (
                <div className="bg-[#111625]/40 dark:bg-card p-5 rounded-2xl border border-border space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    e-Passport Processing Timeline
                  </h4>
                  <ol className="grid gap-0">
                    {PASSPORT_STATUS_FLOW.map((st, i) => {
                      const cur = PASSPORT_STATUS_FLOW.indexOf(selectedApp.status as PassportStatus);
                      const done = i < cur;
                      const active = i === cur;
                      const last = i === PASSPORT_STATUS_FLOW.length - 1;

                      return (
                        <li key={st} className="relative flex gap-4 pb-6 last:pb-0">
                          {!last && (
                            <span
                              className={cn(
                                "absolute top-7 left-[13px] h-[calc(100%-1.75rem)] w-px",
                                done ? "bg-success" : "bg-border"
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              "z-10 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                              done && "bg-success text-success-foreground",
                              active && "bg-primary text-primary-foreground ring-4 ring-primary/30",
                              !done && !active && "bg-secondary text-muted-foreground"
                            )}
                          >
                            {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                          </span>
                          <div className="pt-0.5">
                            <p
                              className={cn(
                                "text-[14px] font-semibold",
                                active || done ? "text-ink-900" : "text-muted-foreground"
                              )}
                            >
                              {passportStatusCopy[st]?.label || st}
                            </p>
                            <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                              {passportStatusCopy[st]?.description}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {/* Cost & Payment Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/30 p-4 rounded-xl border border-border text-xs">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                    Total Amount
                  </span>
                  <p className="text-base font-bold text-ink-900 mt-1">
                    {parseAmount(selectedApp.totalAmount) === null
                      ? "Pending Costing"
                      : formatCurrency(parseAmount(selectedApp.totalAmount)!, selectedApp.currency)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                    Amount Paid
                  </span>
                  <p className="text-base font-bold text-success mt-1">
                    {formatCurrency(parseAmount(selectedApp.amountPaid) ?? 0, selectedApp.currency)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                    Balance Due
                  </span>
                  <p className="text-base font-bold text-primary mt-1">
                    {parseAmount(selectedApp.balanceDue) === null
                      ? "—"
                      : formatCurrency(parseAmount(selectedApp.balanceDue)!, selectedApp.currency)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedApp.verificationNotes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Officer Verification Notes
                  </h4>
                  <p className="text-xs leading-relaxed text-foreground bg-card p-4 rounded-xl border border-border">
                    {selectedApp.verificationNotes}
                  </p>
                </div>
              )}

              {/* Payment Bank Details if Awaiting Payment */}
              {(selectedApp.status === "EVALUATED" ||
                selectedApp.paymentStatus === "AWAITING_PAYMENT" ||
                selectedApp.paymentStatus === "PARTIALLY_PAID") && (
                <BankAccountPaymentInfo applicationNo={selectedApp.applicationNo} />
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

      <ApplicantLoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
}
