"use client";

import * as React from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileCheck2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Search,
  Users,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/admin/data-table";
import { DocumentViewerModal } from "@/features/applications/components/document-viewer-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";

type AgencyRecord = {
  id: string;
  name: string;
  legalName: string;
  registrationNumber: string;
  country: string;
  countryCode: string;
  cities: string[];
  categories: string[];
  summary?: string;
  about?: string;
  website?: string;
  yearFounded?: number;
  languages?: string[];
  verification: "VERIFIED" | "PENDING" | "UNVERIFIED" | "SUSPENDED" | string;
  listingStatus: string;
  staffCount: number;
  email: string;
  phone: string;
  documents?: any[];
  staff?: any[];
  _count?: {
    assignments: number;
    users: number;
  };
};

function extractArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (Array.isArray(val.data)) return val.data;
  if (Array.isArray(val.data?.data)) return val.data.data;
  return [];
}

function formatKindLabel(kind: string): string {
  if (!kind) return "Document";
  return kind
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function AdminAgenciesTable() {
  const [agencies, setAgencies] = React.useState<AgencyRecord[]>([]);
  const [search, setSearch] = React.useState("");
  const [verification, setVerification] = React.useState("ALL");
  const [loading, setLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [updatingVerificationAction, setUpdatingVerificationAction] = React.useState<"verify" | "suspend" | null>(null);
  const [updatingDocAction, setUpdatingDocAction] = React.useState<{ docId: string; action: "approve" | "reject" } | null>(null);
  const [selectedAgency, setSelectedAgency] = React.useState<AgencyRecord | null>(null);
  const [rejectingDoc, setRejectingDoc] = React.useState<{ agencyId: string; docId: string; label: string } | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage] = React.useState(6);
  const [meta, setMeta] = React.useState({ page: 1, perPage: 6, total: 0, totalPages: 1 });

  const debouncedSearch = useDebounce(search, 250);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, verification]);

  const fetchAgencies = React.useCallback((showLoading = true) => {
    if (showLoading) setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (verification !== "ALL") params.set("verification", verification);
    params.set("page", page.toString());
    params.set("perPage", perPage.toString());

    const url = `/api/admin/agencies${params.toString() ? `?${params.toString()}` : ""}`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        const extracted = extractArray(resData);
        setAgencies(extracted);
        if (resData && resData.meta) {
          setMeta(resData.meta);
        } else {
          setMeta({ page, perPage, total: extracted.length, totalPages: Math.max(1, Math.ceil(extracted.length / perPage)) });
        }
      })
      .catch(() => setAgencies([]))
      .finally(() => setLoading(false));
  }, [debouncedSearch, verification, page, perPage]);

  React.useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const handleUpdateStatus = async (id: string, newVerification: string) => {
    setUpdatingId(id);
    const targetVerificationUpper = newVerification.toUpperCase();
    const action = targetVerificationUpper === "VERIFIED" ? "verify" : "suspend";
    setUpdatingVerificationAction(action);

    const targetListingStatus =
      targetVerificationUpper === "VERIFIED"
        ? "LIVE"
        : targetVerificationUpper === "SUSPENDED"
        ? "REJECTED"
        : "DRAFT";

    const patchAgency = (a: AgencyRecord): AgencyRecord => ({
      ...a,
      verification: targetVerificationUpper,
      listingStatus: targetListingStatus,
    });

    // Real-time optimistic state update
    setAgencies((prev) => prev.map((a) => (a.id === id ? patchAgency(a) : a)));
    setSelectedAgency((prev) => (prev && prev.id === id ? patchAgency(prev) : prev));

    try {
      const res = await fetch(`/api/admin/agencies?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification: targetVerificationUpper }),
      });
      if (res.ok) {
        const resJson = await res.json();
        const updated = resJson.data;
        if (updated) {
          setAgencies((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
          setSelectedAgency((prev) => (prev && prev.id === id ? { ...prev, ...updated } : prev));
        }
        fetchAgencies(false);
      }
    } finally {
      setUpdatingId(null);
      setUpdatingVerificationAction(null);
    }
  };

  const handleUpdateDocStatus = async (
    agencyId: string,
    docId: string,
    docStatus: string,
    note?: string
  ) => {
    const action = docStatus.toUpperCase() === "APPROVED" ? "approve" : "reject";
    setUpdatingDocAction({ docId, action });

    const updatedStatusUpper = docStatus.toUpperCase();
    const updateDocList = (docs: any[]) =>
      (docs || []).map((d) =>
        d.id === docId || d.kind === docId || d.kind?.toUpperCase() === docId.toUpperCase()
          ? { ...d, status: updatedStatusUpper, ...(note ? { note } : {}) }
          : d
      );

    try {
      const res = await fetch(`/api/admin/agencies?id=${agencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, docStatus: updatedStatusUpper, note }),
      });

      // Apply document status update after response completes so the spinner displays inside the clicked button during request
      setAgencies((prev) =>
        prev.map((a) =>
          a.id === agencyId ? { ...a, documents: updateDocList(a.documents || []) } : a
        )
      );
      setSelectedAgency((prev) =>
        prev && prev.id === agencyId
          ? { ...prev, documents: updateDocList(prev.documents || []) }
          : prev
      );

      if (res.ok) {
        fetchAgencies(false);
      }
    } finally {
      setUpdatingDocAction(null);
    }
  };

  const confirmRejection = async () => {
    if (!rejectingDoc) return;
    const { agencyId, docId } = rejectingDoc;
    const note = rejectionReason.trim() || "Document does not meet compliance requirements.";
    setRejectingDoc(null);
    setRejectionReason("");
    await handleUpdateDocStatus(agencyId, docId, "REJECTED", note);
  };

  const safeAgencies = Array.isArray(agencies) ? agencies : [];

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search agency name, registration #, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="size-4 text-muted-foreground" />}
            />
          </div>
          <Select value={verification} onValueChange={setVerification}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Verification Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="PENDING">Pending Review</SelectItem>
              <SelectItem value="UNVERIFIED">Unverified</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{safeAgencies.length}</span> of{" "}
          <span className="font-semibold text-foreground">{meta.total}</span> agencies
        </p>
      </div>

      {/* Content View */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton shape="text" className="h-5 w-48" />
                <Skeleton shape="pill" className="h-6 w-24" />
              </div>
              <Skeleton shape="text" className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton shape="pill" className="h-5 w-16" />
                <Skeleton shape="pill" className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : safeAgencies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Building2 className="size-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold text-ink-900">No Agencies Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            No agencies matched your search query or verification filter. Try clearing filters or searching another keyword.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {safeAgencies.map((agency) => {
              const vUpper = (agency.verification || "").toUpperCase();
              const isVerified = vUpper === "VERIFIED";
              const isPending = vUpper === "PENDING";
              const isSuspended = vUpper === "SUSPENDED";
              const isUpdating = updatingId === agency.id;

              const docs = agency.documents || [];
              const submittedDocs = docs.filter(
                (d) => d.status && d.status.toUpperCase() !== "MISSING"
              );
              const approvedDocs = docs.filter(
                (d) => (d.status || "").toUpperCase() === "APPROVED" || (d.status || "").toUpperCase() === "VERIFIED"
              );
              const submittedCount = Math.max(submittedDocs.length, docs.length);
              const approvedCount = approvedDocs.length;

              return (
                <div
                  key={agency.id}
                  onClick={() => setSelectedAgency(agency)}
                  className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-base font-semibold text-ink-900 leading-tight group-hover:text-primary transition-colors">
                          {agency.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {agency.legalName} · Reg #{agency.registrationNumber}
                        </p>
                      </div>

                      <Badge
                        variant={isVerified ? "solid" : isPending ? "softWarning" : isSuspended ? "destructive" : "muted"}
                        size="sm"
                        className="shrink-0 uppercase text-[10px] tracking-wider"
                      >
                        {agency.verification}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 my-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <MapPin className="size-3.5 text-primary" />
                        {agency.country} ({agency.cities.join(", ")})
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5 text-primary" />
                        {agency.staffCount} Staff
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <FileCheck2 className="size-3.5 text-primary" />
                        Paperwork: {approvedCount}/{submittedCount} Approved
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {agency.categories.map((cat) => (
                        <Badge key={cat} variant="muted" size="sm" className="capitalize text-[11px]">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground group-hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAgency(agency);
                      }}
                      leftIcon={<Eye className="size-3.5" />}
                    >
                      View Full Details
                    </Button>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {!isVerified && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isUpdating}
                          isLoading={isUpdating}
                          onClick={() => handleUpdateStatus(agency.id, "VERIFIED")}
                          leftIcon={<CheckCircle2 className="size-3.5" />}
                        >
                          Verify
                        </Button>
                      )}

                      {!isSuspended && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isUpdating}
                          isLoading={isUpdating}
                          onClick={() => handleUpdateStatus(agency.id, "SUSPENDED")}
                          leftIcon={<XCircle className="size-3.5 text-destructive" />}
                        >
                          Suspend
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <DataTablePagination
            meta={meta}
            onPage={(newPage) => setPage(newPage)}
            noun="agencies"
          />
        </>
      )}

      {/* Agency Details Modal */}
      <Dialog open={!!selectedAgency} onOpenChange={(open) => !open && setSelectedAgency(null)}>
        {selectedAgency && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl font-bold text-ink-900">{selectedAgency.name}</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-1">
                    {selectedAgency.legalName} · Registration #{selectedAgency.registrationNumber}
                  </DialogDescription>
                </div>
                <Badge
                  variant={
                    selectedAgency.verification === "VERIFIED"
                      ? "solid"
                      : selectedAgency.verification === "PENDING"
                      ? "softWarning"
                      : selectedAgency.verification === "SUSPENDED"
                      ? "destructive"
                      : "muted"
                  }
                  size="sm"
                  className="uppercase text-[11px] tracking-wider"
                >
                  {selectedAgency.verification}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-2">
              {/* Overview & Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Mail className="size-4 text-primary shrink-0" />
                    <span className="truncate">{selectedAgency.email || "No email provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-4 text-primary shrink-0" />
                    <span>{selectedAgency.phone || "No phone provided"}</span>
                  </div>
                  {selectedAgency.website && (
                    <div className="flex items-center gap-2 text-primary hover:underline">
                      <Globe className="size-4 shrink-0" />
                      <a href={selectedAgency.website} target="_blank" rel="noreferrer" className="truncate">
                        {selectedAgency.website}
                      </a>
                      <ExternalLink className="size-3" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <MapPin className="size-4 text-primary shrink-0" />
                    <span>
                      {selectedAgency.country} ({selectedAgency.cities.join(", ")})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="size-4 text-primary shrink-0" />
                    <span>{selectedAgency.staffCount} Staff Members</span>
                  </div>
                  {selectedAgency.yearFounded && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="size-4 text-primary shrink-0" />
                      <span>Founded in {selectedAgency.yearFounded}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Categories & Languages */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Categories & Services
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAgency.categories.map((cat) => (
                    <Badge key={cat} variant="muted" className="capitalize text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
                {selectedAgency.languages && selectedAgency.languages.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground mr-2">Languages:</span>
                    <div className="inline-flex flex-wrap gap-1">
                      {selectedAgency.languages.map((lang) => (
                        <Badge key={lang} variant="outline" className="text-[11px]">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary / About */}
              {(selectedAgency.summary || selectedAgency.about) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    About Agency
                  </h4>
                  <p className="text-xs leading-relaxed text-foreground bg-card p-3 rounded-lg border border-border">
                    {selectedAgency.summary || selectedAgency.about}
                  </p>
                </div>
              )}

              {/* Compliance Documents */}
              {(() => {
                const modalDocs = selectedAgency.documents || [];
                const modalSubmitted = modalDocs.filter((d) => d.status && d.status.toUpperCase() !== "MISSING");
                const modalApproved = modalDocs.filter((d) => (d.status || "").toUpperCase() === "APPROVED" || (d.status || "").toUpperCase() === "VERIFIED");
                const modalSubmittedCount = Math.max(modalSubmitted.length, modalDocs.length);

                return (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Compliance Paperwork</span>
                      <span className="normal-case text-primary font-semibold text-xs">
                        {modalApproved.length}/{modalSubmittedCount} Approved
                      </span>
                    </h4>

                {!selectedAgency.documents || selectedAgency.documents.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg border border-dashed border-border">
                    No compliance paperwork submitted yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedAgency.documents.map((doc) => {
                      const docStatusUpper = (doc.status || "MISSING").toUpperCase();
                      const docApproved = docStatusUpper === "APPROVED" || docStatusUpper === "VERIFIED";
                      const docRejected = docStatusUpper === "REJECTED";
                      const docMissing = docStatusUpper === "MISSING";
                      const docIdOrKind = doc.kind || doc.id;

                      return (
                        <div
                          key={doc.id || doc.kind}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileCheck2 className="size-4 text-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{formatKindLabel(doc.kind)}</p>
                              {doc.fileUrl && (
                                <div className="mt-1">
                                  <DocumentViewerModal
                                    label={formatKindLabel(doc.kind)}
                                    url={doc.fileUrl}
                                  />
                                </div>
                              )}
                              {docRejected && doc.note && (
                                <div className="mt-1.5 text-[11px] text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20 leading-tight">
                                  <span className="font-semibold">Rejection Reason:</span> {doc.note}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant={docApproved ? "solid" : docRejected || docMissing ? "destructive" : "softWarning"}
                              size="sm"
                              className="uppercase text-[10px]"
                            >
                              {docStatusUpper}
                            </Badge>

                            {!docMissing && (
                              <div className="flex items-center gap-1">
                                {!docApproved && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-[11px] hover:border-emerald-500 hover:text-emerald-600"
                                    disabled={updatingId === selectedAgency.id || !!updatingDocAction}
                                    isLoading={updatingDocAction?.docId === docIdOrKind && updatingDocAction?.action === "approve"}
                                    onClick={() => handleUpdateDocStatus(selectedAgency.id, docIdOrKind, "APPROVED")}
                                  >
                                    <CheckCircle2 className="size-3 text-emerald-600 mr-1" />
                                    Approve
                                  </Button>
                                )}

                                {!docRejected && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-[11px] hover:border-destructive hover:text-destructive"
                                    disabled={updatingId === selectedAgency.id || !!updatingDocAction}
                                    isLoading={updatingDocAction?.docId === docIdOrKind && updatingDocAction?.action === "reject"}
                                    onClick={() => {
                                      setRejectionReason(doc.note || "");
                                      setRejectingDoc({
                                        agencyId: selectedAgency.id,
                                        docId: docIdOrKind,
                                        label: formatKindLabel(doc.kind),
                                      });
                                    }}
                                  >
                                    <XCircle className="size-3 text-destructive mr-1" />
                                    Reject
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
                );
              })()}

              {/* Staff Overview */}
              {selectedAgency.staff && selectedAgency.staff.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Staff Roster ({selectedAgency.staff.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedAgency.staff.map((member) => (
                      <div key={member.id} className="p-2.5 rounded-lg border border-border bg-card text-xs space-y-0.5">
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-muted-foreground text-[11px]">{member.role} · {member.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
              <div className="text-xs text-muted-foreground">
                Listing Status: <span className="font-semibold text-foreground uppercase">{selectedAgency.listingStatus}</span>
              </div>

              <div className="flex items-center gap-2">
                {(selectedAgency.verification || "").toUpperCase() !== "VERIFIED" && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={updatingId === selectedAgency.id}
                    isLoading={updatingVerificationAction === "verify"}
                    loadingText="Verifying..."
                    onClick={() => handleUpdateStatus(selectedAgency.id, "VERIFIED")}
                    leftIcon={<CheckCircle2 className="size-3.5" />}
                  >
                    Approve & Verify
                  </Button>
                )}

                {(selectedAgency.verification || "").toUpperCase() !== "SUSPENDED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingId === selectedAgency.id}
                    isLoading={updatingVerificationAction === "suspend"}
                    loadingText="Suspending..."
                    onClick={() => handleUpdateStatus(selectedAgency.id, "SUSPENDED")}
                    leftIcon={<XCircle className="size-3.5 text-destructive" />}
                  >
                    Suspend Agency
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Rejection Reason Modal */}
      <Dialog open={!!rejectingDoc} onOpenChange={(open) => !open && setRejectingDoc(null)}>
        {rejectingDoc && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-ink-900">
                Reject Compliance Paperwork
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Provide a reason for rejecting <span className="font-semibold text-foreground">{rejectingDoc.label}</span>. This reason will be displayed in the agency portal so they can re-upload a corrected file.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Reason for Rejection *</label>
                <Textarea
                  placeholder="e.g. Image is blurry, tax certificate is expired, or document is missing stamp..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="text-xs min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRejectingDoc(null);
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={!rejectionReason.trim() || !!updatingDocAction}
                isLoading={updatingDocAction?.action === "reject"}
                loadingText="Rejecting..."
                onClick={confirmRejection}
              >
                Confirm Rejection
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
