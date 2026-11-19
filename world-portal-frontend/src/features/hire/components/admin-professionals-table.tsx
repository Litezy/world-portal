"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import {
  Briefcase,
  Eye,
  Languages,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Star,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import {
  ConfirmDialog,
  DataTablePagination,
  DataTableToolbar,
  StatusTabs,
  TableError,
} from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { professionals as copy } from "@/content/admin";
import {
  type AdminProfessional,
  useAdminProfessionals,
  useSetProfessionalVerified,
} from "@/features/hire/api/use-admin-professionals";
import { useListParams } from "@/hooks/use-list-params";
import { formatCurrency } from "@/lib/utils";
import { toAmount } from "@/server/data/backend-types";

const ALL = "all";
const STATUSES = ["unverified", "verified"] as const;

function monogram(name: string) {
  const parts = name.trim().split(/\s+/);
  return (
    parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2)
  ).toUpperCase();
}

function rate(pro: AdminProfessional) {
  return formatCurrency(toAmount(pro.hourlyRate), pro.currency || "USD");
}

function categoryLabel(category: string) {
  return copy.categories[category] ?? category;
}

/**
 * Hire professionals. Search, verification, category and page live in the
 * URL. Giving a badge is immediate; taking one away asks first, because
 * travellers see it straight away.
 */
export function AdminProfessionalsTable() {
  const { params, set } = useListParams();
  const category = useSearchParams().get("category") ?? undefined;
  const status = (STATUSES as readonly string[]).includes(params.status ?? "")
    ? params.status
    : undefined;
  const query = useAdminProfessionals({
    q: params.q,
    status,
    page: params.page,
    category,
  });
  const setVerified = useSetProfessionalVerified();

  const [openPro, setOpenPro] = React.useState<AdminProfessional | null>(null);
  const [revoking, setRevoking] = React.useState<AdminProfessional | null>(null);

  const current = openPro
    ? (query.data?.data.find((p) => p.id === openPro.id) ?? openPro)
    : null;

  async function change(pro: AdminProfessional, isVerified: boolean) {
    try {
      await setVerified.mutateAsync({ id: pro.id, isVerified });
      toast.success(isVerified ? copy.verified(pro.name) : copy.revoked(pro.name));
    } catch {
      toast.error(copy.failed);
    }
  }

  const toggle = (pro: AdminProfessional) =>
    pro.isVerified ? setRevoking(pro) : void change(pro, true);

  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 overflow-hidden">
      <DataTableToolbar
        search={params.q}
        onSearch={(q) => set({ q })}
        placeholder={copy.searchPlaceholder}
      >
        <Select
          value={category ?? ALL}
          onValueChange={(value) =>
            set({ category: value === ALL ? undefined : value })
          }
        >
          <SelectTrigger className="w-[190px]" aria-label={copy.categoryLabel}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{copy.allCategories}</SelectItem>
            {Object.entries(copy.categories).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableToolbar>
      <StatusTabs
        label={copy.filterLabel}
        value={status}
        onChange={(next) => set({ status: next })}
        counts={query.data?.meta.counts}
        options={STATUSES.map((value) => ({ value, label: copy.statusLabels[value] }))}
      />

      <div className="p-4 sm:p-6">
        {query.isError ? (
          <TableError
            title={copy.loadFailed}
            error={query.error}
            onRetry={() => void query.refetch()}
            isRetrying={query.isRefetching}
          />
        ) : query.isPending ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-2xl border border-border p-5">
                <Skeleton shape="text" className="h-5 w-48" />
                <Skeleton shape="text" className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : query.data.data.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={copy.empty.title}
            description={copy.empty.body}
            className="border-0"
          />
        ) : (
          <div
            data-pending={query.isPlaceholderData || undefined}
            className="grid gap-4 data-pending:opacity-60 lg:grid-cols-2"
          >
            {query.data.data.map((pro) => (
              <ProfessionalCard
                key={pro.id}
                pro={pro}
                onOpen={() => setOpenPro(pro)}
                onToggle={() => toggle(pro)}
              />
            ))}
          </div>
        )}
      </div>

      {query.data ? (
        <DataTablePagination
          meta={query.data.meta}
          onPage={(page) => set({ page })}
          noun="professionals"
        />
      ) : null}

      <Dialog
        open={Boolean(current)}
        onOpenChange={(open) => (!open ? setOpenPro(null) : null)}
      >
        {current ? (
          <ProfessionalDetails pro={current} onToggle={() => toggle(current)} />
        ) : null}
      </Dialog>

      {revoking ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => (!open ? setRevoking(null) : null)}
          title={copy.revokeTitle(revoking.name)}
          description={copy.revokeBody}
          confirmLabel={copy.revokeConfirm}
          onConfirm={() => {
            const pro = revoking;
            setRevoking(null);
            void change(pro, false);
          }}
        />
      ) : null}
    </Card>
  );
}

