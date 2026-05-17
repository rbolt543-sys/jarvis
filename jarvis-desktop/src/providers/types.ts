// Provider interfaces for the four swappable voice-stack layers.
// Cloud and local implementations must satisfy these contracts so the
// rest of the app never knows (or cares) which one is active.

export interface WakeProvider {
  id: string;
  start(onTrigger: () => void): Promise<void>;
  stop(): Promise<void>;
}

export interface SttProvider {
  id: string;
  transcribe(audio: ReadableStream<Uint8Array>): AsyncIterable<SttChunk>;
}

export interface SttChunk {
  text: string;
  isFinal: boolean;
}

export interface LlmProvider {
  id: string;
  respond(input: LlmInput): AsyncIterable<LlmChunk>;
}

export interface LlmInput {
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  tools?: ToolDefinition[];
}

export type LlmChunk =
  | { kind: "text"; text: string }
  | { kind: "tool_call"; name: string; args: unknown };

export interface ToolDefinition {
  name: string;
  description: string;
  schema: unknown;
  run(args: unknown): Promise<unknown>;
}

export interface TtsProvider {
  id: string;
  speak(text: string): Promise<void>;
  stop(): Promise<void>;
}
