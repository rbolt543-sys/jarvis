# Jarvis Desktop (v2 — Phase 1 scaffold)

Native macOS voice-first agent. See `../PRD.md` for the full product spec.

## Prerequisites (one-time, on your Mac)

```bash
# Rust toolchain (Tauri backend)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Node + pnpm (frontend)
brew install node pnpm

# Tauri's macOS deps
xcode-select --install
```

## Run

```bash
cd jarvis-desktop
pnpm install
pnpm tauri:dev
```

First `tauri:dev` will compile a lot of Rust crates — give it 5-10 minutes.
After that, incremental rebuilds are fast.

You should see an empty Jarvis dashboard window with the header and tile shells.

## What's wired today

- Tauri 2.x shell, Vite + React + TypeScript, Tailwind.
- Provider abstraction (`src/providers/types.ts`) — `WakeProvider`, `SttProvider`,
  `LlmProvider`, `TtsProvider` interfaces. No implementations yet.
- Integration interface (`src/integrations/types.ts`) — stubs for Stripe,
  Member Vault, BookLive, GigSalad.
- Dashboard shell — Header + 5 tiles (Today, Inbox, Upcoming Gigs, Money,
  Go Off Book). Placeholder content.

## What's next (PRD §9, Phase 1 detail)

1. **Wake word** — `openWakeWord` running in a Rust thread, posts a Tauri
   event to the frontend on trigger.
2. **STT** — Deepgram streaming client. Tap mic via `cpal` in Rust or
   `getUserMedia` in the WebView; send to Deepgram, stream transcripts back.
3. **LLM** — Anthropic client. System prompt port from v1's `config.js`.
   Tool registry feeds the integration tools to the model.
4. **TTS** — ElevenLabs streaming. Voice ID `K8RBkZM3VaxoGBaGvie0`.
5. **Stripe adapter** — restricted key in Keychain, today/week revenue tools.
6. **Member Vault adapter** — student count + recent enrollments.

## Secrets

Use the macOS Keychain via `tauri-plugin-keychain` (to be added in Phase 1).
Never put keys in source files. The PRD's whole reason for going native is
exactly this — `config.js` in a web build is a leak waiting to happen.
