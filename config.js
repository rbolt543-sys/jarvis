// ============================================================
// JARVIS CONFIG — Add your API key and Sheet URL here
// ⚠️  This file is public on GitHub Pages.
//     For production, route through a server-side proxy.
// ============================================================

const JARVIS_CONFIG = {

  // 1. PASTE YOUR ANTHROPIC API KEY BELOW
  ANTHROPIC_API_KEY: 'sk-ant-YOUR_KEY_HERE',

  // 2. PASTE YOUR GOOGLE SHEET CSV EXPORT URL BELOW
  //    File → Share → Publish to Web → CSV → copy URL
  GOOGLE_SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/1lzqEWFxvaqp9w6_vH-pURYwM0J3-Uhvx4EzCeG-wWJA/edit',

  // Sheet tab GIDs (0 = first tab, change if your tabs differ)
  SHEET_TABS: {
    leads:    '0',
    gigs:     '1',
    students: '2',
  },

  // ElevenLabs — real JARVIS voice
  // Get key: https://elevenlabs.io/app/settings/api-keys
  // Find JARVIS voice: elevenlabs.io/app/voice-library (search "JARVIS")
  ELEVENLABS_API_KEY:  '',
  ELEVENLABS_VOICE_ID: 'onwK4e9ZLuTAKqWW03F9',

  // Anthropic model
  MODEL: 'claude-opus-4-6',
  MAX_TOKENS: 1024,

  // Voice settings
  WAKE_WORDS: ['jarvis', 'hey jarvis', 'ok jarvis'],
  VOICE_LANG: 'en-GB',           // British voice for JARVIS feel
  VOICE_RATE: 1.0,
  VOICE_PITCH: 0.9,

  // Memory
  MEMORY_KEY: 'jarvis_memory_v1',
  MAX_MEMORY_MESSAGES: 20,       // rolling window kept in localStorage

  // Auto-refresh data (ms)
  DATA_REFRESH_MS: 60000,        // 60 seconds

  // JARVIS personality system prompt
  SYSTEM_PROMPT: `You are JARVIS — Rory Bolton's personal AI chief of staff. Rory is a professional pianist, live entertainer, board-certified music therapist, and online piano educator. His two businesses are Go Off Book (GOB) — a piano improv course on MemberVault — and Rory Bolton Live — premium piano entertainment for weddings, corporate events, and Tribute Experiences (Elton John, Billy Joel, Sinatra, Elvis, Rat Pack) starting at $2K for full production. You manage his pipeline, gigs, revenue, tasks, and priorities. You are sharp, efficient, and loyal. You never waste words. You always think in terms of revenue, momentum, and next actions. When Rory asks a question, answer directly then give one recommended next move.`,

};
