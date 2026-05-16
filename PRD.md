# Jarvis — Product Requirements Document

**Owner:** Rory Bolton
**Status:** Draft v1
**Last updated:** 2026-05-16
**Document scope:** v2 of Jarvis — a native, voice-first macOS desktop agent that supersedes the current GitHub Pages web dashboard.

---

## 1. Summary

Jarvis is a voice-first AI chief of staff that lives on Rory's Mac. It listens for a wake word ("Hey Jarvis"), pulls live data from the businesses Rory actually runs — gig bookings (BookLive, GigSalad), payments (Stripe), and the Go Off Book course (Member Vault) — and acts on that data through a clean, dense dashboard UI.

It ships cloud-first so it can be useful in weeks, not quarters, then progressively migrates each component (STT, LLM, TTS, wake word) to local models so it can run offline with zero per-token cost.

---

## 2. Why now / problem statement

Rory's day spans three businesses that don't talk to each other:

- **Live performance bookings** scattered across BookLive and GigSalad inquiries.
- **Payments and revenue** flowing through Stripe with no per-business breakdown.
- **Go Off Book course** sales and student activity in Member Vault.

The current workflow is: tab-switching between five tools, manually triaging GigSalad messages, eyeballing Stripe for the week, and guessing how the course is performing. There's a v1 Jarvis (browser dashboard reading Google Sheets via Make.com) that proves the concept, but:

- It's browser-only and not voice-native (Siri Shortcut is a workaround, not a product).
- It reads stale data through Sheets instead of talking to source systems.
- It's read-only — Jarvis can summarize but can't act.
- It depends on the Anthropic API forever, with the key exposed in client-side code.

v2 fixes all four.

---

## 3. Goals & non-goals

### 3.1 Goals (v2)

1. **Voice-first.** Wake-word activation, natural conversation, spoken responses. The UI is a complement, not the primary interface.
2. **Real integrations, not Sheets.** Direct API connections to BookLive, GigSalad, Stripe, and Member Vault. Webhooks where available; polling otherwise.
3. **Acts, doesn't just observes.** Can accept/decline gigs, draft and send replies to inquiries, and confirm financial actions — all voice-driven with explicit confirmation.
4. **Native macOS app.** Menu-bar resident with a summonable dashboard window. Feels like a Mac app, not a Chrome tab.
5. **Path to local.** Architected so STT, LLM, TTS, and wake-word components can each be swapped from cloud → local without rewriting the app.
6. **Compelling UI.** Modern, dense, info-rich dashboard (Linear / Raycast aesthetic) that's genuinely useful at a glance.

### 3.2 Non-goals (v2)

- Cross-platform support (no Windows or Linux in v2 — macOS only).
- Mobile app (the Siri Shortcut workaround stays as the mobile story until v3).
- Multi-user / team features. Single user, single machine.
- Replacing the underlying business tools — Jarvis is a layer on top, not a replacement for BookLive/GigSalad/Stripe/Member Vault.
- Calendar scheduling, email triage, generic productivity. Stay focused on the three businesses.

---

## 4. Target user

One user: Rory Bolton. Professional performer, course creator, and operator of multiple revenue streams. Comfortable with technology but doesn't want to be a sysadmin. Values:

- **Speed of information.** "What did I make this week?" should take 2 seconds, not 2 minutes.
- **Calm.** Notifications should be useful, not noisy.
- **Privacy.** Eventually, financial data should not leave the machine.
- **Aesthetics.** The thing he looks at all day should look good.

---

## 5. User stories

### Daily ritual
- *As Rory, I say "Hey Jarvis, morning brief" and hear a 30-second spoken summary: new gig inquiries, revenue yesterday, new course students, anything that needs my attention today.*

### Inquiry triage
- *A GigSalad inquiry arrives. Jarvis chimes, drafts a reply on screen, and asks: "Want me to send it?" I say "yes" and it's sent.*
- *I say "Hey Jarvis, decline the Tuesday wedding inquiry — date conflict" and it sends a polite decline.*