function VerifyButton({
  pro,
  onToggle,
  size = "sm",
}: {
  pro: AdminProfessional;
  onToggle: () => void;
  size?: "sm";
}) {
  return (
    <Button
      variant={pro.isVerified ? "outline" : "primary"}
      size={size}
      onClick={onToggle}
      leftIcon={
        pro.isVerified ? (
          <UserX className="size-3.5" />
        ) : (
          <UserCheck className="size-3.5" />
        )
      }
    >
      {pro.isVerified ? copy.revoke : copy.verify}
    </Button>
  );
}

function ProfessionalCard({
  pro,
  onOpen,
  onToggle,
}: {
  pro: AdminProfessional;
  onOpen: () => void;
  onToggle: () => void;
}) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/50">
      <div>
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base leading-tight font-semibold text-foreground">
                <button
                  type="button"
                  onClick={onOpen}
                  className="text-left hover:text-primary focus-visible:underline focus-visible:outline-none"
                >
                  {pro.name}
                </button>
              </h3>
              <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
                <Star className="text-highlight size-3.5 fill-current" aria-hidden />
                {pro.rating}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {pro.title}
            </p>
          </div>
          <Badge variant={pro.isVerified ? "solid" : "muted"} size="sm">
            {copy.statusLabels[pro.isVerified ? "verified" : "unverified"]}
          </Badge>
        </div>

        {pro.bio ? (
          <p className="my-2 line-clamp-2 text-xs text-muted-foreground">{pro.bio}</p>
        ) : null}

        <div className="my-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium text-foreground">
            <MapPin className="size-3.5 text-primary" aria-hidden />
            {pro.country}
          </span>
          <Badge variant="muted" size="sm" className="text-[11px]">
            {categoryLabel(pro.category)}
          </Badge>
          <span>{copy.jobs(pro.completedJobs)}</span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <p>
            <span className="text-base font-bold text-foreground tabular-nums">
              {rate(pro)}
            </span>
            <span className="text-xs text-muted-foreground"> {copy.perHour}</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-xs text-muted-foreground sm:inline-flex"
            onClick={onOpen}
            leftIcon={<Eye className="size-3.5" />}
          >
            {copy.viewDetails}
          </Button>
        </div>
        <VerifyButton pro={pro} onToggle={onToggle} />
      </div>
    </article>
  );
}

function ProfessionalDetails({
  pro,
  onToggle,
}: {
  pro: AdminProfessional;
  onToggle: () => void;
}) {
  return (
    <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
      <DialogHeader className="border-b border-border pb-4">
        <div className="flex items-start gap-4">
          <div
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary"
          >
            {monogram(pro.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-xl leading-tight font-bold text-foreground">
                {pro.name}
              </DialogTitle>
              <Badge variant={pro.isVerified ? "solid" : "muted"} size="sm">
                {copy.statusLabels[pro.isVerified ? "verified" : "unverified"]}
              </Badge>
            </div>
            <DialogDescription className="mt-0.5 text-xs">
              {pro.title} · {pro.country}
            </DialogDescription>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="muted" size="sm">
                <Star className="text-highlight size-3.5 fill-current" aria-hidden />
                {copy.rating(String(pro.rating))}
              </Badge>
              <Badge variant="muted" size="sm">
                {categoryLabel(pro.category)}
              </Badge>
              <Badge variant="muted" size="sm">
                {copy.jobs(pro.completedJobs)}
              </Badge>
            </div>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-6 py-2">
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {copy.sections.rate}
            </p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {rate(pro)}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                {copy.perHour}
              </span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {copy.sections.location}
            </p>
            <p className="flex items-center gap-1 text-xs font-medium text-foreground">
              <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
              {pro.country}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {copy.sections.contact}
            </p>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-1 truncate">
                <Mail className="size-3 shrink-0 text-primary" aria-hidden />
                {pro.email || copy.notProvided}
              </p>
              {pro.phone ? (
                <p className="flex items-center gap-1">
                  <Phone className="size-3 shrink-0 text-primary" aria-hidden />
                  {pro.phone}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <section className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <Sparkles className="size-3.5 text-primary" aria-hidden />
            {copy.sections.about(pro.name)}
          </h4>
          <p className="rounded-xl border border-border bg-card p-4 text-xs leading-relaxed text-foreground">
            {pro.bio || copy.noBio}
          </p>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pro.languages?.length ? (
            <section className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <Languages className="size-3.5 text-primary" aria-hidden />
                {copy.sections.languages}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {pro.languages.map((lang) => (
                  <Badge key={lang} variant="muted" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}
          {pro.skills?.length ? (
            <section className="space-y-2">
              <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {copy.sections.skills}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {pro.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {copy.profileId}:{" "}
          <span className="font-mono text-[11px] text-foreground">{pro.id}</span>
        </p>
        <VerifyButton pro={pro} onToggle={onToggle} />
      </div>
    </DialogContent>
  );
}
