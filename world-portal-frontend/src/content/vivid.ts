import type { VividAgentState } from "@/features/vivid/types";

/** Copy for Vivid's orb and live capsule. */
export const vividCopy = {
  talk: "Talk to Vivid",
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
