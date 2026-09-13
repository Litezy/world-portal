"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useFieldArray, type UseFormReturn, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { agencyListing } from "@/content/agency";
import {
  allCategories,
  categoryCatalog,
  documentsForCategories,
} from "@/features/agency/catalog";
import {
  currencyOptions,
  listingFlowCopy,
  unitOptions,
} from "@/features/agency/components/listing/copy";
import {
  type ListingFormValues,
  newOffering,
} from "@/features/agency/components/listing/form";
import type { AgencyCategory } from "@/features/agency/types";
import { cn } from "@/lib/utils";

const copy = agencyListing.services;

export function ServicesStep({
  form,
  disabled,
}: {
  form: UseFormReturn<ListingFormValues>;
  disabled: boolean;
}) {
  const categories = useWatch({ control: form.control, name: "categories" });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "offerings",
  });

  /**
   * Toggling reads the live value out of the form's ref rather than a value
   * captured during render — the functional-setState rule in the same clothes.
   * Two clicks inside one React batch otherwise both read the same stale array
   * and the second discards the first.
   */
  function toggleCategory(category: AgencyCategory) {
    const current = form.getValues("categories");
    const next = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    form.setValue("categories", next, { shouldDirty: true, shouldValidate: true });
  }

  const documentCount = documentsForCategories(categories).length;

  return (
    <div className="grid gap-10">
      <section className="grid gap-4">
        <header className="grid gap-1">
          <h3 className="text-[15px] font-semibold tracking-tight text-ink-900">
            {copy.title}
          </h3>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {copy.body}
          </p>
        </header>

        <ul className="grid gap-3 sm:grid-cols-2">
          {allCategories.map((category) => {
            const entry = categoryCatalog[category];
            const Icon = entry.icon;
            const selected = categories.includes(category);

            return (
              <li key={category}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    "flex h-full w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                    "focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:outline-none",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    selected
                      ? "border-primary/60 bg-primary/12"
                      : "border-border/70 bg-card hover:bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {selected ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-ink-900">
                      {entry.label}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
                      {entry.blurb}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* The point of the picker, said out loud: this choice writes step 3. */}
        <p
          aria-live="polite"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-3 text-[12.5px] text-muted-foreground"
        >
          <span className="font-semibold text-ink-900">
            {listingFlowCopy.categorySelected(categories.length)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{listingFlowCopy.documentsFor(documentCount)}</span>
          <span aria-hidden="true">·</span>
          <span>{listingFlowCopy.categoryDrives}</span>
        </p>

        <FormField
          control={form.control}
          name="categories"
          render={() => (
            <FormItem className="gap-0">
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <section className="grid gap-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <h3 className="text-[15px] font-semibold tracking-tight text-ink-900">
              {copy.offeringsTitle}
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {copy.offeringsBody}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || categories.length === 0}
            onClick={() => append(newOffering(categories[0]))}
          >
            <Plus className="size-4" />
            {copy.addOffering}
          </Button>
        </header>

        {fields.length === 0 ? (
          <EmptyState title={copy.empty} />
        ) : (
          <ul className="grid gap-4">
            {fields.map((field, index) => (
              <li key={field.id}>
                <OfferingRow
                  form={form}
                  index={index}
                  categories={categories}
                  disabled={disabled}
                  onRemove={() => remove(index)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function OfferingRow({
  form,
  index,
  categories,
  disabled,
  onRemove,
}: {
  form: UseFormReturn<ListingFormValues>;
  index: number;
  categories: AgencyCategory[];
  disabled: boolean;
  onRemove: () => void;
}) {
  const price = useWatch({ control: form.control, name: `offerings.${index}.price` });
  // A category can be unpicked after an offering was written against it; keep
  // the stale one in the list so the row still shows what it is.
  const category = useWatch({
    control: form.control,
    name: `offerings.${index}.category`,
  });
  const options = Array.from(new Set<AgencyCategory>([...categories, category]));

  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-5 p-5">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
        <FormField
          control={form.control}
          name={`offerings.${index}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{copy.fields.title}</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} placeholder="Airport transfer" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`offerings.${index}.category`}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{listingFlowCopy.offeringCategory}</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {categoryCatalog[option].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`offerings.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{copy.fields.description}</FormLabel>
            <FormControl>
              <Textarea {...field} rows={2} disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <FormField
          control={form.control}
          name={`offerings.${index}.price`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.fields.price}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  disabled={disabled}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? ""}
                  // Blank is not zero: it is "quoted after review", which the
                  // basket and the review step both read as null.
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === "" ? null : event.target.valueAsNumber,
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`offerings.${index}.currency`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.fields.currency}</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled || price === null}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`offerings.${index}.unit`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.fields.unit}</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {unitOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`offerings.${index}.leadTimeHours`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.fields.leadTime}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  disabled={disabled}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === "" ? 0 : event.target.valueAsNumber,
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`offerings.${index}.capacity`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.fields.capacity}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  disabled={disabled}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === "" ? 1 : event.target.valueAsNumber,
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-[12px] text-muted-foreground">
          {price === null ? copy.quotedLabel : null}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
          {copy.removeOffering}
        </Button>
      </div>
    </Card>
  );
}
