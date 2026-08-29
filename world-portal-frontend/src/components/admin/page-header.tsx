import {
  SectionHeading,
  type SectionHeadingProps,
} from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

type Props = Pick<SectionHeadingProps, "eyebrow" | "lead" | "accent" | "body"> & {
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ actions, className, ...heading }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <SectionHeading
        as="h1"
        size="xs"
        {...heading}
        className="[&_p]:mt-2 [&_p]:text-sm"
      />
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
