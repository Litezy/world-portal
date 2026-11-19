import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Contrast gate for the theme tokens, in the spirit of WorldStreet's
 * Foundations contrast story: every text token is measured against the
 * surfaces it sits on, in both themes, straight from `globals.css`. A colour
 * change that drops below WCAG AA (4.5:1 for body text) fails here instead of
 * shipping an unreadable badge.
 */

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function block(selector: string) {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No ${selector} block in globals.css`);
  const body = css.slice(start, css.indexOf("\n}", start));
  const tokens: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

const root = block(":root");
const dark = block(".dark");
const gold = block('html[data-palette="worldstreet"]');
const goldDark = block('html.dark[data-palette="worldstreet"]');

/** Later blocks win, the way the cascade layers them on <html>. */
const themes = {
  light: root,
  dark: { ...root, ...dark },
  "worldstreet light": { ...root, ...gold },
  "worldstreet dark": { ...root, ...dark, ...gold, ...goldDark },
};

type Rgb = [number, number, number];

function resolve(tokens: Record<string, string>, value: string): string {
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  return ref ? resolve(tokens, tokens[ref[1]]) : value;
}

function toRgb(value: string): Rgb {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (!hex) throw new Error(`Not a solid hex colour: ${value}`);
  return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16) / 255) as Rgb;
}

function colour(tokens: Record<string, string>, name: string): Rgb {
  return toRgb(resolve(tokens, tokens[name]));
}

/** `color-mix(in oklab, var(--x) N%, transparent)` over a surface — blended in sRGB. */
function wash(tokens: Record<string, string>, name: string, surface: Rgb): Rgb {
  const mix = tokens[name].match(
    /color-mix\(in \w+, var\(--([\w-]+)\) (\d+)%, transparent\)/,
  );
  if (!mix) throw new Error(`Unexpected wash definition for --${name}`);
  const fill = colour(tokens, mix[1]);
  const alpha = Number(mix[2]) / 100;
  return fill.map((c, i) => c * alpha + surface[i] * (1 - alpha)) as Rgb;
}

const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = ([r, g, b]: Rgb) =>
  0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

function ratio(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;
const STATUSES = ["success", "warning", "destructive", "info"] as const;

describe.each(Object.entries(themes))("%s theme", (_, tokens) => {
  const card = colour(tokens, "card");
  const background = colour(tokens, "background");

  it.each(["foreground", "muted-foreground"])("--%s reads on page and card", (text) => {
    expect(ratio(colour(tokens, text), background)).toBeGreaterThanOrEqual(AA);
    expect(ratio(colour(tokens, text), card)).toBeGreaterThanOrEqual(AA);
  });

  it("--primary reads as text (links, the active nav icon) on page and card", () => {
    expect(ratio(colour(tokens, "primary"), background)).toBeGreaterThanOrEqual(AA);
    expect(ratio(colour(tokens, "primary"), card)).toBeGreaterThanOrEqual(AA);
  });

  it("text on a primary fill reads (badges, counts)", () => {
    expect(
      ratio(colour(tokens, "primary-foreground"), colour(tokens, "primary")),
    ).toBeGreaterThanOrEqual(AA);
  });

  it("the primary button's text reads on its fill", () => {
    expect(
      ratio(
        colour(tokens, "primary-button-foreground"),
        colour(tokens, "primary-button"),
      ),
    ).toBeGreaterThanOrEqual(AA);
  });

  it.each(STATUSES)("--%s-text reads on the card and on its own wash", (status) => {
    const text = colour(tokens, `${status}-text`);
    expect(ratio(text, card)).toBeGreaterThanOrEqual(AA);
    expect(ratio(text, wash(tokens, `${status}-wash`, card))).toBeGreaterThanOrEqual(
      AA,
    );
  });
});
