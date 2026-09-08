"use client";

import {
  BadgeCheck,
  CalendarClock,
  Check,
  Clock,
  Languages,
  MapPin,
  Plus,
  Sparkles,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Professional, professionLabels } from "@/content/professionals";
import { ProAvatar } from "@/features/hire/components/pro-avatar";
import { formatCurrency } from "@/lib/utils";

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/50 p-3.5">
      <Icon className="size-4 text-muted-foreground" />
      <p className="mt-2 text-[10.5px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] font-medium text-ink-900">{value}</p>
    </div>
  );
}

/** The full profile. Opened from a card; adding from here closes it. */
export function ProModal({
  pro,
  open,
  inBasket,
  onOpenChange,
  onToggle,
}: {
  pro: Professional | null;
  open: boolean;
  inBasket: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: () => void;
}) {
  if (!pro) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl gap-0 overflow-y-auto p-0">
        <div className="flex items-start gap-4 p-6 pb-0 sm:p-8 sm:pb-0">
          <ProAvatar
            pro={pro}
            className="size-16 rounded-2xl"
            textClassName="text-lg"
          />
          <div className="min-w-0 flex-1">
            <DialogTitle className="flex items-center gap-2 text-[22px]">
              {pro.verified ? (
                <BadgeCheck className="size-5 shrink-0 text-primary" />
              ) : null}
              {pro.name}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13.5px]">
              {pro.tagline} · {pro.city}
            </DialogDescription>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="muted" size="sm">
                <Star className="size-3 fill-current text-highlight" />
                {pro.rating} · {pro.jobs} jobs
              </Badge>
              <Badge variant="muted" size="sm">
                {pro.years} years experience
              </Badge>
              <Badge variant="solid" size="sm">
                {professionLabels[pro.profession]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8">
          <section className="rounded-xl border border-border bg-secondary/50 p-4">
            <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
              <Sparkles className="size-4 text-primary" />
              About {pro.name.split(" ")[0]}
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-800">
              {pro.about}
            </p>
          </section>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact icon={Languages} label="Languages" value={pro.languages.join(", ")} />
            <Fact icon={Clock} label="Experience" value={`${pro.years} years`} />
            <Fact icon={CalendarClock} label="Availability" value={pro.availability} />
            <Fact icon={MapPin} label="Based in" value={pro.city} />
          </div>

          <section>
            <h3 className="text-[13px] font-semibold text-ink-900">Packages</h3>
            <ul className="mt-3 grid gap-2">
              {pro.packages.map((pkg) => (
                <li
                  key={pkg.name}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border p-3.5"
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium text-ink-900">
                      {pkg.name}
                    </span>
                    <span className="block text-[12.5px] text-muted-foreground">
                      {pkg.description}
                    </span>
                  </span>
                  <span className="shrink-0 text-[15px] font-semibold text-ink-900">
                    {formatCurrency(pkg.price)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-[13px] font-semibold text-ink-900">Included</h3>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {pro.included.map((item) => (
                <li key={item}>
                  <Badge variant="muted" size="sm">
                    <Check className="size-3 text-success" />
                    {item}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-[13px] font-semibold text-ink-900">Skills</h3>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {pro.skills.map((skill) => (
                <li key={skill}>
                  <Badge variant="outline" size="sm">
                    {skill}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-[12px] text-muted-foreground">
            Cancellation: {pro.cancellation}
          </p>
        </div>

        {/* Sticky so the price and the action stay reachable in a long profile. */}
        <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-border bg-background p-5 sm:px-8">
          <span>
            <span className="block text-[20px] font-semibold text-ink-900">
              {formatCurrency(pro.price)}
            </span>
            <span className="block text-[11.5px] text-muted-foreground">
              {pro.unit}
            </span>
          </span>
          <Button
            variant={inBasket ? "outline" : "primary"}
            size="md"
            onClick={onToggle}
            aria-pressed={inBasket}
            leftIcon={inBasket ? <Check /> : <Plus />}
          >
            {inBasket ? "In basket" : "Add to basket"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
