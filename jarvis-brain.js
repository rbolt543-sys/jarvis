// ============================================================
// JARVIS BRAIN — Voice · AI · Memory · Orb Control
// ============================================================

const JARVIS = (() => {

  // ── State ────────────────────────────────────────────────────
  let _state = 'idle';   // idle | listening | thinking | speaking
  let _recognition = null;
  let _synth = window.speechSynthesis;
  let _orb = null;       // Three.js orb controller (injected by index.html)
  let _activeUtterance = null;
  let _wakeDetecting = false;
  let _commandBuffer = '';
  let _commandTimer = null;

  // ── Initialise ───────────────────────────────────────────────
  function init(orbController) {
    _orb = orbController;
    _loadMemory();

    // Check for URL query param (Siri Shortcut integration)
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || params.get('query');
    if (q) {
      setTimeout(() => ask(q), 1500); // slight delay for page to settle
    }

    _setupSpeechRecognition();
    log('JARVIS online. Standing by.');
    return JARVIS;
  }

  // ── Speech Recognition ───────────────────────────────────────
  function _setupSpeechRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('SpeechRecognition not supported in this browser.');
      return;
    }

    _recognition = new SR();
    _recognition.continuous = true;
    _recognition.interimResults = true;
    _recognition.lang = JARVIS_CONFIG.VOICE_LANG;
    _recognition.maxAlternatives = 1;

    _recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('')
        .toLowerCase()
        .trim();

      if (_state === 'idle' || _state === 'speaking') {
        // Wake word detection
        const hit = JARVIS_CONFIG.WAKE_WORDS.some(w => transcript.includes(w));
        if (hit) {
          _activateListening(transcript);
        }
      } else if (_state === 'listening') {
        // Accumulate command
        _commandBuffer = transcript;
        clearTimeout(_commandTimer);
        if (e.results[e.results.length - 1].isFinal) {
          _processCommand(_commandBuffer);
        } else {
          _commandTimer = setTimeout(() => _processCommand(_commandBuffer), 2000);
        }
        _updateStatus('Listening…', transcript);
      }
    };

    _recognition.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('SR error:', e.error);
      }
      if (_state === 'listening') setState('idle');
    };

    _recognition.onend = () => {
      if (_wakeDetecting && _state !== 'speaking' && _state !== 'thinking') {
        setTimeout(() => { try { _recognition.start(); } catch(_){} }, 400);
      }
    };
  }

  function startWakeDetection() {
    if (!_recognition) return;
    _wakeDetecting = true;
    try { _recognition.start(); } catch(_) {}
    log('Wake word detection active. Say "Hey JARVIS" to activate.');
  }

  function stopWakeDetection() {
    _wakeDetecting = false;
    try { _recognition.stop(); } catch(_) {}
  }

  function _activateListening(rawTranscript) {
    setState('listening');
    _orb?.pulse();
    _speak('Yes?', true);

    // Strip the wake word from the transcript — rest is the command
    let cmd = rawTranscript;
    JARVIS_CONFIG.WAKE_WORDS.forEach(w => { cmd = cmd.replace(w, '').trim(); });
    if (cmd.length > 3) {
      // Wake word was followed by a command in the same breath
      setTimeout(() => _processCommand(cmd), 800);
    }
  }

  // ── Manual listen trigger (button) ───────────────────────────
  function startListening() {
    if (_state === 'thinking' || _state === 'speaking') return;
    _commandBuffer = '';
    setState('listening');
    _orb?.pulse();
    _updateStatus('Listening…', 'Speak your command…');
    clearTimeout(_commandTimer);
    _commandTimer = setTimeout(() => {
      if (_state === 'listening') setState('idle');
    }, 15000); // 15s timeout
  }

  function stopListening() {
    clearTimeout(_commandTimer);
    if (_commandBuffer.trim()) {
      _processCommand(_commandBuffer);
    } else {
      setState('idle');
    }
  }

  // ── Process command → Anthropic → Speak ─────────────────────
  async function _processCommand(text) {
    if (!text || text.trim().length < 2) { setState('idle'); return; }
    clearTimeout(_commandTimer);
    await ask(text);
  }

  async function ask(userMessage) {
    userMessage = userMessage.trim();
    if (!userMessage) return;

    setState('thinking');
    _orb?.think();
    appendChatMessage('user', userMessage);
    _updateStatus('Thinking…', '');

    // Build messages for API
    const memory = _getMemory();
    const dataContext = JARVIS_DATA.getSummaryText();
    const messages = [
      ...memory,
      { role: 'user', content: `[Live dashboard data]\n${dataContext}\n\n${userMessage}` }
    ];

    try {
      const apiKey = JARVIS_CONFIG.ANTHROPIC_API_KEY;
      if (!apiKey || apiKey.includes('YOUR_KEY')) {
        throw new Error('API key not configured. Open config.js and add your Anthropic API key.');
      }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: JARVIS_CONFIG.MODEL,
          max_tokens: JARVIS_CONFIG.MAX_TOKENS,
          system: JARVIS_CONFIG.SYSTEM_PROMPT,
          messages,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const reply = data.content?.[0]?.text || 'No response.';

      // Save to memory (store without data context prefix)
      _saveToMemory('user', userMessage);
      _saveToMemory('assistant', reply);

      appendChatMessage('assistant', reply);
      _speak(reply);

    } catch (err) {
      const msg = `Error: ${err.message}`;
      appendChatMessage('system', msg);
      _speak('I encountered an issue. ' + err.message.slice(0, 80));
      setState('idle');
    }
  }

  // ── Text-to-Speech ───────────────────────────────────────────
  // Cache voices once loaded
  let _voices = [];
  if (_synth) {
    _voices = _synth.getVoices();
    _synth.onvoiceschanged = () => { _voices = _synth.getVoices(); };
  }

  function _pickVoice() {
    if (!_voices.length) _voices = _synth.getVoices();
    // Priority list — targeting crisp British male closest to Paul Bettany's JARVIS
    const priority = [
      v => v.name === 'Daniel (Enhanced)',                           // macOS enhanced — best quality
      v => v.name === 'Daniel',                                      // macOS/iOS standard British male
      v => v.name === 'Google UK English Male',                      // Chrome British male
      v => v.name.includes('Daniel'),
      v => v.name === 'Arthur',                                      // newer macOS British male
      v => v.name.includes('Arthur'),
      v => v.lang === 'en-GB' && v.name.toLowerCase().includes('enhanced'),
      v => v.lang === 'en-GB',
      v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('male'),
      v => v.lang.startsWith('en'),
    ];
    for (const test of priority) {
      const match = _voices.find(test);
      if (match) return match;
    }
    return null;
  }

  let _resumeTimer = null;
  let _activeAudio  = null;

  function _afterSpeak() {
    setState('idle'); _orb?.idle();
    if (_wakeDetecting) setTimeout(function(){ try{ _recognition?.start(); }catch(_){} }, 500);
  }

  async function _speakElevenLabs(text, brief) {
    var key = JARVIS_CONFIG.ELEVENLABS_API_KEY;
    var vid = JARVIS_CONFIG.ELEVENLABS_VOICE_ID || 'onwK4e9ZLuTAKqWW03F9';
    var clean = text.replace(/[#`*]/g,'').slice(0, brief?150:1000);
    setState('speaking'); _orb?.speak();
    try { _recognition?.stop(); } catch(_){}
    try {
      var res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+vid+'/stream',{
        method:'POST', headers:{'xi-api-key':key,'Content-Type':'application/json'},
        body:JSON.stringify({text:clean,model_id:'eleven_turbo_v2_5',
          voice_settings:{stability:0.45,similarity_boost:0.82,style:0.15,use_speaker_boost:true}})
      });
      if (!res.ok) throw new Error('EL '+res.status);
      var blob = await res.blob();
      var url = URL.createObjectURL(blob);
      if (_activeAudio){ _activeAudio.pause(); URL.revokeObjectURL(_activeAudio.src); }
      _activeAudio = new Audio(url);
      _activeAudio.onended = function(){ URL.revokeObjectURL(url); _afterSpeak(); };
      _activeAudio.onerror = function(){ URL.revokeObjectURL(url); _afterSpeak(); };
      _activeAudio.play();
    } catch(err){
      console.warn('ElevenLabs failed, fallback:',err.message);
      _speakWebSpeech(text, brief);
    }
  }

  function _speakWebSpeech(text, brief) {
    if (!_synth) return;
    _synth.cancel(); clearInterval(_resumeTimer);
    try { _recognition?.stop(); } catch(_){}
    var clean = text.replace(/[#`*]/g,'').slice(0,brief?120:800);
    var utt = new SpeechSynthesisUtterance(clean);
    utt.lang='en-GB'; utt.rate=brief?1.05:0.97; utt.pitch=1.18;
    var voice=_pickVoice(); if(voice) utt.voice=voice;
    utt.onstart=function(){ setState('speaking'); _orb?.speak();
      _resumeTimer=setInterval(function(){ if(_synth.speaking) _synth.resume(); },10000); };
    utt.onend=function(){ clearInterval(_resumeTimer); _afterSpeak(); };
    utt.onerror=function(){ clearInterval(_resumeTimer); _afterSpeak(); };
    _activeUtterance=utt; _synth.speak(utt);
    if (!brief) setState('speaking');
  }

  function _speak(text, brief) {
    if(brief===undefined) brief=false;
    var k = JARVIS_CONFIG.ELEVENLABS_API_KEY;
    if (k && k.length>10){ _speakElevenLabs(text,brief); } else { _speakWebSpeech(text,brief); }
  }

  function stopSpeaking() {
    _synth?.cancel(); clearInterval(_resumeTimer);
    if (_activeAudio){ _activeAudio.pause(); _activeAudio=null; }
    setState('idle'); _orb?.idle();
  }

  // ── State machine ────────────────────────────────────────────
  function setState(newState) {
    _state = newState;
    document.body.dataset.jarvisState = newState;
    _updateStatusBar(newState);
    window.dispatchEvent(new CustomEvent('jarvis:state', { detail: newState }));
  }

  function getState() { return _state; }

  function _updateStatusBar(state) {
    const el = document.getElementById('jarvis-status-text');
    if (!el) return;
    const labels = { idle: 'Standing By', listening: 'Listening', thinking: 'Processing', speaking: 'Speaking' };
    el.textContent = labels[state] || state;
  }

  function _updateStatus(label, subtitle) {
    const el = document.getElementById('chat-status');
    if (el) el.textContent = label;
    const el2 = document.getElementById('chat-interim');
    if (el2) el2.textContent = subtitle;
  }

  // ── Memory (localStorage) ────────────────────────────────────
  function _saveToMemory(role, content) {
    const mem = _getMemory();
    mem.push({ role, content });
    // Rolling window
    const trimmed = mem.slice(-JARVIS_CONFIG.MAX_MEMORY_MESSAGES);
    localStorage.setItem(JARVIS_CONFIG.MEMORY_KEY, JSON.stringify(trimmed));
  }

  function _getMemory() {
    try {
      return JSON.parse(localStorage.getItem(JARVIS_CONFIG.MEMORY_KEY) || '[]');
    } catch (_) { return []; }
  }

  function _loadMemory() {
    const mem = _getMemory();
    // Replay into chat UI
    mem.slice(-6).forEach(m => appendChatMessage(m.role, m.content, true));
  }

  function clearMemory() {
    localStorage.removeItem(JARVIS_CONFIG.MEMORY_KEY);
    document.getElementById('chat-messages').innerHTML = '';
    log('Memory cleared.');
  }

  // ── Chat UI ──────────────────────────────────────────────────
  function appendChatMessage(role, text, fromMemory = false) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const wrap = document.createElement('div');
    wrap.className = `chat-msg chat-msg--${role}${fromMemory ? ' chat-msg--memory' : ''}`;

    const label = document.createElement('span');
    label.className = 'chat-msg__label';
    label.textContent = role === 'user' ? 'You' : role === 'assistant' ? 'JARVIS' : '⚠';

    const body = document.createElement('div');
    body.className = 'chat-msg__body';
    // Simple markdown: bold, line breaks
    body.innerHTML = text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    wrap.appendChild(label);
    wrap.appendChild(body);
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
  }

  function log(msg) {
    appendChatMessage('system', msg);
  }

  // ── Public API ───────────────────────────────────────────────
  return {
    init,
    ask,
    startListening,
    stopListening,
    startWakeDetection,
    stopWakeDetection,
    stopSpeaking,
    clearMemory,
    getState,
    log,
    appendChatMessage,
  };

})();
