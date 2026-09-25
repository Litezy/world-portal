/**
 * Types for Vivid, WorldStreet's voice assistant, on E-Embassy.
 *
 * Local copies of what the WorldStreet app takes from its
 * `@worldstreet/vivid-voice` package — E-Embassy deliberately does not take
 * that dependency (it carries the hub's trading tools), exactly as Xtreme
 * does not.
 */

export type VividAgentState =
  "idle" | "connecting" | "ready" | "listening" | "processing" | "speaking" | "error";

export type JSONSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
};

export interface VoiceFunctionConfig<P = Record<string, unknown>, R = unknown> {
  name: string;
  /** Written for the model: when to call it and what comes back. */
  description: string;
  parameters: JSONSchema;
  handler: (params: P) => Promise<R> | R;
  /** "client" runs in the browser; "server" is routed to /api/vivid/function. */
  executionContext?: "client" | "server";
}

/** OpenAI-style function definition — the shape Sira takes on the mint. */
export type VividVoiceTool = {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};