### Booking action
- *I say "Hey Jarvis, accept the corporate gig in Denver for $2,400" and Jarvis confirms the amount, the date, and posts the acceptance through BookLive/GigSalad with my confirmation.*

### Money
- *I say "How's Go Off Book doing this month?" and hear: "$4,820 across 47 sales, up 18% vs last month. Two refunds. Three students completed the program."*
- *Jarvis flags a Stripe anomaly: "Heads up — a $1,200 chargeback came in on the Reynolds booking. Want me to open the dispute?"*

### Ambient awareness
- *Glance at the dashboard: today's revenue, this week's gigs, course MRR, open inquiries — all visible without saying a word.*

---

## 6. Functional requirements

### 6.1 Voice layer

| Capability | Requirement |
|---|---|
| Wake word | "Hey Jarvis" — always listening locally; no audio leaves the machine until activation. |
| STT | Transcribe user speech to text. Target <500ms from end-of-utterance to transcript. |
| LLM | Reason over transcript + live business data + tool definitions; produce a response and/or tool call. |
| TTS | Speak the response. Voice should feel calm, slightly British, distinct from Siri. |
| Barge-in | User can interrupt Jarvis mid-sentence by speaking again. |
| Hotkey fallback | ⌥-Space (configurable) for push-to-talk when wake word is unwanted (cafés, meetings). |
| Mute | One-click menu-bar mute that halts wake-word listening. |

### 6.2 Integrations

#### BookLive
- **Read:** Pull active inquiries, confirmed bookings, calendar.
- **Write:** Accept / decline / counter-offer on inquiries. Send messages to clients.
- **Sync:** Webhook if BookLive supports it; otherwise poll every 2 min.

#### GigSalad
- **Read:** Inbox of leads, quote requests, booking status.
- **Write:** Send quote, decline, mark booked.
- **Sync:** GigSalad doesn't expose a public API — implementation will need either (a) email-forwarding parsing of GigSalad notification emails, (b) browser automation via a logged-in session, or (c) an unofficial scraping approach. **Open question — see §11.**

#### Stripe
- **Read:** Recent charges, refunds, chargebacks, disputes, balance, payouts. Tag charges by source (Go Off Book vs gig deposits vs other) using metadata or product mapping.
- **Write:** Issue refunds (with voice confirmation), respond to dispute notices.
- **Sync:** Stripe webhooks for real-time. Use restricted API key (read + refund scopes only).

#### Member Vault
- **Read:** Student roster, enrollments, purchase events, course progress (modules completed). Member Vault has a REST API; coverage may be partial — confirm during build.
- **Write:** None in v2 (read-only is sufficient for the user stories).
- **Sync:** Webhooks for new purchases / refunds; daily poll for progress data.

### 6.3 Dashboard UI

Single window, summonable from menu-bar icon or hotkey. Layout (top → bottom):

1. **Header strip** — voice waveform (live when listening), date, current status ("Idle" / "Listening" / "Thinking" / "Speaking").
2. **Today panel** — revenue today, gigs today, new inquiries today, new students today. Each is a tile with the number and a sparkline.
3. **Inbox** — unified list of GigSalad + BookLive inquiries needing response, sorted by recency. Click to expand, voice-actionable.
4. **Upcoming gigs** — next 14 days, with venue, fee, status (deposit paid? balance due?).
5. **Money** — this week / this month revenue split by source (gigs vs Go Off Book vs other). Stripe balance + next payout.
6. **Go Off Book** — active students, completion rate, MRR if subscription, recent purchases, refunds.
7. **Transcript drawer** — collapsible panel showing the running voice conversation.

**Aesthetic:** Linear / Raycast — dark default, dense type, generous whitespace within tiles, restrained color (one accent), subtle motion (waveform pulse, value count-ups). No skeuomorphism, no holograms.

### 6.4 Notifications

- Native macOS notifications for: new inquiries, large payments (>$500), chargebacks, refunds, Stripe disputes, new course enrollments.
- Per-category mute. "Hey Jarvis, mute course notifications for the day."
- Notification → click → opens the relevant tile in the dashboard.

