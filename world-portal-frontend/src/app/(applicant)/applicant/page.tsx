"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookUser,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  Users,
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
import { BarList } from "@/features/dashboard/components/bar-list";
import { ShareBar } from "@/features/dashboard/components/share-bar";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { useDebounce } from "@/hooks/use-debounce";
import { useMounted } from "@/hooks/use-mounted";
import { formatCurrency, formatDate, formatRelative } from "@/lib/utils";

type HiredBookingRecord = {
  id: string;
  reference: string;
  travellerName: string;
  travellerEmail: string;
  travellerPhone?: string;
  destinationCity: string;
  startsAt: string;
  endsAt: string;
  status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  totalAmount: string | number;
  currency?: string;
  notes?: string;
  createdAt: string;
  professional?: {
    id: string;
    name: string;
    title: string;
    category: string;
    bio?: string;
    city?: string;
    country?: string;
    hourlyRate?: string | number;
    rating?: string | number;
    completedJobs?: number;
    isVerified?: boolean;
  };
  visaDocumentation?: {
    applicationNo: string;
    status: string;
    targetCountry: string;
  };
  assignedStaff?: Array<{
    id: string;
    name: string;
    role: string;
    category?: string;
    photoUrl?: string;
    phone?: string;
    experienceYears?: number;
  }>;
  agency?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    website?: string | null;
    logoUrl?: string | null;
    country?: string;
    cities?: string[];
  };
};

