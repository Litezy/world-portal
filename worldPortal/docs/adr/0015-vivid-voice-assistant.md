# ADR 0015: Vivid Voice Assistant on E-Embassy

* **Status:** Approved (by the product owner in chat, 2026-09-23)
* **Date:** 2026-09-23
* **Author(s):** AI Agent & Development Team

---

## 1. Context & Problem Statement
Vivid is WorldStreet's voice assistant. E-Embassy should offer it as an application assistant: working out which visa a trip needs, filling the visa and passport applications by voice, submitting when the applicant says so, and following applications afterwards. HANDOFF.md §4.1 listed this as undefined work with no vendor chosen.

WorldStreet already runs Vivid through **Sira** (`sira.vividintelligence.tech`), a session broker in front of a realtime voice model, and documents how a child service adds it (`Worldstreet/docs/VIVID-VOICE-ON-XTREME.md`; Xtreme is the reference copy).

## 2. Decision Drivers
* **Same Vivid everywhere** — identity, persona rules and plumbing identical to the hub and Xtreme; no vendor name reachable from the browser.
* **Free for now, paywall-ready** — product owner: free on E-Embassy today, but built so WorldStreet's Vivid subscription can be enforced later.
* **Submit only on a spoken yes** — product owner: Vivid may submit, after reading back a summary and hearing an explicit yes.
* **Depends on ADR 0014** — sessions and server tools require the WorldStreet (Clerk) session.

## 3. Considered Options
* **Option 1 (Chosen):** Copy the Sira plumbing from Xtreme (mint route, WebSocket provider, audio worklet, orb, page control), write an E-Embassy persona and tool list, and add a **form bridge** so tools drive the react-hook-form wizards.
* **Option 2:** Depend on the hub's `@worldstreet/vivid-voice` package. Rejected — it ships the hub's trading tools and an older engine path; Xtreme rejected it for the same reason.
* **Option 3:** DOM-only filling via `fillField`. Rejected as the only mechanism — it cannot reach date pickers, Radix selects or the nationality combobox, and knows nothing about steps or validation.

## 4. Proposed Architecture & Design

All in `world-portal-frontend`; the NestJS API is unchanged beyond ADR 0014's `/me` endpoints, which the server tools read.

```
browser ── POST /api/vivid/sira-session ──► Next route ── POST /v1/voice/sessions ──► Sira
           (Clerk session + hasVividAccess)            (SIRA_API_KEY, persona, tools)
        ◄── { id, stream_url, token, clock, audio formats }  (vendor fields stripped)
browser ── WebSocket stream_url ──► Sira    first message {type:"auth", token}; PCM 16 kHz up
        ← {type:"tool_call"} → run tool (browser, or POST /api/vivid/function) → {type:"tool_result"}
```

| Piece | Where |
|---|---|
| Sira client (only reader of `SIRA_API_KEY`) | `src/server/vivid/sira.ts` |
| Access seam — `hasVividAccess()` | `src/server/vivid/access.ts` |
| Persona + tool definitions for the mint | `src/server/vivid/voice-instructions.ts` |
| Mint / end / server-tool routes | `src/app/api/vivid/sira-session`, `…/[id]`, `src/app/api/vivid/function` |
| Server tools (`getMyApplications`, `getApplicationStatus`) | `src/server/vivid/functions.server.ts` → API `/me/applications` with the caller's token |
| Tools (16) | `src/features/vivid/functions.ts` |
| Form bridge | `src/features/vivid/form-bridge.ts`; bindings in `application-form.tsx` and `passport-form.tsx`; field specs in `features/{visa,passport}/vivid-fields.ts` |
| Page control + spotlight | `src/features/vivid/page-control.ts`, `components/vivid-spotlight.tsx` (copied from the hub) |
| Provider, orb, capsule | `src/features/vivid/components/*`, mounted in `src/components/providers/index.tsx`; hidden on `/admin` and `/agency` |
| Mic worklet | `public/vivid/sira-capture.worklet.js` |
| Mic permission | `next.config.ts` — `Permissions-Policy: microphone=(self)` |

**Tools.** Client: `navigateToPage` (fixed destination ids), `getCurrentPageContext`, `checkVisaRequirement` (the local route rules), `startVisaApplication`, `getFormState`, `fillFormFields`, `goToFormStep`, `submitApplication`, and the hub's page-control set (`listPageControls`, `spotlightSection`, `scrollPage`, `clearSpotlight`, `fillField`, `pressControl`). Server: `getMyApplications`, `getApplicationStatus`.

**Form bridge rules.** Values go in through `setValue` and are validated by the form's own schema. Dates must be `YYYY-MM-DD`; choice fields map spoken labels to option values; nationality resolves through the nationality list. The email (from WorldStreet) and the route-set destination are read-only; documents cannot be filled — the applicant uploads them. Passport numbers and NINs are masked when read back. Moving forward validates like Continue.

**Submission.** `submitApplication` always takes two calls: `confirmed=false` returns a read-back and sends nothing; only `confirmed=true` submits, through the same code path as the Submit button (so the WorldStreet token and API error mapping apply).

**Paywall seam.** `VIVID_REQUIRE_SUBSCRIPTION` (default `false`). When `true`, `hasVividAccess` calls `hasWorldStreetVividSubscription`, which today **fails closed**; implementing it (read the hub's `vividentitlements` row via `VIVID_MONGODB_URI`, as Xtreme does) is the whole change. A refusal already yields `402 vivid_locked`, and the provider already sends that to WorldStreet's `/vivid` paywall.

### Environment (frontend, runtime)
| Variable | Notes |
|---|---|
| `SIRA_API_KEY` | Same key the WorldStreet app uses. Unset ⇒ mint answers 503; nothing else breaks. |
| `SIRA_API_URL` | Optional; defaults to `https://sira.vividintelligence.tech`. |
| `VIVID_REQUIRE_SUBSCRIPTION` | `false` (default) or `true`. |

## 5. Consequences
* **Positive Impact:** applicants can apply hands-free; Vivid behaves like it does across WorldStreet; the paywall is a one-function change.
* **Negative Impact / Trade-offs:**
  * Voice cost is borne by WorldStreet's Sira account while Vivid is free here.
  * The spotlight/page-control tools only reach elements tagged `data-vivid-target`; few are tagged today, so the form bridge carries most of the work.
  * Sessions end after 30 s of silence and at Sira's session cap.

## 6. Verification & Test Plan
* **Unit Tests:** `features/vivid/__tests__/form-bridge.test.ts`, `functions.test.ts`; `server/__tests__/vivid.test.ts` (401/402/503, the mint response carries no vendor fields, the persona and tools are sent, server tools use the caller's own token and ignore spoofed args, access seam fails closed).
* **Integration:** `features/vivid/__tests__/visa-form-bridge.test.tsx` renders the real visa and passport wizards and drives them with the tools — route check, fill, step validation, two-call submit, filed with the WorldStreet token.
* **Leak audit:** after `pnpm build`, `grep -rioE "gemini|openai|gpt-|kore|fenrir" .next/static` finds nothing.
* **Live (needs real keys):** the probes in `Worldstreet/docs/VIVID-VOICE-ON-XTREME.md` §7, then by voice: "do I need a visa from Nigeria to Turkey", "start my application", fill a step, "submit it" (expect the read-back and a yes/no), "what's the status of my application", and "which company made you" (must answer Vivid / WorldStreet only).
