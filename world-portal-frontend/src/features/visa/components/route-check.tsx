"use client";

import * as React from "react";

import { ArrowRight, Check, Globe2, Info, Landmark, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountrySelect } from "@/features/trip/components/country-select";
import { resolveVisaRoute, type VisaVerdict } from "@/features/visa/requirement";
import { cn } from "@/lib/utils";

const routeIcon = {
  evisa: Zap,
  eta: Globe2,
  tvisa: Landmark,
  "visa-free": Check,
} as const;

/**
 * Step zero of the application: which visa this pair actually needs.
 *
 * Everything downstream depends on it — an eVisa or ETA is completed online
 * with document uploads, a T.Visa is an information-only submission because
 * the embassy needs the applicant in person. Asking first means nobody fills
 * in the wrong form.
 */
export function RouteCheck({
  onConfirm,
}: {
  onConfirm: (verdict: VisaVerdict) => void;
}) {
  const [origin, setOrigin] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [verdict, setVerdict] = React.useState<VisaVerdict | null>(null);

  const ready = Boolean(origin && destination);

  return (
    <div className="grid gap-6">
      <Card variant="glass" radius="2xl" padding="none" className="gap-0 p-6 sm:p-8">
        <h2 className="text-[21px] leading-tight font-semibold tracking-tight text-ink-900 sm:text-[24px]">
          Where are you travelling?
        </h2>
        <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed text-muted-foreground">
          Which passport you hold and where you are going decide what you need. Tell us
          both and we will show you which of the three applies.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <CountrySelect
            label="Passport / travelling from"
            value={origin}
            onChange={(code) => {
              setOrigin(code);
              setVerdict(null);
            }}
            exclude={destination}
            placeholder="Your country"
          />
          <CountrySelect
            label="Travelling to"
            value={destination}
            onChange={(code) => {
              setDestination(code);
              setVerdict(null);
            }}
            exclude={origin}
            placeholder="Where you are going"
          />
        </div>

        {!verdict ? (
          <div className="mt-7 flex justify-end border-t border-border pt-6">
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!ready}
              onClick={() => setVerdict(resolveVisaRoute(origin, destination))}
              rightIcon={<ArrowRight />}
            >
              Check what I need
            </Button>
          </div>
        ) : null}
      </Card>

      {verdict ? <Verdict verdict={verdict} onConfirm={onConfirm} /> : null}
    </div>
  );
}

function Verdict({
  verdict,
  onConfirm,
}: {
  verdict: VisaVerdict;
  onConfirm: (verdict: VisaVerdict) => void;
}) {
  const Icon = routeIcon[verdict.route];
  const free = verdict.route === "visa-free";

  return (
    <Card
      variant="glass"
      radius="2xl"
      padding="none"
      className={cn("gap-0 p-6 sm:p-8", free && "border-success/40")}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "grid size-11 place-items-center rounded-xl",
            free ? "bg-success/15 text-success" : "bg-primary/25 text-ink-900",
          )}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {verdict.origin?.name} → {verdict.destination?.name}
          </p>
          <p className="text-[20px] font-semibold tracking-tight text-ink-900">
            {verdict.label}
          </p>
        </div>
        {!free ? (
          <Badge variant="muted" size="md" className="ml-auto">
            {verdict.turnaround}
          </Badge>
        ) : null}
      </div>

      <p className="mt-5 text-[14px] leading-relaxed text-ink-800">{verdict.summary}</p>

      {verdict.route === "tvisa" ? (
        <p className="mt-5 flex items-start gap-2.5 rounded-xl border border-primary/40 bg-primary/12 p-3.5 text-[13px] leading-relaxed text-ink-900">
          <Landmark className="mt-0.5 size-4 shrink-0 text-ink-900" />
          <span>
            <strong className="font-semibold">This one finishes in person.</strong> You
            can still start it here — we just collect your details now and handle the
            embassy paperwork and appointment for you.
          </span>
        </p>
      ) : null}

      <p className="mt-6 text-[13px] font-semibold text-ink-900">What happens next</p>
      <ol className="mt-3 grid gap-2.5">
        {verdict.next.map((step, i) => (
          <li key={step} className="flex items-start gap-2.5">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-ink-800">
              {i + 1}
            </span>
            <span className="text-[13.5px] leading-relaxed text-ink-800">{step}</span>
          </li>
        ))}
      </ol>

      <p className="mt-6 flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Based on the usual rules for this pair. A consultant confirms it against the
        current requirements before anything is filed — and before you pay.
      </p>

      <div className="mt-7 border-t border-border pt-6">
        {free ? (
          <Button asChild variant="outline" size="block">
            <a href="/start">Plan the rest of the trip</a>
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="block"
            onClick={() => onConfirm(verdict)}
          >
            {verdict.online
              ? `Continue my ${verdict.label} application`
              : "Start my embassy application"}
            <ArrowRight />
          </Button>
        )}
      </div>
    </Card>
  );
}
