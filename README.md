# JARVIS — Personal AI Command Center

Voice-activated AI dashboard for Rory Bolton. Manages leads, gigs, revenue, GOB students, tasks, and responds via voice using the Anthropic API.

**Live URL:** https://rbolt543-sys.github.io/jarvis

---

## Setup (3 steps)

### 1. Add your API keys — safely

> ⚠️ **Do NOT paste real keys into `config.js` and commit them.**
> This repo is public and GitHub Pages serves `config.js` to every visitor.
> A previous ElevenLabs key committed here was leaked publicly (GitGuardian alert
> May 16 2026) within minutes and had to be revoked. See `config.js` for current
> guidance.
>
> Until a proxy or the v2 desktop app (`PRD.md`) is in place, the safest local
> workflow is:
>
> 1. Copy `config.js` to `config.local.js` (already in `.gitignore`).
> 2. Put your real keys in `config.local.js`.
> 3. Load `config.local.js` instead of `config.js` when running locally, or
>    edit `config.js` only on your machine and **never** `git add` it.

---

### 2. Connect your Google Sheet

In Google Sheets (the "JARVIS Data" sheet connected to Make.com):

1. **File → Share → Publish to web**
2. Select: **Entire Document** → **Comma-separated values (.csv)**
3. Click **Publish** → copy the URL
4. Paste it into `config.js`:

```js
GOOGLE_SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/...',
```

**Sheet tab order expected:**
- Tab 1 (gid=0): **Leads** — columns: name, source, status, date, value, notes
- Tab 2 (gid=1): **Gigs** — columns: name/event, date, type, fee, status, venue
- Tab 3 (gid=2): **Students** — columns: name, status, joined, module, source

Column names are flexible — the parser matches common variations automatically.

---

### 3. Deploy changes

After editing `config.js`, commit and push:

```bash
git add config.js
git commit -m "Add API key and Sheet URL"
git push
```

GitHub Pages auto-deploys within ~60 seconds.

---

## Siri Shortcut — "Hey Siri, ask JARVIS…"

Set up a Shortcut so you can query JARVIS hands-free from your iPhone:

**Option A — Opens JARVIS in Safari (simplest):**

1. Open the **Shortcuts** app on iPhone → tap **+** (new shortcut)
2. Add action: **"Ask for Input"** → set prompt: *"Ask JARVIS"* → Input type: Text
3. Add action: **"Open URLs"** → URL: `https://rbolt543-sys.github.io/jarvis?q=[Provided Input]`
4. Tap **…** (settings) → **Add to Siri** → record phrase: **"Ask JARVIS"**
5. Test: Say *"Hey Siri, ask JARVIS"* → dictate your question → Safari opens JARVIS and auto-processes it

**Option B — Direct API call (no browser, speaks answer via Siri):**

1. New Shortcut → Add action: **"Dictate Text"** → Language: English
2. Add action: **"Get Contents of URL"**
   - URL: `https://api.anthropic.com/v1/messages`
   - Method: POST
   - Headers: `x-api-key: YOUR_KEY`, `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true`, `Content-Type: application/json`
   - Body (JSON):
     ```json
     {"model":"claude-opus-4-6","max_tokens":512,"system":"You are JARVIS, Rory Bolton's AI chief of staff. Be sharp and concise.","messages":[{"role":"user","content":"[Dictated Text]"}]}
     ```
3. Add action: **"Get Dictionary Value"** → Key: `content` → from step above
4. Add action: **"Speak Text"** → the result
5. Add to Siri: phrase **"Ask JARVIS"**

---

## Test Command

Open https://rbolt543-sys.github.io/jarvis and type in the chat:

> **"Jarvis, give me a full status report"**

Expected: JARVIS responds with current lead count, upcoming gigs, GOB student summary, and one recommended next action.

---

## Architecture

| File | Purpose |
|------|---------|
| `index.html` | Full dashboard UI + Three.js holographic orb |
| `jarvis-brain.js` | Voice engine, Anthropic API calls, memory |
| `data.js` | Google Sheets CSV fetcher and parser |
| `config.js` | API key, Sheet URL, personality prompt |

---

## Make.com Integration

Your two existing scenarios push data into "JARVIS Data" Google Sheet. JARVIS polls the sheet every 60 seconds (configurable via `DATA_REFRESH_MS` in config.js).

To push data more aggressively, add a Make.com webhook step that calls:
```
https://rbolt543-sys.github.io/jarvis
```
(JARVIS will auto-refresh on each page load.)
