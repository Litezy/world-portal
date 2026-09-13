import { Card, CardTitle } from "@/components/ui/card";
import { agencyPayouts as copy } from "@/content/agency";
import { cn } from "@/lib/utils";

/**
 * Why the money arrives when it does. An agency that understands the run does
 * not email to ask where its payment is, so this sits above the table rather
 * than in a help page nobody opens.
 */
export function SettlementExplainer({ className }: { className?: string }) {
  return (
    <Card
      variant="solid"
      radius="lg"
      padding="none"
      className={cn("gap-0 p-5", className)}
    >
      <CardTitle className="text-base">{copy.howItWorks.title}</CardTitle>

      <ol className="mt-4 flex flex-col gap-3">
        {copy.howItWorks.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11.5px] font-semibold text-primary tabular-nums">
              {index + 1}
            </span>
            <p className="text-[13px] leading-relaxed text-pretty text-muted-foreground">
              {step}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