### 6.5 Safety & confirmation

- **Voice confirmation required** for any action that sends a message, accepts/declines a booking, or issues a refund. Format: Jarvis states the intent, waits for "yes" / "confirm" / "do it."
- **Undo window** — after sending a message, 10-second on-screen "Undo" affordance.
- **Audit log** — every action Jarvis takes is logged locally with timestamp, channel, and outcome. Viewable in the dashboard.

---

## 7. Technical architecture

### 7.1 Stack (target)

| Layer | Cloud-first MVP | Local target |
|---|---|---|
| App shell | Tauri (Rust + WebView) targeting macOS | Same |
| UI | React + Tailwind, shadcn primitives | Same |
| Wake word | `openWakeWord` (local from day one — no cloud option viable) | Same |
| STT | Deepgram streaming | `whisper.cpp` (small.en or distil-whisper) |
| LLM | Claude (Sonnet 4.6 for cost; Opus for complex reasoning) via Anthropic API | Llama 3.1 8B / Qwen2.5 14B via `llama.cpp` or Ollama |
| TTS | ElevenLabs (custom voice) | Piper or local XTTS |
| Tool layer | Internal "tool registry" with typed schemas, exposed to whichever LLM is active | Same |
| Storage | SQLite (local) for state, transcripts, audit log | Same |
| Secrets | macOS Keychain | Same |

The app is built around a **provider abstraction** for each of {wake, stt, llm, tts} so each can be swapped independently. The dashboard UI never changes when a provider swaps.

### 7.2 Data flow

```
mic → wake-word detector (local, always on)
        │ on trigger
        ▼
     STT stream ──► transcript
                       │
                       ▼
                  LLM with tool registry
                  + live integration data
                  + conversation memory (SQLite)
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
      tool call     spoken reply    UI update
   (Stripe, etc.)   (TTS → audio)   (React state)
```

### 7.3 Integration layer

A single `IntegrationManager` module manages connections, with one adapter per service implementing a common interface:

```ts
interface Integration {
  id: string;
  connect(creds: Credentials): Promise<void>;
  listTools(): Tool[];
  handleWebhook?(payload: unknown): Promise<Event[]>;
  poll?(): Promise<Event[]>;
}
```

Adapters for v2: `BookLiveAdapter`, `GigSaladAdapter`, `StripeAdapter`, `MemberVaultAdapter`.

### 7.4 Migration to local — phased

- **Phase 0 (today):** v1 web dashboard, Anthropic + Google Sheets. Already shipped.
- **Phase 1 (MVP):** Tauri app, cloud STT/LLM/TTS, real Stripe + Member Vault integrations, wake word local.
- **Phase 2:** Add BookLive + GigSalad adapters, voice-driven actions with confirmation.
- **Phase 3:** Swap STT to local Whisper. No UX change.
- **Phase 4:** Swap TTS to Piper / XTTS. Compare to ElevenLabs; allow user to choose.
- **Phase 5:** Add local LLM option (Llama / Qwen via Ollama). User picks per-task: cheap-local-fast vs cloud-smart-slow.
- **Phase 6:** Fully local default. Cloud becomes opt-in fallback for hard queries.

---

## 8. Success metrics

| Metric | Target |
|---|---|
| Wake-word false positive rate | < 1 per 8 hours of background listening |
| Wake-word miss rate | < 5% on intended invocations at conversational volume |
| End-of-utterance → spoken reply latency | < 2.5s (cloud) / < 4s (local) |
| Inquiry triage time (manual → Jarvis-assisted) | -70% on median GigSalad inquiry |
| Time to answer "how much did I make this week" | < 5s from wake-word |
| Per-month cloud cost (Phase 1) | < $50 |
| Per-month cloud cost (Phase 6) | $0 |

---

## 9. Phased delivery

