"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string } = {}) {
  const { setTheme, theme } = useTheme();
  const mounted = useMounted();

  const currentTheme = mounted ? theme : "system";

  const handleToggle = () => {
    if (currentTheme === "light") setTheme("dark");
    else if (currentTheme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      aria-label="Toggle theme"
      className={cn(
        "gap-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
    >
      {currentTheme === "light" && (
        <>
          <Sun className="size-4 text-amber-500" />
          <span>Light</span>
        </>
      )}
      {currentTheme === "dark" && (
        <>
          <Moon className="size-4 text-purple-400" />
          <span>Dark</span>
        </>
      )}
      {currentTheme === "system" && (
        <>
          <Monitor className="size-4 text-cyan-500" />
          <span>System</span>
        </>
      )}
    </Button>
  );
}
