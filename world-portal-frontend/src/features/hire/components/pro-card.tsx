"use client";

import { Check, MapPin, Plus, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Professional, professionLabels } from "@/content/professionals";
import { ProAvatar } from "@/features/hire/components/pro-avatar";
import { formatCurrency } from "@/lib/utils";

export function ProCard({
  pro,
  inBasket,
  onOpen,
  onToggle,
}: {
  pro: Professional;
  inBasket: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-card">
      {/* The whole upper block opens the profile; the footer holds its own
          actions, so the button is not nested inside another button.
          The flex column matters too: a <button> vertically centres its own
          contents, so in a stretched card a short profile would float down the
          middle. Giving the button a flex formatting context overrides that. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${pro.name}'s profile`}
        className="flex flex-1 flex-col items-stretch justify-start rounded-t-2xl p-5 text-left transition-colors hover:bg-secondary/40 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        <div className="flex items-start gap-3.5">
          <ProAvatar
            pro={pro}
            className="size-14 rounded-xl"
            textClassName="text-[15px]"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[15px] leading-tight font-semibold text-ink-900">
                {pro.name}
              </h3>
              <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-ink-900">
                <Star className="size-3.5 fill-current text-highlight" />
                {pro.rating}
              </span>
            </div>

            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
              {pro.tagline}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge variant="solid" size="sm">
                {professionLabels[pro.profession]}
              </Badge>
              <Badge variant="muted" size="sm">
                <MapPin className="size-3" />
                {pro.city}
              </Badge>
            </div>

            <p className="mt-2 text-[11.5px] text-muted-foreground">
              {pro.languages.join(" · ")}
            </p>
          </div>
        </div>
      </button>

      <div className="flex items-end justify-between gap-3 border-t border-border p-5">
        <span>
          <span className="block text-[18px] font-semibold text-ink-900">
            {formatCurrency(pro.price)}
          </span>
          <span className="block text-[11.5px] text-muted-foreground">{pro.unit}</span>
        </span>

        <span className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onOpen}>
            Profile
          </Button>
          <Button
            variant={inBasket ? "outline" : "primary"}
            size="sm"
            onClick={onToggle}
            aria-pressed={inBasket}
            leftIcon={inBasket ? <Check /> : <Plus />}
          >
            {inBasket ? "In basket" : "Add"}
          </Button>
        </span>
      </div>
    </article>
  );
}
