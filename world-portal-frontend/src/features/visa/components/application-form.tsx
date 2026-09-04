"use client";

import * as React from "react";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Copy } from "lucide-react";
import { type Resolver, useForm, type UseFormReturn } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
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
import { toast } from "@/components/ui/toaster";
import { useSubmitVisaApplication } from "@/features/visa/api/visa-documentation";
import { DocumentField } from "@/features/visa/components/document-field";
import { RouteCheck } from "@/features/visa/components/route-check";
import { routeToApiNote, type VisaVerdict } from "@/features/visa/requirement";
import { GENDERS, VISA_CATEGORIES } from "@/features/visa/types";
import { ApiError, internalApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  applicationSteps,
  offlineVisaApplicationSchema,
  toApiPayload,
  type VisaApplicationInput,
  visaApplicationSchema,
} from "@/validations/visa-application";

const categoryLabels: Record<(typeof VISA_CATEGORIES)[number], string> = {
  TOURIST: "Tourism / visiting",
  BUSINESS: "Business",
  STUDENT: "Study",
  WORK: "Work",
  TRANSIT: "Transit",
};

const genderLabels: Record<(typeof GENDERS)[number], string> = {
  MALE: "Male",
  FEMALE: "Female",
};

export function ApplicationForm() {
  const [step, setStep] = React.useState(0);
  const [reference, setReference] = React.useState<string | null>(null);
  /** Set by the route check; decides which schema and which steps apply. */
  const [verdict, setVerdict] = React.useState<VisaVerdict | null>(null);

  const online = verdict?.online ?? true;
  // A T.Visa is filed in person, so the document step is dropped entirely
  // rather than shown and skipped — there is nothing useful to upload yet.
  const steps = React.useMemo(
    () => (online ? applicationSteps : applicationSteps.slice(0, 3)),
    [online],
  );

  const form = useForm<VisaApplicationInput>({
    // Both schemas cover the same fields; only the document uploads change from
    // required to optional, so the form's value type is identical either way.
    // The cast is needed because zod infers two distinct output types.
    resolver: zodResolver(
      online ? visaApplicationSchema : offlineVisaApplicationSchema,
    ) as Resolver<VisaApplicationInput>,
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      nationality: "",
      residenceAddress: "",
      passportNumber: "",
      passportIssueDate: "",
      passportExpiryDate: "",
      passportIssuingAuthority: "",
      targetCountry: "",
      visaCategory: "TOURIST",
      intendedArrivalDate: "",
      intendedDepartureDate: "",
      purposeOfVisit: "",
      passportDataPageUrl: "",
      passportPhotoWhiteBgUrl: "",
      proofOfFunds6MonthsUrl: "",
      businessRegistrationCertUrl: "",
      taxCertificateUrl: "",
      marriageCertificateUrl: "",
    },
  });

  const { mutateAsync, isPending } = useSubmitVisaApplication();
  const isLast = step === steps.length - 1;

  const [isEmailVerified, setIsEmailVerified] = React.useState(false);

  /** Only advance once this step's own fields are clean and email is verified. */
  async function next() {
    if (step === 0 && !isEmailVerified) {
      toast.error("Please verify your email address with OTP before continuing.");
      return;
    }
    const fields = steps[step].fields as (keyof VisaApplicationInput)[];
    const ok = await form.trigger(fields, { shouldFocus: true });
    if (ok) setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  async function onSubmit(values: VisaApplicationInput) {
    if (!isEmailVerified) {
      toast.error("Please verify your email address with OTP before submitting.");
      setStep(0);
      return;
    }
    try {
      const record = await mutateAsync(
        toApiPayload({
          ...values,
          // Tell the consultant which route this came through; the API has no
          // field for it, so it rides along in the free-text purpose.
          purposeOfVisit: verdict
            ? [values.purposeOfVisit, `[${routeToApiNote[verdict.route]}]`]
                .filter(Boolean)
                .join(" ")
            : values.purposeOfVisit,
        }),
      );
      setReference(record.applicationNo);
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        // Map the API's per-field messages back onto the inputs, then jump to
        // the earliest step that actually has a problem.
        let earliest = steps.length - 1;
        for (const [field, messages] of Object.entries(error.errors)) {
          form.setError(field as keyof VisaApplicationInput, { message: messages[0] });
          const owner = steps.findIndex((s) =>
            (s.fields as readonly string[]).includes(field),
          );
          if (owner >= 0) earliest = Math.min(earliest, owner);
        }
        setStep(earliest);
        toast.error("Please check the highlighted fields");
        return;
      }
      toast.error("Could not submit your application", {
        description:
          error instanceof Error ? error.message : "Please try again shortly.",
      });
    }
  }

  if (reference) {
    return <SubmittedPanel reference={reference} verdict={verdict} />;
  }

  // Nothing can be filled in until we know which of the three routes applies.
  if (!verdict) {
    return (
      <RouteCheck
        onConfirm={(v) => {
          setVerdict(v);
          form.setValue("targetCountry", v.destination?.name ?? "");
          setStep(0);
        }}
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
      <Stepper current={step} steps={steps} onSelect={setStep} />

      <Card variant="glass" radius="2xl" padding="none" className="p-6 sm:p-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-6"
            noValidate
          >
            <header>
              <h2 className="text-xl font-semibold tracking-tight text-ink-900">
                {applicationSteps[step].title}
              </h2>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
                {applicationSteps[step].description}
              </p>
            </header>

            {step === 0 ? (
              <ApplicantStep
                form={form}
                isEmailVerified={isEmailVerified}
                setIsEmailVerified={setIsEmailVerified}
              />
            ) : null}
            {step === 1 ? <PassportStep form={form} /> : null}
            {step === 2 ? <TripStep form={form} /> : null}
            {step === 3 ? <DocumentsStep form={form} /> : null}

            <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-6">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setStep((s) => Math.max(s - 1, 0))}
                disabled={step === 0}
                leftIcon={<ArrowLeft />}
              >
                Back
              </Button>

              {isLast ? (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isPending}
                  loadingText="Submitting…"
                >
                  {online ? "Submit application" : "Send my details"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={next}
                  rightIcon={<ArrowRight />}
                >
                  Continue
                </Button>
              )}
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}

function Stepper({
  current,
  steps,
  onSelect,
}: {
  current: number;
  steps: typeof applicationSteps | (typeof applicationSteps)[number][];
  onSelect: (index: number) => void;
}) {
  return (
    <ol className="flex gap-2 overflow-x-auto lg:sticky lg:top-28 lg:h-fit lg:flex-col lg:gap-1 lg:overflow-visible">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.id} className="shrink-0">
            <button
              type="button"
              // Going back is always safe; going forward has to pass validation.
              onClick={() => i < current && onSelect(i)}
              disabled={i > current}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                active && "bg-primary/18",
                done && "cursor-pointer hover:bg-secondary",
                i > current && "cursor-default opacity-45",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                  active && "bg-primary text-primary-foreground",
                  done && "bg-success text-success-foreground",
                  !active && !done && "bg-secondary text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[13px] font-medium whitespace-nowrap",
                  active ? "text-ink-900" : "text-muted-foreground",
                )}
              >
                {s.title}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

