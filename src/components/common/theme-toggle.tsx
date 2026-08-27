"use client";

import { useTheme } from "next-themes";

import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMounted } from "@/hooks/use-mounted";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const mounted = useMounted();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          {/* Both icons render; CSS picks one, so there is nothing to hydrate. */}
          <Sun className="size-5 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-5 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {(["light", "dark", "system"] as const).map((value) => {
          const Icon = value === "light" ? Sun : value === "dark" ? Moon : Monitor;
          return (
            <DropdownMenuItem
              key={value}
              onSelect={() => setTheme(value)}
              className="capitalize"
              data-active={mounted && theme === value}
            >
              <Icon />
              {value}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