### Phase 1 — Foundation (MVP, ~3 weeks)
- Tauri shell, menu-bar icon, dashboard window.
- Wake word + cloud STT + Claude + ElevenLabs round trip working.
- Stripe adapter (read-only): today's revenue, week summary, recent charges.
- Member Vault adapter (read-only): student count, recent enrollments.
- Dashboard tiles for the above.
- Local SQLite for transcripts + audit log.

### Phase 2 — Actions (~3 weeks)
- BookLive adapter (read + write).
- GigSalad ingestion (decision needed: email parsing vs browser automation — see §11).
- Voice-confirm flow for sending messages, accepting/declining gigs, issuing refunds.
- Notifications.
- Undo affordance.

### Phase 3 — Local STT (~1 week)
- Swap Deepgram for `whisper.cpp`. Validate latency budget on user's Mac.

### Phase 4 — Local TTS (~1 week)
- Swap ElevenLabs for Piper. User-selectable.

### Phase 5 — Local LLM option (~2 weeks)
- Ollama integration. Tool-calling parity with Claude. Routing heuristic ("simple → local, complex → cloud").

### Phase 6 — Local default (~1 week)
- Flip default. Cloud becomes opt-in. Document the trade-offs.

---

## 10. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| GigSalad has no public API | High | Decide between email parsing, browser automation, or scoping GigSalad to "read-only via email forwarding" in v2. |
| Member Vault API coverage gaps | Medium | Confirm endpoints during Phase 1; fall back to webhook-only ingestion for missing data. |
| Local LLM quality insufficient for tool-calling and natural conversation | Medium | Keep cloud as fallback indefinitely; route per query rather than all-or-nothing. |
| Wake-word false positives during performances / videos | Medium | One-click mute, auto-mute when specific apps are foregrounded (e.g. video conferencing). |
| Voice-driven financial actions are dangerous | High | Confirmation required for every write; restricted Stripe key; per-action spending cap; full audit log; "are you sure" for amounts above a threshold. |
| Secrets leak (Stripe key, API keys) | High | macOS Keychain only; never log; never sync to GitHub; tested via pre-commit secret scan. |
| Whisper/Piper quality regression vs cloud | Low | Phases 3 and 4 are reversible — user can toggle providers. |

---

## 11. Open questions

1. **GigSalad ingestion path.** Email parsing is brittle but legal; browser automation is fragile but full-featured; scraping risks ToS issues. Which trade-off?
2. **BookLive API access.** Need to confirm what's exposed publicly vs partner-only. May require an outreach email.
3. **Stripe tagging strategy.** How are Go Off Book purchases distinguished from gig deposits today? Product ID, metadata, or separate account? This determines how clean the per-business revenue split can be.
4. **Voice identity.** Buy a custom ElevenLabs voice clone, or pick from the library? Affects cost and personality.
5. **Spending cap defaults.** What dollar amount above which Jarvis demands a typed (not voice) confirmation? Suggest $250 default.
6. **Conversation memory scope.** Per-session only, or persistent across days? Persistent is more useful but raises the stakes on local storage hygiene.

---

## 12. What carries over from v1

The current web dashboard is not thrown away — it informed this PRD and several assets transfer:

- **Personality / system prompt** in `config.js` → port to the new app's prompt module.
- **Sheet-parsing heuristics** in `data.js` → keep as a fallback ingestion path while real APIs are being wired up.
- **Three.js orb** from `index.html` → reused as the optional "ambient mode" visual when the dashboard window is minimized.
- **Make.com scenarios** → keep running during Phase 1 as a redundant data path, retired once direct integrations are stable.

---

## 13. Appendix — naming, voice, brand

- **Name:** Jarvis (lowercase in body, capitalized in headings).
- **Voice persona:** Calm, dry, slightly British, never sycophantic. Closer to a chief of staff than a butler. No "I'd be happy to help!" — just does the thing.
- **Acknowledgment style:** Short. "Done." "Sent." "Declined." Expand only when asked.
- **Failure style:** Honest. "GigSalad API didn't respond — try again in a minute" beats "I'm having trouble right now."
