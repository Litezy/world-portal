"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Info, Lock, TriangleAlert } from "lucide-react";
import { type Resolver, useForm, useWatch } from "react-hook-form";

import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { agencyListing } from "@/content/agency";
import {
  MissingDocumentsError,
  useAgencyListing,
  useSaveListing,
  useSubmitListing,
} from "@/features/agency/api/use-listing";
import { documentCatalog } from "@/features/agency/catalog";
import { ListingStatusBadge } from "@/features/agency/components/agency-badges";
import { listingFlowCopy } from "@/features/agency/components/listing/copy";
import { DocumentsStep } from "@/features/agency/components/listing/documents-step";
import {
  isListingLocked,
  type ListingFormValues,
  missingProfileFields,
  missingServiceFields,
  outstandingDocuments,
  reachableSteps,
  stepCompletion,
  stepFieldNames,
  stepIds,
  toFormValues,
  toPatch,
} from "@/features/agency/components/listing/form";
import { ListingRail } from "@/features/agency/components/listing/listing-rail";
import { ProfileStep } from "@/features/agency/components/listing/profile-step";
import { ReviewStep } from "@/features/agency/components/listing/review-step";
import type { SaveState } from "@/features/agency/components/listing/save-indicator";
import { ServicesStep } from "@/features/agency/components/listing/services-step";
import type { Agency, AgencyDocumentKind } from "@/features/agency/types";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { type ListingPatchInput, listingPatchSchema } from "@/validations/agency";

/** How long to sit on a keystroke before saving. Long enough not to chatter. */
const AUTOSAVE_DELAY = 1200;

export function ListingFlow() {
  const listing = useAgencyListing();

  if (listing.isPending) {
    return (
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-[32rem] rounded-3xl" />
      </div>
    );
  }

  if (listing.isError || !listing.data) {
    return (
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>{agencyListing.headingLead}</AlertTitle>
        <AlertDescription>
          {listing.error instanceof Error
            ? listing.error.message
            : listingFlowCopy.networkRetry}
        </AlertDescription>
      </Alert>
    );
  }

  // Keyed on the record so a signed-out/signed-in swap rebuilds the form rather
  // than leaving one agency's draft in another's fields.
  return <ListingEditor key={listing.data.id} agency={listing.data} />;
}

