"use client";

import * as React from "react";
import Link from "next/link";

import { ArrowLeft, ArrowRight, Check, Clock, Plane } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountrySelect } from "@/features/trip/components/country-select";
import {
  buildPlan,
  type Extra,
  extraLabels,
  type PassportAnswer,
  primaryStep,
  type TripAnswers,
  type VisaAnswer,
} from "@/features/trip/plan";
import { countryName } from "@/lib/countries";
import { cn } from "@/lib/utils";

const passportOptions: { value: PassportAnswer; label: string; hint: string }[] = [
  {
    value: "yes",
    label: "Yes, and it is valid",
    hint: "More than six months left on it",
  },
  {
    value: "expiring",
    label: "Yes, but it expires soon",
    hint: "Within the next six months",
  },
  { value: "no", label: "No, I do not have one", hint: "Or it has already expired" },
];

const visaOptions: { value: VisaAnswer; label: string; hint: string }[] = [
  { value: "yes", label: "Yes, I already have one", hint: "Valid for these dates" },
  { value: "no", label: "No, I need one", hint: "We will apply on your behalf" },
  {
    value: "unsure",
    label: "I am not sure",
    hint: "Most people are not — we will check",
  },
];

const extraOptions: Extra[] = ["flights", "hotels", "experiences"];

type Stage = "route" | "passport" | "visa" | "extras" | "plan";

/**
 * The front door for anyone who does not know what they need.
 *
 * Where you are going decides which questions matter, and the answers decide
 * which service you are sent to — so it asks in that order and reveals one
 * question at a time rather than showing a wall of fields.
 */
export function TripPlanner() {
  const [answers, setAnswers] = React.useState<TripAnswers>({
    origin: "",
    destination: "",
    passport: null,
    visa: null,
    extras: [],
  });
  const [stage, setStage] = React.useState<Stage>("route");

  const set = <K extends keyof TripAnswers>(key: K, value: TripAnswers[K]) =>
    setAnswers((a) => ({ ...a, [key]: value }));

  /**
   * Toggling has to derive from the previous state, not from the `answers`
   * captured in this render — two checkbox clicks inside one React batch would
   * otherwise both start from the same list and the second would discard the
   * first.
   */
  const toggleExtra = (extra: Extra) =>
    setAnswers((a) => ({
      ...a,
      extras: a.extras.includes(extra)
        ? a.extras.filter((e) => e !== extra)
        : [...a.extras, extra],
    }));

  const routeReady = Boolean(answers.origin && answers.destination);

  if (stage === "plan") {
    return (
      <TripPlan
        answers={answers}
        onBack={() => setStage("extras")}
        onRestart={() => {
          setAnswers({
            origin: "",
            destination: "",
            passport: null,
            visa: null,
            extras: [],
          });
          setStage("route");
        }}
      />
    );
  }

  return (
    <Card variant="glass" radius="2xl" padding="none" className="gap-0 p-6 sm:p-8">
      <Progress stage={stage} />

      {stage === "route" ? (
        <Step
          title="Where are you travelling?"
          hint="We only need the two countries for now — dates come later."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <CountrySelect
              label="Travelling from"
              value={answers.origin}
              onChange={(code) => set("origin", code)}
              exclude={answers.destination}
              placeholder="Your country"
            />
            <CountrySelect
              label="Travelling to"
              value={answers.destination}
              onChange={(code) => set("destination", code)}
              exclude={answers.origin}
              placeholder="Where you are going"
            />
          </div>

          <Actions
            onNext={() => setStage("passport")}
            nextDisabled={!routeReady}
            nextLabel="Continue"
          />
        </Step>
      ) : null}

      {stage === "passport" ? (
        <Step
          title="Do you have a passport?"
          hint="This decides everything else — a visa is stamped into your passport, so it has to exist first."
        >
          <Choices
            options={passportOptions}
            value={answers.passport}
            onChange={(v) => {
              set("passport", v as PassportAnswer);
              setStage("visa");
            }}
          />
          <Actions onBack={() => setStage("route")} />
        </Step>
      ) : null}

      {stage === "visa" ? (
        <Step
          title={`Do you have a visa for ${countryName(answers.destination) || "your destination"}?`}
          hint="A visa is that country's permission for you to enter. Not everyone needs one."
        >
          <Choices
            options={visaOptions}
            value={answers.visa}
            onChange={(v) => {
              set("visa", v as VisaAnswer);
              setStage("extras");
            }}
          />
          <Actions onBack={() => setStage("passport")} />
        </Step>
      ) : null}

      {stage === "extras" ? (
        <Step
          title="Anything else you want us to handle?"
          hint="Optional — pick any that apply, or none at all."
        >
          <ul className="grid gap-2.5">
            {extraOptions.map((extra) => {
              const active = answers.extras.includes(extra);
              return (
                <li key={extra}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={active}
                    onClick={() => toggleExtra(extra)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-300",
                      "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
                      active
                        ? "border-primary bg-primary/20"
                        : "border-border/70 bg-ink-50/60 hover:border-primary/50 hover:bg-primary/8",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-white",
                      )}
                    >
                      {active ? <Check className="size-3.5" strokeWidth={3} /> : null}
                    </span>
                    <span className="text-[14px] font-medium text-ink-900">
                      {extraLabels[extra]}
                    </span>
                    <Badge variant="muted" size="sm" className="ml-auto">
                      Soon
                    </Badge>
                  </button>
                </li>
              );
            })}
          </ul>

          <Actions
            onBack={() => setStage("visa")}
            onNext={() => setStage("plan")}
            nextLabel="See my plan"
          />
        </Step>
      ) : null}
    </Card>
  );
}