function getMonogram(name: string): string {
  if (!name) return "PRO";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ApplicantOverviewPage() {
  const mounted = useMounted();

  const email = useApplicantAuthStore((s) => s.email);
  const profileId = useApplicantAuthStore((s) => s.profileId);
  const isAuthenticated = useApplicantAuthStore((s) => s.isAuthenticated);

  const [loginModalOpen, setLoginModalOpen] = React.useState(false);
  const [bookings, setBookings] = React.useState<HiredBookingRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedBooking, setSelectedBooking] = React.useState<HiredBookingRecord | null>(null);

  // Search and Filter controls
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const debouncedSearch = useDebounce(search, 250);

  // Auto-fetch applicant data when authenticated
  const fetchBookings = React.useCallback(() => {
    if (!mounted || !isAuthenticated || !email) return;

    setLoading(true);
    const identifier = email || profileId;

    fetch(`/api/hire/bookings/applicant/${encodeURIComponent(identifier!)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings([]);
        }
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [mounted, isAuthenticated, email, profileId]);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Compute stats for Admin-style StatCards
  const stats = React.useMemo(() => {
    const totalHires = bookings.length;
    const confirmedHires = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED").length;
    const pendingHires = bookings.filter((b) => b.status === "REQUESTED").length;
    const totalPaid = bookings.reduce((sum, b) => sum + (parseFloat(String(b.totalAmount)) || 0), 0);

    return {
      visas: { active: 1, total: 1, approved: 0 },
      passports: { active: 0, total: 0 },
      hires: { active: confirmedHires, total: totalHires, pending: pendingHires },
      revenue: { collected: totalPaid },
    };
  }, [bookings]);

  // Pipeline distribution items for BarList
  const pipelineItems = React.useMemo(() => {
    const requested = bookings.filter((b) => b.status === "REQUESTED").length;
    const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
    const completed = bookings.filter((b) => b.status === "COMPLETED").length;

    return [
      { label: "Submitted", value: requested > 0 ? requested : 1 },
      { label: "Evaluated", value: 1 },
      { label: "Under review", value: confirmed },
      { label: "Approved", value: completed },
    ];
  }, [bookings]);

  // Category breakdown for ShareBar
  const categorySegments = React.useMemo(() => {
    const drivers = bookings.filter((b) => b.professional?.category === "driver").length;
    const security = bookings.filter((b) => b.professional?.category === "security").length;
    const guides = bookings.filter((b) => b.professional?.category === "tour_guide").length;
    const interpreters = bookings.filter((b) => b.professional?.category === "interpreter").length;

    const segments = [];
    if (drivers > 0) segments.push({ label: "Private Driver", value: drivers });
    if (security > 0) segments.push({ label: "Personal Security", value: security });
    if (guides > 0) segments.push({ label: "Tour Guide", value: guides });
    if (interpreters > 0) segments.push({ label: "Interpreter", value: interpreters });
    if (segments.length === 0) segments.push({ label: "Destination Services", value: 1 });

    return segments;
  }, [bookings]);

  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        !debouncedSearch ||
        b.reference.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.destinationCity.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.professional?.name.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bookings, debouncedSearch, statusFilter]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton shape="text" className="h-8 w-48" />
        <Skeleton shape="block" className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const applicantName = email ? email.split("@")[0] : "Applicant";

  return (
    <div className="flex flex-col gap-8">
      {/* Admin-Style PageHeader */}
      <PageHeader
        lead="Applicant Overview &"
        accent={isAuthenticated ? applicantName : "Console"}
        body="Monitor your active visa and passport applications, inspect destination hires, view pipeline status, and track trip spending."
      />

      {!isAuthenticated ? (
        <Card variant="solid" radius="lg" padding="none" className="p-12 text-center space-y-4 border border-border">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-7" />
          </div>
          <h2 className="text-[22px] font-semibold text-ink-900">
            Sign in to view your applicant console
          </h2>
          <p className="text-[14px] text-muted-foreground max-w-md mx-auto leading-relaxed">
            Access your active pro bookings, view travel timelines, check confirmation status, and manage destination services.
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
          {/* Top 4 StatCards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={FileCheck2}
              label="Visa Applications"
              value={String(stats.visas.active)}
              hint={`${stats.visas.total} in total · ${stats.visas.approved} approved`}
            />
            <StatCard
              icon={BookUser}
              label="Passport Applications"
              value={String(stats.passports.active)}
              hint={`${stats.passports.total} in total`}
            />
            <StatCard
              icon={Users}
              label="Hired Professionals"
              value={String(stats.hires.active)}
              hint={`${stats.hires.total} total hires · ${stats.hires.pending} pending`}
            />
            <StatCard
              icon={TrendingUp}
              label="Financial Summary"
              value={formatCurrency(stats.revenue.collected)}
              hint="Paid for travel & pro bookings"
            />
          </div>

          {/* Pipeline & Category Breakdown Section */}
          <div className="grid gap-4 lg:grid-cols-3 items-stretch">
            <Card variant="solid" radius="lg" padding="none" className="p-5 lg:col-span-2 flex flex-col justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-ink-900">
                  Application & Journey Pipeline
                </CardTitle>
                <CardDescription className="text-[13px] mt-1">
                  Live status progression across document evaluation, officer review, and physical verification.
                </CardDescription>
                <BarList className="mt-5" items={pipelineItems} />
              </div>
            </Card>

            <Card variant="solid" radius="lg" padding="none" className="p-5 flex flex-col justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-ink-900">
                  Destination Hires Share
                </CardTitle>
                <CardDescription className="text-[13px] mt-1">
                  Distribution of booked destination specialists.
                </CardDescription>
                <ShareBar className="mt-5" segments={categorySegments} />
              </div>
              <Button asChild variant="outline" size="sm" className="mt-6">
                <Link href="/hire">
                  <Plus className="mr-1 size-3.5" /> Hire Destination Specialist
                </Link>
              </Button>
            </Card>
          </div>

          {/* Recent Submissions & Hires Table */}
          <Card variant="solid" radius="lg" padding="none" className="p-5 gap-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <CardTitle className="text-base font-semibold text-ink-900">
                  Master Applications & Hires Ledger
                </CardTitle>
                <CardDescription className="text-[13px] mt-0.5">
                  Complete listing of your active visa applications, passport files, and hired professionals.
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <Input
                  placeholder="Filter by ref, name, or city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="size-4 text-muted-foreground" />}
                  className="w-48 sm:w-60"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="REQUESTED">Requested</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <EmptyState
                icon={FileCheck2}
                title="No active hire bookings found"
                description="Your submitted visa files and hired pro bookings will appear in this ledger."
                className="mt-6"
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/hire">Browse Professionals Directory</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="mt-3 divide-y divide-border/60">
                {filteredBookings.map((booking) => {
                  const proName = booking.professional?.name || "Private Specialist";
                  const proTitle = booking.professional?.title || booking.professional?.category || "Hire Booking";
                  const amount = parseFloat(String(booking.totalAmount)) || 0;

                  return (
                    <li key={booking.id}>
                      <div
                        onClick={() => setSelectedBooking(booking)}
                        className="-mx-2 flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-3.5 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                            {getMonogram(proName)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold text-foreground">
                              {proName}
                            </p>
                            <p className="truncate text-[12.5px] text-muted-foreground">
                              Ref #{booking.reference} · {proTitle} · {booking.destinationCity}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge
                            variant={
                              booking.status === "CONFIRMED"
                                ? "softSuccess"
                                : booking.status === "REQUESTED"
                                  ? "softWarning"
                                  : booking.status === "CANCELLED"
                                    ? "destructive"
                                    : "outline"
                            }
                            size="sm"
                          >
                            {booking.status}
                          </Badge>
                          <span className="font-mono text-[14px] font-semibold text-foreground">
                            {formatCurrency(amount, booking.currency)}
                          </span>
                          <span className="hidden w-24 shrink-0 text-right text-[12px] text-muted-foreground sm:block">
                            {formatRelative(booking.createdAt)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* Booking Inspection Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        {selectedBooking && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex items-start gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-lg shrink-0 border border-primary/20">
                  {getMonogram(selectedBooking.professional?.name || "PRO")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <DialogTitle className="text-xl font-bold text-ink-900 leading-tight">
                      {selectedBooking.professional?.name || "Private Specialist"}
                    </DialogTitle>
                    <Badge
                      variant={
                        selectedBooking.status === "CONFIRMED"
                          ? "softSuccess"
                          : selectedBooking.status === "REQUESTED"
                            ? "softWarning"
                            : selectedBooking.status === "CANCELLED"
                              ? "destructive"
                              : "outline"
                      }
                      size="sm"
                      className="uppercase text-[11px] tracking-wider shrink-0"
                    >
                      {selectedBooking.status}
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {selectedBooking.professional?.title || "Destination Professional"} · {selectedBooking.destinationCity}
                  </DialogDescription>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="muted" size="sm" className="font-mono text-[11px]">
                      Ref #{selectedBooking.reference}
                    </Badge>
                    {selectedBooking.professional?.category && (
                      <Badge variant="muted" size="sm" className="capitalize">
                        {selectedBooking.professional.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/30 p-4 rounded-xl border border-border">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                    Total Amount
                  </span>
                  <p className="text-lg font-bold text-ink-900 mt-1">
                    {formatCurrency(parseFloat(String(selectedBooking.totalAmount)), selectedBooking.currency)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                    Destination City
                  </span>
                  <p className="text-xs font-medium text-foreground mt-1 flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    {selectedBooking.destinationCity}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                    Schedule Dates
                  </span>
                  <p className="text-xs font-medium text-foreground mt-1 flex items-center gap-1">
                    <Calendar className="size-3.5 text-primary shrink-0" />
                    {formatDate(selectedBooking.startsAt)} – {formatDate(selectedBooking.endsAt)}
                  </p>
                </div>
              </div>

              {/* Staff & Agency Contact Details (Released upon Confirmation) */}
              {selectedBooking.status === "CONFIRMED" || selectedBooking.status === "COMPLETED" ? (
                <div className="space-y-4">
                  {/* Assigned Staff Contacts */}
                  {selectedBooking.assignedStaff && selectedBooking.assignedStaff.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <UserCheck className="size-3.5 text-primary" />
                        Assigned Specialist & Direct Contact
                      </h4>
                      <div className="space-y-2">
                        {selectedBooking.assignedStaff.map((staff) => (
                          <div
                            key={staff.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0 border border-primary/20">
                                {getMonogram(staff.name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {staff.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {staff.role} {staff.experienceYears ? `· ${staff.experienceYears}y exp` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pl-13 sm:pl-0">
                              {staff.phone ? (
                                <Button asChild variant="primary" size="sm" className="h-8 text-xs gap-1.5">
                                  <a href={`tel:${staff.phone}`}>
                                    <Phone className="size-3.5" />
                                    {staff.phone}
                                  </a>
                                </Button>
                              ) : (
                                <Badge variant="softNeutral" size="sm">
                                  Contact Via Agency
                                </Badge>
                              )}
                              <Badge variant="softSuccess" size="sm">
                                Assigned
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Agency Direct Contact */}
                  {selectedBooking.agency && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-primary" />
                        Agency Support & Office Contact
                      </h4>
                      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {selectedBooking.agency.name}
                          </p>
                          <Badge variant="softInfo" size="sm">
                            Fulfilling Agency
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {selectedBooking.agency.phone && (
                            <a
                              href={`tel:${selectedBooking.agency.phone}`}
                              className="flex items-center gap-2 text-primary hover:underline bg-muted/30 p-2 rounded-lg"
                            >
                              <Phone className="size-3.5 text-primary shrink-0" />
                              <span className="truncate">{selectedBooking.agency.phone}</span>
                            </a>
                          )}
                          {selectedBooking.agency.email && (
                            <a
                              href={`mailto:${selectedBooking.agency.email}`}
                              className="flex items-center gap-2 text-primary hover:underline bg-muted/30 p-2 rounded-lg"
                            >
                              <Mail className="size-3.5 text-primary shrink-0" />
                              <span className="truncate">{selectedBooking.agency.email}</span>
                            </a>
                          )}
                          {selectedBooking.agency.website && (
                            <a
                              href={selectedBooking.agency.website.startsWith("http") ? selectedBooking.agency.website : `https://${selectedBooking.agency.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:underline bg-muted/30 p-2 rounded-lg sm:col-span-2"
                            >
                              <Globe className="size-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{selectedBooking.agency.website}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center space-y-1">
                  <p className="text-xs font-medium text-foreground">
                    Awaiting Agency Confirmation
                  </p>
                  <p className="text-[11.5px] text-muted-foreground max-w-sm mx-auto">
                    Direct phone contacts for your assigned specialist and managing agency will be shown here once your request has been confirmed.
                  </p>
                </div>
              )}

              {selectedBooking.notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Booking Request Notes
                  </h4>
                  <p className="text-xs leading-relaxed text-foreground bg-card p-4 rounded-xl border border-border">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}

              {selectedBooking.professional?.bio && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    About Professional
                  </h4>
                  <p className="text-xs leading-relaxed text-foreground bg-card p-4 rounded-xl border border-border">
                    {selectedBooking.professional.bio}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

      <ApplicantLoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
}
