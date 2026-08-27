@AGENTS.md

# World Portal — working notes

Single-page site for a travel & visa agency, built to a video reference. Read
`README.md` for the full tour; this file is what matters when changing code.

## What the page sells

Three services, each with its own section and its own CTA:

1. **Visas** (`#visas`) — eVisa, Consular, ETA. Sold on comfort and ease.
2. **Flights & Hotels** (`#flights-hotels`) — sold on speed and reliability.
3. **Experiences & Tours** (`#experiences`) — sold on curation and quality.

`#journey` ("How it works") is the one process behind all three. `#contact`
routes on which service the visitor picks. **Packages** and **Testimonials**
are parked — components and content still exist, JSX commented out in
`app/(site)/page.tsx`.

## Non-negotiables

- **Never hardcode colours.** Use semantic tokens (`bg-primary`,
  `text-muted-foreground`, `border-border`) or the `brand-*` / `ink-*` ramps,
  defined once in `src/app/globals.css`. Brand is `#fccc2e` (`--brand-400`).
- **Copy lives in `src/content/landing.ts`**, not in components.
- **Server Components by default.** `"use client"` only where it is needed —
  the header, hero, journey, flights-hotels, FAQ, logo, and the motion
  primitives.
- **One schema per form.** The zod schema in `src/validations` is used by both
  the client form and the API route.
- **`cn()` for every className.**

## The three design signatures

1. **Two-tone headings** — sans lead + serif-italic accent, always via
   `SectionHeading` (`lead` + `accent`), never hand-rolled spans.
2. **Water glass** — `.glass` / `.glass-frost` / `.glass-dark` /
   `.glass-primary` / `.glass-ink`, each paired with `.glass-3d` for the lift,
   press and the specular sweep on hover. Compose these rather than writing new
   `backdrop-filter` rules; the shadow stack is tuned.
3. **Scroll motion** — `ParallaxImage` for any image, `Reveal` for any block of
   content. Reach for a bespoke ScrollTrigger only when a section genuinely
   needs one (journey, flights-hotels, hero).

## Motion safety — read before touching an animation

`useGsap` refuses to build in two cases, and both exist for a reason:

- **`prefers-reduced-motion`.** Every animated component must already render
  correctly in its final state, because the animation may never run.
- **Hidden tab.** Background tabs throttle `requestAnimationFrame` to a stop.
  A `from({ autoAlpha: 0 })` built there paints its hidden state and never
  ticks out of it, leaving a blank section for anyone who opens the page in a
  background tab. Setup is deferred until `visibilitychange`.

If you add a reveal, add it through `Reveal`/`useGsap` so it inherits both.
`e2e/smoke.spec.ts` has a regression test that hero copy is visible.

## Where things go

| Adding…                       | Put it in                               |
| ----------------------------- | --------------------------------------- |
| A generic, reusable primitive | `src/components/ui` + export from index |
| A scroll or reveal behaviour  | `src/components/motion`                 |
| A new page section            | `src/components/sections` + the barrel  |
| Copy or an image reference    | `src/content/landing.ts`                |
| A query or mutation           | `src/features/<feature>/api`            |

## Layout widths

- `Container size="content"` (1200px) — headings, grids, cards.
- `Container size="panel"` (1420px) — the inset rounded panels (Why Us,
  Journey).
- Full bleed, no container — Hero, Contact, Footer, and the marquee rows.

## Before you call it done

```bash
pnpm validate      # typecheck + lint + format:check + unit tests
pnpm test:e2e      # Playwright — needs `pnpm exec playwright install` once
```

Lint runs the React Compiler rules — no `setState` directly in an effect body,
no ref writes during render, and no `form.watch()` (use `useWatch`). Fix the
pattern rather than disabling the rule.

## Gotchas

- **Fraunces** (the wordmark) is loaded variable, with no `weight` — next/font
  rejects `axes` alongside an explicit weight. Weight and the SOFT/WONK axes
  are set in the `.font-logo` utility.
- `lucide-react` v1 dropped brand icons — social marks live in
  `brand-icons.tsx`, service pictograms in `pictograms.tsx`.
- `.glass-3d` sets `overflow: hidden` for the sweep, so never put a popover or
  dropdown inside one.
- `ParallaxImage` always uses `fill`; passing `width`/`height` makes next/image
  size to its intrinsic box inside the absolutely-positioned inner wrapper and
  the tiles come out ragged.
- The oversized DISCOVER wordmarks rely on `leading-[0.8]`, which puts a
  Playfair cap baseline exactly on the line-box bottom edge.
- `next typegen` runs as part of `pnpm typecheck`, so a clean checkout
  typechecks without a build. Next 16 removed `next lint`.
