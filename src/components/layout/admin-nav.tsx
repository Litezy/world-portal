"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNav } from "@/config/admin-navigation";
import { cn } from "@/lib/utils";

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Console">
      <ul className="flex flex-col gap-1">
        {adminNav.map(({ title, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3.5 text-[13.5px] font-medium transition-colors duration-300",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none",
                  active
                    ? "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_18px_-10px_rgba(252,204,46,0.7)]"
                    : "text-white/65 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.9} />
                {title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
