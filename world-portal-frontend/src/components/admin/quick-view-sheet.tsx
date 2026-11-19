"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/**
 * Preview a row without leaving the list: a panel from the right on desktop.
 * The list keeps its filters and scroll position, and the full record is one
 * link away in `footer`.
 */
export function QuickViewSheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className={cn(
          "w-full bg-background text-foreground sm:max-w-md data-[vaul-drawer-direction=right]:sm:max-w-md",
          className,
        )}
      >
        <DrawerHeader className="border-b border-border/60 text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? (
          <DrawerFooter className="border-t border-border/60">{footer}</DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
