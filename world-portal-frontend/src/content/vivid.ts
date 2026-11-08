import type { VividAgentState } from "@/features/vivid/types";

/** Copy for Vivid's orb and live capsule. */
export const vividCopy = {
  talk: "Talk to Vivid",
  /**
   * The Ask Vivid pill on the landing page, adapted from WorldStreet's Ask
   * Vivid dock. Vivid here is voice-only, so the pill starts the same voice
   * session the orb does. Every prompt is something Vivid's tools can
   * actually do (features/vivid/functions.ts): check a visa requirement,
   * start an application, report a status, show the way around the site.
   */
  ask: {
    lead: "Not sure where to start? Ask Vivid",
    button: "Ask Vivid",
    buttonShort: "Ask",
    label: "Ask Vivid. Starts a voice conversation",
    prompts: [
      "Do I need a visa to visit Dubai?",
      "Start a visa application for me",
      "What do I need for a UK visa?",
      "Where is my visa application?",
      "How does the passport service work?",
    ],
  },
  end: "End Vivid session",
  name: "Vivid",
  states: {
    idle: "",
    connecting: "Connecting",
    ready: "Ready",
    listening: "Listening",
    processing: "Thinking",
    speaking: "Speaking",
    error: "",
  } satisfies Record<VividAgentState, string>,
} as const;