const STAGES: Stage[] = ["route", "passport", "visa", "extras"];

function Progress({ stage }: { stage: Stage }) {
  const index = STAGES.indexOf(stage);
  return (
    <div className="mb-7">
      <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${((index + 1) / (STAGES.length + 1)) * 100}%` }}
        />
      </div>
      <p className="mt-2.5 text-[12px] font-medium text-muted-foreground">
        Question {index + 1} of {STAGES.length}
      </p>
    </div>
  );
}

function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-[21px] leading-tight font-semibold tracking-tight text-ink-900 sm:text-[24px]">
        {title}
      </h2>
      <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed text-muted-foreground">
        {hint}
      </p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Choices<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; hint: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" className="grid gap-2.5">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-xl border px-4 py-3.5 text-left transition-all duration-300",
              "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
              active
                ? "border-primary bg-primary/20"
                : "border-border/70 bg-ink-50/60 hover:border-primary/50 hover:bg-primary/8",
            )}
          >
            <span className="block text-[14.5px] font-semibold text-ink-900">
              {option.label}
            </span>
            <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
              {option.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Actions({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-6">
      {onBack ? (
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onBack}
          leftIcon={<ArrowLeft />}
        >
          Back
        </Button>
      ) : (
        <span />
      )}
      {onNext ? (
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onNext}
          disabled={nextDisabled}
          rightIcon={<ArrowRight />}
        >
          {nextLabel ?? "Continue"}
        </Button>
      ) : null}
    </div>
  );
}

function TripPlan({
  answers,
  onBack,
  onRestart,
}: {
  answers: TripAnswers;
  onBack: () => void;
  onRestart: () => void;
}) {
  const steps = buildPlan(answers);
  const first = primaryStep(steps);
  const from = countryName(answers.origin);
  const to = countryName(answers.destination);

  return (
    <div className="grid gap-6">
      <Card variant="glass" radius="2xl" padding="none" className="gap-0 p-6 sm:p-8">
        <Badge variant="solid" size="md" dot dotClassName="bg-ink-900/70">
          Your plan
        </Badge>

        <h2 className="mt-5 text-[24px] leading-tight font-semibold tracking-tight text-ink-900 sm:text-[28px]">
          {from} to {to}{" "}
          <span className="heading-serif font-normal">— here is the order.</span>
        </h2>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-muted-foreground">
          Each step has to happen before the one under it. Start at the top; we will
          handle the rest as you go.
        </p>

        <ol className="mt-8 grid gap-3">
          {steps.map((step, i) => (
            <li key={step.id}>
              <div
                className={cn(
                  "rounded-2xl border p-5 transition-colors",
                  step.state === "now" && "border-primary bg-primary/12",
                  step.state === "next" && "border-border bg-white/60",
                  step.state === "soon" && "border-border/60 bg-ink-50/50",
                  step.state === "done" && "border-success/35 bg-success/8",
                )}
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold",
                      step.state === "now" && "bg-primary text-primary-foreground",
                      step.state === "done" && "bg-success text-success-foreground",
                      (step.state === "next" || step.state === "soon") &&
                        "bg-secondary text-muted-foreground",
                    )}
                  >
                    {step.state === "done" ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : (
                      i + 1
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[16px] font-semibold tracking-tight text-ink-900">
                        {step.title}
                      </h3>
                      {step.state === "now" ? (
                        <Badge variant="solid" size="sm">
                          Do this first
                        </Badge>
                      ) : null}
                      {step.state === "soon" ? (
                        <Badge variant="muted" size="sm">
                          <Clock className="size-3" />
                          Opening soon
                        </Badge>
                      ) : null}
                    </div>

                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>

                    {step.state !== "done" ? (
                      <Button
                        asChild
                        variant={step.state === "now" ? "primary" : "outline"}
                        size="sm"
                        className="mt-4"
                      >
                        <Link href={step.href}>
                          {step.cta}
                          <ArrowRight />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {first ? (
          <div className="mt-8 border-t border-border pt-6">
            <Button asChild variant="primary" size="block">
              <Link href={first.href}>
                <Plane className="size-4" />
                {first.cta}
              </Link>
            </Button>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft />}
        >
          Change my answers
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onRestart}>
          Start again
        </Button>
      </div>
    </div>
  );
}