type StepProps = { form: UseFormReturn<VisaApplicationInput> };

function Text({
  form,
  name,
  label,
  placeholder,
  type = "text",
  required,
  autoComplete,
}: StepProps & {
  name: keyof VisaApplicationInput;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              {...field}
              value={typeof field.value === "string" ? field.value : ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ApplicantStep({
  form,
  isEmailVerified,
  setIsEmailVerified,
}: StepProps & {
  isEmailVerified: boolean;
  setIsEmailVerified: (verified: boolean) => void;
}) {
  const emailValue = form.watch("email");
  const [verifiedEmail, setVerifiedEmail] = React.useState<string | null>(null);
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);

  React.useEffect(() => {
    if (isEmailVerified && emailValue !== verifiedEmail) {
      setIsEmailVerified(false);
    }
  }, [emailValue, isEmailVerified, verifiedEmail, setIsEmailVerified]);

  const handleSendOtp = async () => {
    if (!emailValue || !emailValue.includes("@")) {
      toast.error("Please enter a valid email address first.");
      return;
    }
    setSendingOtp(true);
    try {
      await internalApi.post<any>("/otp/send", { email: emailValue });
      toast.success(`Verification code sent to ${emailValue}`);
      setOtpSent(true);
    } catch (err: any) {
      toast.error(err?.message || "Could not send OTP code.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter the 6-digit OTP code.");
      return;
    }
    setVerifyingOtp(true);
    try {
      await internalApi.post<any>("/otp/verify", { email: emailValue, code: otpCode });
      toast.success("Email verified successfully!");
      setVerifiedEmail(emailValue);
      setIsEmailVerified(true);
    } catch (err: any) {
      toast.error(err?.message || "Invalid or expired OTP code.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Text
        form={form}
        name="firstName"
        label="First name"
        required
        placeholder="John"
        autoComplete="given-name"
      />
      <Text
        form={form}
        name="lastName"
        label="Last name"
        required
        placeholder="Doe"
        autoComplete="family-name"
      />
      <div className="space-y-2 sm:col-span-2">
        <Text
          form={form}
          name="email"
          label="Email address"
          required
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
        />

        <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 mt-2">
          {isEmailVerified ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
              <Check className="size-4" strokeWidth={3} />
              <span>Email Verified ({emailValue})</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Verify ownership of your email address
                </span>
                {!otpSent ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendOtp}
                    isLoading={sendingOtp}
                    disabled={!emailValue || !emailValue.includes("@")}
                    className="h-8 text-xs shrink-0"
                  >
                    Send OTP Code
                  </Button>
                ) : null}
              </div>

              {otpSent ? (
                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="h-9 font-mono tracking-widest text-center max-w-[140px]"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleVerifyOtp}
                      isLoading={verifyingOtp}
                      disabled={otpCode.length !== 6}
                      className="h-9 text-xs"
                    >
                      Verify OTP
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSendOtp}
                      isLoading={sendingOtp}
                      className="h-9 text-xs text-muted-foreground"
                    >
                      Resend
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <Text
        form={form}
        name="phone"
        label="Phone"
        type="tel"
        placeholder="+234 801 234 5678"
        autoComplete="tel"
      />
      <Text form={form} name="dateOfBirth" label="Date of birth" type="date" />
      <FormField
        control={form.control}
        name="gender"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gender</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || undefined}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {genderLabels[g]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <Text
        form={form}
        name="nationality"
        label="Nationality"
        required
        placeholder="Nigerian"
      />
      <div className="sm:col-span-2">
        <Text
          form={form}
          name="residenceAddress"
          label="Residential address"
          placeholder="123 Example Street, Lagos"
          autoComplete="street-address"
        />
      </div>
    </div>
  );
}

function PassportStep({ form }: StepProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Text
        form={form}
        name="passportNumber"
        label="Passport number"
        placeholder="A12345678"
      />
      <Text
        form={form}
        name="passportIssuingAuthority"
        label="Issuing authority"
        placeholder="Nigeria Immigration Service"
      />
      <Text form={form} name="passportIssueDate" label="Issue date" type="date" />
      <Text form={form} name="passportExpiryDate" label="Expiry date" type="date" />
    </div>
  );
}

function TripStep({ form }: StepProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Text
        form={form}
        name="targetCountry"
        label="Destination country"
        required
        placeholder="Canada"
      />
      <FormField
        control={form.control}
        name="visaCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Visa category</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {VISA_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {categoryLabels[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <Text
        form={form}
        name="intendedArrivalDate"
        label="Intended arrival"
        type="date"
      />
      <Text
        form={form}
        name="intendedDepartureDate"
        label="Intended departure"
        type="date"
      />
      <div className="sm:col-span-2">
        <FormField
          control={form.control}
          name="purposeOfVisit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose of visit</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Annual vacation, conference, family visit…"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function DocumentsStep({ form }: StepProps) {
  const errors = form.formState.errors;

  const slot = (
    name: keyof VisaApplicationInput,
    label: string,
    hint: string,
    required = false,
  ) => (
    <DocumentField
      key={name}
      label={label}
      hint={hint}
      required={required}
      value={(form.watch(name) as string) ?? ""}
      onChange={(url) =>
        form.setValue(name, url, { shouldValidate: true, shouldDirty: true })
      }
      error={errors[name]?.message as string | undefined}
    />
  );

  return (
    <div className="grid gap-5">
      {slot(
        "passportDataPageUrl",
        "Passport data page",
        "A clear scan of the photo page.",
        true,
      )}
      {slot(
        "passportPhotoWhiteBgUrl",
        "Passport photograph",
        "Recent, white background.",
        true,
      )}
      {slot(
        "proofOfFunds6MonthsUrl",
        "Proof of funds",
        "Six months of bank statements.",
      )}
      {slot(
        "businessRegistrationCertUrl",
        "Business registration",
        "If you are self-employed or a business owner.",
      )}
      {slot(
        "taxCertificateUrl",
        "Tax certificate",
        "Optional, but it strengthens most applications.",
      )}
      {slot(
        "marriageCertificateUrl",
        "Marriage certificate",
        "Only if travelling with a spouse.",
      )}
    </div>
  );
}

function SubmittedPanel({
  reference,
  verdict,
}: {
  reference: string;
  verdict: VisaVerdict | null;
}) {
  const [copied, setCopied] = React.useState(false);
  const embassy = verdict ? !verdict.online : false;

  return (
    <Card
      variant="glass"
      radius="2xl"
      padding="none"
      className="mx-auto max-w-xl p-8 text-center sm:p-10"
    >
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/15 text-success">
        <Check className="size-7" strokeWidth={2.5} />
      </span>

      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-ink-900">
        {embassy ? "We have your details" : "Application submitted"}
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
        {embassy
          ? "A consultant will call you within one working day to confirm what to bring, prepare your file, and book your embassy appointment. Keep this reference."
          : "A consultant is reviewing your file now. Keep this reference — it is how you check progress, and you will not need an account."}
      </p>

      {embassy && verdict ? (
        <ol className="mt-6 grid gap-2.5 text-left">
          {verdict.next.map((step, i) => (
            <li key={step} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-ink-800">
                {i + 1}
              </span>
              <span className="text-[13px] leading-relaxed text-ink-800">{step}</span>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mt-7 flex items-center justify-between gap-4 rounded-xl border border-primary/40 bg-primary/12 px-4 py-3.5">
        <span className="text-left">
          <span className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Your reference
          </span>
          <span className="font-mono text-[17px] font-semibold text-ink-900">
            {reference}
          </span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={copied ? <Check /> : <Copy />}
          onClick={() => {
            void navigator.clipboard?.writeText(reference);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="primary" size="md">
          <Link href={`/track?ref=${encodeURIComponent(reference)}`}>
            Track this application
          </Link>
        </Button>
        <Button asChild variant="outline" size="md">
          <Link href="/">Back to home</Link>
        </Button>
      </div>

      <Badge variant="muted" size="sm" className="mx-auto mt-6">
        We have emailed a copy of this reference to you
      </Badge>
    </Card>
  );
}
