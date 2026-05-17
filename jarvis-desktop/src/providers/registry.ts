import type { LlmProvider, SttProvider, TtsProvider, WakeProvider } from "./types";

export interface ProviderRegistry {
  wake: WakeProvider;
  stt: SttProvider;
  llm: LlmProvider;
  tts: TtsProvider;
}

let active: ProviderRegistry | null = null;

export function setProviders(registry: ProviderRegistry): void {
  active = registry;
}

export function providers(): ProviderRegistry {
  if (!active) throw new Error("Providers not configured. Call setProviders() during app init.");
  return active;
}
