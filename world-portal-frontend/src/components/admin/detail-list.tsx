import { cn } from "@/lib/utils";

export function DetailList({ className, ...props }: React.ComponentProps<"dl">) {
  return <dl className={cn("grid gap-4", className)} {...props} />;
}

export function DetailItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1", className)}>
      <dt className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-[13.5px] text-foreground">{children}</dd>
    </div>
  );
}
