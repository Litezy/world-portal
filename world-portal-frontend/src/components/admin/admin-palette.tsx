"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { Monitor, Moon, Palette, Sun } from "lucide-react";

import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type AdminPalette,
  adminPaletteCookie,
  adminPaletteScript,
  parseAdminPalette,
} from "@/config/admin-palette";
import { appearance as copy } from "@/content/admin";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

type PaletteState = { palette: AdminPalette; setPalette: (next: AdminPalette) => void };

const PaletteContext = React.createContext<PaletteState | null>(null);

/**
 * Holds the admin's colour choice and keeps `data-palette` on <html> in step
 * with it. It has to be <html>, not a wrapper: the semantic tokens are
 * resolved there, and dialogs, menus and toasts portal out to <body>.
 * Leaving the admin (the site has no palette) takes the attribute away.
 */
export function AdminPaletteProvider({
  initial,
  children,
}: {
  initial: AdminPalette;
  children: React.ReactNode;
}) {
  const [palette, setPaletteState] = React.useState(initial);

  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.palette = palette;
    return () => {
      delete root.dataset.palette;
    };
  }, [palette]);

  const setPalette = React.useCallback((next: AdminPalette) => {
    const value = parseAdminPalette(next);
    document.cookie = adminPaletteCookie(value);
    setPaletteState(value);
  }, []);

  const state = React.useMemo(() => ({ palette, setPalette }), [palette, setPalette]);

  return (
    <PaletteContext.Provider value={state}>
      {/* First paint: set before the browser draws, so gold never flashes blue. */}
      <script dangerouslySetInnerHTML={{ __html: adminPaletteScript(initial) }} />
      {children}
    </PaletteContext.Provider>
  );
}

export function useAdminPalette() {
  const state = React.useContext(PaletteContext);
  if (!state) throw new Error("useAdminPalette needs an AdminPaletteProvider");
  return state;
}

/**
 * The logo as the admin wears it: the swoosh follows the colour choice (gold
 * under WorldStreet gold), and the type follows light / dark.
 */
export function AdminLogo({
  href = "/admin",
  markClassName = "h-7 sm:h-7",
}: {
  href?: string;
  markClassName?: string;
}) {
  const gold = useAdminPalette().palette === "worldstreet";
  return (
    <>
      <Logo
        href={href}
        tone="dark"
        gold={gold}
        className="dark:hidden"
        markClassName={markClassName}
      />
      <Logo
        href={href}
        tone="light"
        gold={gold}
        className="hidden dark:inline-flex"
        markClassName={markClassName}
      />
    </>
  );
}

/** Each choice's own colours, whichever is active (tokens in globals.css). */
const SWATCH: Record<AdminPalette, string> = {
  embassy: "bg-(image:--swatch-embassy)",
  worldstreet: "bg-(image:--swatch-worldstreet)",
};

/**
 * Colours (E-Embassy blue / WorldStreet gold) and mode (light / dark /
 * system) in one menu. `compact` is the icon-only trigger for tight bars.
 */
export function AppearanceMenu({
  compact = false,
  align = "start",
  className,
}: {
  compact?: boolean;
  align?: "start" | "end";
  className?: string;
}) {
  const { palette, setPalette } = useAdminPalette();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const mode = mounted ? (theme ?? "system") : "system";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon-sm" : "sm"}
          aria-label={copy.label}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            !compact && "w-full justify-start gap-2.5 px-3",
            className,
          )}
        >
          <span
            aria-hidden
            className={cn(
              "size-4 shrink-0 rounded-full ring-1 ring-border",
              SWATCH[palette],
            )}
          />
          {compact ? null : (
            <>
              <span className="flex-1 text-left text-[13px] font-medium">
                {copy.palettes[palette]}
              </span>
              <Palette className="size-4 opacity-60" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-60">
        <DropdownMenuLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {copy.colours}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={palette}
          onValueChange={(value) => setPalette(parseAdminPalette(value))}
        >
          {(Object.keys(copy.palettes) as AdminPalette[]).map((option) => (
            <DropdownMenuRadioItem key={option} value={option} className="gap-2.5">
              <span
                aria-hidden
                className={cn("size-4 rounded-full ring-1 ring-border", SWATCH[option])}
              />
              {copy.palettes[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {copy.mode}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light" className="gap-2.5">
            <Sun className="size-4" />
            {copy.modes.light}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="gap-2.5">
            <Moon className="size-4" />
            {copy.modes.dark}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="gap-2.5">
            <Monitor className="size-4" />
            {copy.modes.system}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
