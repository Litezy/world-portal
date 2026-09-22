"use client";

import * as React from "react";
import {
  Briefcase,
  CheckCircle2,
  Eye,
  Globe,
  Languages,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  Star,
  UserCheck,
  UserX,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";

type ProfessionalRecord = {
  id: string;
  slug: string;
  name: string;
  title: string;
  category: string;
  bio: string;
  city: string;
  country: string;
  countryCode?: string;
  hourlyRate: string | number;
  currency?: string;
  rating: string | number;
  completedJobs: number;
  isVerified: boolean;
  languages?: string[];
  skills?: string[];
  email?: string;
  phone?: string;
  avatarUrl?: string;
  bookings?: any[];
  _count?: {
    ratings?: number;
  };
};

function extractArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (Array.isArray(val.data)) return val.data;
  if (Array.isArray(val.data?.data)) return val.data.data;
  return [];
}

function getMonogram(name: string): string {
  if (!name) return "PRO";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function AdminProfessionalsTable() {
  const [professionals, setProfessionals] = React.useState<ProfessionalRecord[]>([]);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("ALL");
  const [loading, setLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [selectedPro, setSelectedPro] = React.useState<ProfessionalRecord | null>(null);

  const debouncedSearch = useDebounce(search, 250);

  const fetchProfessionals = React.useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (category !== "ALL") params.set("category", category);

    const url = `/api/admin/professionals${params.toString() ? `?${params.toString()}` : ""}`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        const extracted = extractArray(resData);
        setProfessionals(extracted);
        if (selectedPro) {
          const match = extracted.find((p) => p.id === selectedPro.id);
          if (match) setSelectedPro(match);
        }
      })
      .catch(() => setProfessionals([]))
      .finally(() => setLoading(false));
  }, [debouncedSearch, category, selectedPro?.id]);

  React.useEffect(() => {
    fetchProfessionals();
  }, [debouncedSearch, category]);

  const handleToggleVerification = async (id: string, currentVerified: boolean) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/professionals?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !currentVerified }),
      });
      if (res.ok) {
        if (selectedPro && selectedPro.id === id) {
          setSelectedPro({ ...selectedPro, isVerified: !currentVerified });
        }
        fetchProfessionals();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const safeProfessionals = Array.isArray(professionals) ? professionals : [];

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search name, title, bio, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="size-4 text-muted-foreground" />}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="photographer">Photographer</SelectItem>
              <SelectItem value="videographer">Videographer</SelectItem>
              <SelectItem value="chef">Chef / Catering</SelectItem>
              <SelectItem value="interpreter">Interpreter</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="childcare">Childcare</SelectItem>
              <SelectItem value="event">Event Planner</SelectItem>
              <SelectItem value="freelancer">Freelancer / Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{safeProfessionals.length}</span> professionals
        </p>
      </div>

      {/* Content View */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton shape="text" className="h-5 w-48" />
                <Skeleton shape="pill" className="h-6 w-20" />
              </div>
              <Skeleton shape="text" className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : safeProfessionals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Briefcase className="size-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold text-ink-900">No Professionals Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            No professional profiles matched your search or category filter. Try clearing query filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {safeProfessionals.map((pro) => {
            const isUpdating = updatingId === pro.id;
            const rate = parseFloat(String(pro.hourlyRate)) || 0;

            return (
              <div
                key={pro.id}
                onClick={() => setSelectedPro(pro)}
                className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-ink-900 leading-tight group-hover:text-primary transition-colors">
                          {pro.name}
                        </h3>
                        <span className="flex items-center gap-1 text-xs font-semibold text-ink-900">
                          <Star className="size-3.5 fill-current text-highlight" />
                          {pro.rating}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                        {pro.title}
                      </p>
                    </div>

                    <Badge
                      variant={pro.isVerified ? "solid" : "muted"}
                      size="sm"
                      className="shrink-0 uppercase text-[10px] tracking-wider"
                    >
                      {pro.isVerified ? "VERIFIED" : "UNVERIFIED"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 my-2">
                    {pro.bio}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 my-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <MapPin className="size-3.5 text-primary" />
                      {pro.city}, {pro.country}
                    </span>
                    <span>·</span>
                    <Badge variant="muted" size="sm" className="capitalize text-[11px]">
                      {pro.category}
                    </Badge>
                    <span>·</span>
                    <span>{pro.completedJobs} jobs completed</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-base font-bold text-ink-900">
                        {formatCurrency(rate)}
                      </span>
                      <span className="text-xs text-muted-foreground"> / hr</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground group-hover:text-primary hidden sm:inline-flex"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPro(pro);
                      }}
                      leftIcon={<Eye className="size-3.5" />}
                    >
                      View Details
                    </Button>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant={pro.isVerified ? "outline" : "primary"}
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => handleToggleVerification(pro.id, pro.isVerified)}
                      leftIcon={pro.isVerified ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                    >
                      {pro.isVerified ? "Unverify" : "Verify Profile"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Professional Details Modal */}
      <Dialog open={!!selectedPro} onOpenChange={(open) => !open && setSelectedPro(null)}>
        {selectedPro && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex items-start gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-lg shrink-0">
                  {getMonogram(selectedPro.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <DialogTitle className="text-xl font-bold text-ink-900 leading-tight">
                      {selectedPro.name}
                    </DialogTitle>
                    <Badge
                      variant={selectedPro.isVerified ? "solid" : "muted"}
                      size="sm"
                      className="uppercase text-[11px] tracking-wider shrink-0"
                    >
                      {selectedPro.isVerified ? "VERIFIED PROFILE" : "UNVERIFIED PROFILE"}
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {selectedPro.title} · {selectedPro.city}, {selectedPro.country}
                  </DialogDescription>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="muted" size="sm">
                      <Star className="size-3.5 fill-current text-highlight" />
                      {selectedPro.rating} Rating
                    </Badge>
                    <Badge variant="muted" size="sm" className="capitalize">
                      {selectedPro.category}
                    </Badge>
                    <Badge variant="muted" size="sm">
                      {selectedPro.completedJobs} Jobs Completed
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-2">
              {/* Rate & Contact Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/30 p-4 rounded-xl border border-border">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Hourly Rate
                  </span>
                  <p className="text-lg font-bold text-ink-900">
                    {formatCurrency(parseFloat(String(selectedPro.hourlyRate)) || 0)}
                    <span className="text-xs font-normal text-muted-foreground"> / hour</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Location
                  </span>
                  <p className="text-xs font-medium text-foreground flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    {selectedPro.city}, {selectedPro.country}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Contact Info
                  </span>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="truncate flex items-center gap-1">
                      <Mail className="size-3 text-primary shrink-0" />
                      {selectedPro.email || "No email listed"}
                    </p>
                    {selectedPro.phone && (
                      <p className="flex items-center gap-1">
                        <Phone className="size-3 text-primary shrink-0" />
                        {selectedPro.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  About {selectedPro.name}
                </h4>
                <p className="text-xs leading-relaxed text-foreground bg-card p-4 rounded-xl border border-border">
                  {selectedPro.bio || "No detailed biography provided for this profile."}
                </p>
              </div>

              {/* Languages & Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedPro.languages && selectedPro.languages.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Languages className="size-3.5 text-primary" />
                      Languages Spoken
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPro.languages.map((lang) => (
                        <Badge key={lang} variant="muted" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPro.skills && selectedPro.skills.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Specialties & Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPro.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Stats / Activity */}
              {selectedPro.bookings && selectedPro.bookings.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recent Booking History ({selectedPro.bookings.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedPro.bookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs"
                      >
                        <div>
                          <p className="font-medium text-foreground">Ref #{booking.reference || booking.id}</p>
                          <p className="text-muted-foreground text-[11px]">{booking.status || "Completed"}</p>
                        </div>
                        <Badge variant="muted" size="sm">
                          {formatCurrency(parseFloat(String(booking.totalAmount || 0)))}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
              <div className="text-xs text-muted-foreground">
                Profile ID: <span className="font-mono text-[11px] text-foreground">{selectedPro.id}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={selectedPro.isVerified ? "outline" : "primary"}
                  size="sm"
                  disabled={updatingId === selectedPro.id}
                  onClick={() => handleToggleVerification(selectedPro.id, selectedPro.isVerified)}
                  leftIcon={selectedPro.isVerified ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                >
                  {selectedPro.isVerified ? "Revoke Verification" : "Verify Profile Badge"}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
