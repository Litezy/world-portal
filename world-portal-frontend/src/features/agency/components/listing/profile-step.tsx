"use client";

import { type UseFormReturn, useWatch } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { agencyListing } from "@/content/agency";
import { ChipsInput } from "@/features/agency/components/listing/chips-input";
import {
  countryFieldsFor,
  type ListingFormValues,
} from "@/features/agency/components/listing/form";
import { CountrySelect } from "@/features/trip/components/country-select";

const copy = agencyListing.profile;

/** Offered under the languages field — the ones agencies list most. */
const commonLanguages = [
  "English",
  "French",
  "Arabic",
  "Spanish",
  "Portuguese",
  "Swahili",
] as const;

export function ProfileStep({
  form,
  disabled,
}: {
  form: UseFormReturn<ListingFormValues>;
  disabled: boolean;
}) {
  // useWatch, never form.watch() — the React Compiler lint forbids the latter.
  const countryCode = useWatch({ control: form.control, name: "countryCode" });

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{copy.name}</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} autoComplete="organization" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="legalName"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{copy.legalName}</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{copy.registrationNumber}</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          {/* CountrySelect carries its own label and search — people type
              "Turkey", and src/lib/countries.ts knows that means Türkiye. */}
          <CountrySelect
            label={copy.country}
            value={countryCode}
            onChange={(code) => {
              const next = countryFieldsFor(code);
              form.setValue("countryCode", next.countryCode, { shouldDirty: true });
              form.setValue("country", next.country, { shouldDirty: true });
            }}
          />
        </FormItem>
      </div>

      <FormField
        control={form.control}
        name="cities"
        render={({ field }) => (
          <FormItem>
            <ChipsInput
              required
              label={copy.cities}
              hint={copy.citiesHint}
              placeholder="Lagos"
              values={field.value}
              onChange={field.onChange}
              disabled={disabled}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="summary"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>{copy.summary}</FormLabel>
            <FormControl>
              <Input {...field} disabled={disabled} maxLength={140} />
            </FormControl>
            <FormDescription>{copy.summaryHint}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="about"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>{copy.about}</FormLabel>
            <FormControl>
              <Textarea {...field} rows={5} disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="yearFounded"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{copy.yearFounded}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={new Date().getFullYear()}
                  disabled={disabled}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? ""}
                  // Empty means unset, not zero — an optional number takes
                  // undefined, and 0 would read as the year nothing.
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === ""
                        ? undefined
                        : event.target.valueAsNumber,
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
          name="staffCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{copy.staffCount}</FormLabel>
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
                      event.target.value === ""
                        ? undefined
                        : event.target.valueAsNumber,
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="languages"
        render={({ field }) => (
          <FormItem>
            <ChipsInput
              required
              label={copy.languages}
              placeholder="English"
              values={field.value}
              onChange={field.onChange}
              disabled={disabled}
              suggestions={commonLanguages}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{copy.email}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  disabled={disabled}
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{copy.phone}</FormLabel>
              <FormControl>
                <Input {...field} type="tel" disabled={disabled} autoComplete="tel" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="website"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{copy.website}</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="url"
                inputMode="url"
                placeholder="https://"
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