function ListingEditor({ agency }: { agency: Agency }) {
  const [step, setStep] = React.useState(0);
  const [incomplete, setIncomplete] = React.useState<string[]>([]);
  const [missing, setMissing] = React.useState<AgencyDocumentKind[]>([]);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [targetKind, setTargetKind] = React.useState<AgencyDocumentKind | null>(null);
  const panel = React.useRef<HTMLDivElement>(null);

  const locked = isListingLocked(agency);
  const save = useSaveListing();
  const submit = useSubmitListing();

  /**
   * The route's own schema, run against the body that would be sent.
   *
   * `listingPatchSchema` validates a patch — every key optional, because a
   * step saves on its own — while the form always holds a value for every
   * field, so the two types diverge and the resolver is cast, as the visa
   * form does. Validating `toPatch(values)` rather than the raw values is
   * deliberate: blanks are stripped on the way out, so an empty optional URL
   * is not reported as an invalid one while the agency has not typed it yet.
   * Presence is the checklist's job, below; format is the schema's.
   */
  const resolver = React.useMemo<Resolver<ListingFormValues>>(() => {
    const validate = zodResolver(listingPatchSchema) as unknown as Resolver<
      ListingFormValues,
      unknown,
      ListingFormValues
    >;

    return async (values, context, options) => {
      const result = await validate(
        toPatch(values) as unknown as ListingFormValues,
        context,
        options,
      );
      if (Object.keys(result.errors).length > 0) {
        return { values: {}, errors: result.errors };
      }
      return { values, errors: {} };
    };
  }, []);

  const form = useForm<ListingFormValues>({
    resolver,
    mode: "onTouched",
    defaultValues: toFormValues(agency),
  });

  // useWatch, never form.watch() — the React Compiler lint forbids the latter.
  const values = useWatch({ control: form.control }) as ListingFormValues;

  const documents = agency.documents ?? [];
  const outstanding = outstandingDocuments(values.categories, documents);
  const submitted =
    agency.listingStatus !== "draft" && agency.listingStatus !== "rejected";
  const completion = stepCompletion(values, documents, submitted);
  const isReachable = reachableSteps(completion, step);

  /* -------------------------------------------------------------------------
   * Autosave — the whole point of the screen being seamless.
   * ---------------------------------------------------------------------- */

  // Seeded with what the server already holds, so arriving on the page does
  // not immediately patch it back unchanged.
  const lastSaved = React.useRef(JSON.stringify(toPatch(toFormValues(agency))));

  const queueSave = useDebouncedCallback(
    (snapshot: string, patch: ListingPatchInput) => {
      lastSaved.current = snapshot;
      save.mutate(patch);
    },
    AUTOSAVE_DELAY,
  );

  React.useEffect(() => {
    if (locked) return;
    const patch = toPatch(values);
    const snapshot = JSON.stringify(patch);
    // Nothing has actually changed — a re-render is not an edit.
    if (snapshot === lastSaved.current) return;
    queueSave(snapshot, patch);
  }, [values, locked, queueSave]);

  const saveState: SaveState = save.isPending
    ? "saving"
    : save.isError
      ? "error"
      : save.isSuccess
        ? "saved"
        : "idle";

  /* ---------------------------------------------------------------------- */

  function scrollToPanel() {
    panel.current?.scrollIntoView({ block: "start", behavior: motionBehaviour() });
  }

  function goTo(index: number) {
    setIncomplete([]);
    setStep(index);
    scrollToPanel();
  }

  /** What this step is still waiting for, by the label the agency sees. */
  function outstandingFor(id: (typeof stepIds)[number]): string[] {
    if (id === "profile") return missingProfileFields(values);
    if (id === "services") return missingServiceFields(values);
    if (id === "documents") {
      return outstanding.map((kind) => documentCatalog[kind].label);
    }
    return [];
  }

  async function goNext() {
    const id = stepIds[step];
    // Only this step's fields: a half-written offering on step 2 must not
    // silently block Continue on step 1.
    const fields = stepFieldNames[id] as (keyof ListingFormValues)[];
    const valid =
      fields.length === 0 || (await form.trigger(fields, { shouldFocus: true }));
    const gaps = outstandingFor(id);

    if (!valid || gaps.length > 0) {
      setIncomplete(gaps);
      return;
    }

    goTo(Math.min(step + 1, stepIds.length - 1));
  }

  function focusDocument(kind: AgencyDocumentKind) {
    setTargetKind(kind);
    setStep(stepIds.indexOf("documents"));
    // The row only exists after the step renders, so wait a frame for it.
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        window.document
          .getElementById(`document-${kind}`)
          ?.scrollIntoView({ block: "center", behavior: motionBehaviour() }),
      ),
    );
  }

  async function handleSubmit() {
    setMissing([]);
    setSubmitError(null);
    try {
      // Flush whatever the debounce is still holding, so the reviewer reads
      // the same listing the agency is looking at.
      await save.mutateAsync(toPatch(form.getValues()));
      await submit.mutateAsync();
      toast.success(agencyListing.review.submitted);
    } catch (error) {
      if (error instanceof MissingDocumentsError) {
        setMissing(error.missing);
        setSubmitError(error.message);
        return;
      }
      setSubmitError(
        error instanceof Error ? error.message : listingFlowCopy.networkRetry,
      );
    }
  }

  const current = stepIds[step];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        lead={agencyListing.headingLead}
        accent={agencyListing.headingAccent}
        body={agencyListing.body}
        actions={<ListingStatusBadge status={agency.listingStatus} />}
      />

      {locked ? (
        <Alert variant={agency.listingStatus === "live" ? "success" : "info"}>
          <Lock />
          <AlertTitle>
            {agency.listingStatus === "live"
              ? listingFlowCopy.liveTitle
              : listingFlowCopy.readOnlyTitle}
          </AlertTitle>
          <AlertDescription>
            {agency.listingStatus === "live"
              ? listingFlowCopy.liveBody
              : listingFlowCopy.readOnlyBody}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <ListingRail
          current={step}
          completion={completion}
          isReachable={isReachable}
          onSelect={goTo}
          outstanding={outstanding.length}
          saveState={saveState}
        />

        <Card
          ref={panel}
          variant="solid"
          radius="2xl"
          padding="none"
          className="scroll-mt-24 p-6 sm:p-8"
        >
          <Form {...form}>
            <form
              onSubmit={(event) => event.preventDefault()}
              className="grid gap-6"
              noValidate
            >
              <header>
                <h2 className="text-xl font-semibold tracking-tight text-ink-900">
                  {agencyListing.steps[step].title}
                </h2>
                <p className="mt-1 text-[13.5px] text-muted-foreground">
                  {agencyListing.steps[step].body}
                </p>
              </header>

              {/* One switch for read-only: a disabled fieldset disables every
                  control inside it, including the country picker's button. */}
              <fieldset disabled={locked} className="contents">
                {current === "profile" ? (
                  <ProfileStep form={form} disabled={locked} />
                ) : null}

                {current === "services" ? (
                  <ServicesStep form={form} disabled={locked} />
                ) : null}

                {current === "documents" ? (
                  <DocumentsStep
                    categories={values.categories}
                    documents={documents}
                    disabled={locked}
                    targetKind={targetKind}
                  />
                ) : null}

                {current === "review" ? (
                  <ReviewStep
                    values={values}
                    documents={documents}
                    submitted={submitted}
                    missing={missing}
                    isSubmitting={submit.isPending || save.isPending}
                    error={submitError}
                    onEdit={(id) => goTo(stepIds.indexOf(id))}
                    onFixDocument={focusDocument}
                    onSubmit={handleSubmit}
                  />
                ) : null}
              </fieldset>

              {incomplete.length > 0 ? (
                <Alert variant="warning">
                  <Info />
                  <AlertTitle>{listingFlowCopy.incompleteTitle}</AlertTitle>
                  <AlertDescription>
                    {current === "documents"
                      ? agencyListing.documents.blocked
                      : listingFlowCopy.incompleteBody}
                    <ul className="mt-1 list-disc pl-4">
                      {incomplete.map((label) => (
                        <li key={label}>{label}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              {current !== "review" ? (
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    disabled={step === 0}
                    onClick={() => goTo(Math.max(step - 1, 0))}
                  >
                    <ArrowLeft className="size-4" />
                    {listingFlowCopy.back}
                  </Button>

                  <Button type="button" variant="primary" size="md" onClick={goNext}>
                    {listingFlowCopy.continue}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex items-center border-t border-border pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => goTo(Math.max(step - 1, 0))}
                  >
                    <ArrowLeft className="size-4" />
                    {listingFlowCopy.back}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}

/** Honour the OS setting: nobody asked the page to fly around. */
function motionBehaviour(): ScrollBehavior {
  if (typeof window === "undefined") return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}
