// Cloud provider implementations land here in Phase 1.
//
//   wake  → openWakeWord (always local — no cloud option)
//   stt   → Deepgram streaming
//   llm   → Anthropic Claude (Sonnet for cost, Opus for hard queries)
//   tts   → ElevenLabs
//
// Each is a thin adapter behind the interfaces in ../types.ts.
// When Phase 3+ swaps a provider for a local implementation, only
// the file in ../local/ changes — the rest of the app does not.
export {};
