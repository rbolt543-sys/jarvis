// ============================================================
// JARVIS DATA.JS — Google Sheets CSV reader + parser
// Expects 3 tabs in your sheet: Leads | Gigs | Students
// ============================================================

const JARVIS_DATA = (() => {

  let _cache = {
    leads:    [],
    gigs:     [],
    students: [],
    lastFetch: null,
  };

  // ── CSV Parser ──────────────────────────────────────────────
  function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = splitCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    return lines.slice(1).map(line => {
      const vals = splitCSVLine(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
      return obj;
    }).filter(row => Object.values(row).some(v => v !== ''));
  }

  function splitCSVLine(line) {
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { result.push(cur); cur = ''; continue; }
      cur += ch;
    }
    result.push(cur);
    return result;
  }

  // ── Build tab URL from base sheet URL ───────────────────────
  function tabURL(baseURL, gid) {
    if (!baseURL) return null;
    // Accept both /edit and /pub URLs; normalise to CSV export
    const id = baseURL.match(/\/d\/([\w-]+)/)?.[1];
    if (!id) return null;
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  }

  // ── Fetch a single tab ───────────────────────────────────────
  async function fetchTab(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    return parseCSV(await res.text());
  }

  // ── Main refresh ─────────────────────────────────────────────
  async function refresh() {
    const base = JARVIS_CONFIG.GOOGLE_SHEET_CSV_URL;
    if (!base) {
      console.warn('JARVIS: No Google Sheet URL set in config.js');
      _loadDemoData();
      return _cache;
    }

    const tabs = JARVIS_CONFIG.SHEET_TABS;
    try {
      const [leads, gigs, students] = await Promise.all([
        fetchTab(tabURL(base, tabs.leads)),
        fetchTab(tabURL(base, tabs.gigs)),
        fetchTab(tabURL(base, tabs.students)),
      ]);
      _cache.leads    = _normLeads(leads);
      _cache.gigs     = _normGigs(gigs);
      _cache.students = _normStudents(students);
      _cache.lastFetch = new Date();
      console.log(`JARVIS Data: ${leads.length} leads, ${gigs.length} gigs, ${students.length} students`);
    } catch (err) {
      console.error('JARVIS Data fetch error:', err);
      _loadDemoData();
    }
    return _cache;
  }

  // ── Normalisers (flexible column name mapping) ───────────────
  function _normLeads(rows) {
    return rows.map(r => ({
      name:    r.name   || r.client_name || r.contact || '',
      source:  r.source || r.platform    || r.origin  || '',
      status:  r.status || r.stage       || 'New',
      date:    r.date   || r.enquiry_date || r.created || '',
      value:   _parseMoney(r.value || r.budget || r.fee || '0'),
      notes:   r.notes  || r.message     || '',
      email:   r.email  || '',
      phone:   r.phone  || r.mobile      || '',
    }));
  }

  function _normGigs(rows) {
    return rows.map(r => ({
      name:    r.event   || r.gig        || r.name   || r.client || '',
      date:    r.date    || r.event_date  || r.gig_date || '',
      type:    r.type    || r.event_type  || r.category || '',
      fee:     _parseMoney(r.fee || r.value || r.revenue || '0'),
      status:  r.status  || r.confirmed  || 'Confirmed',
      venue:   r.venue   || r.location   || '',
      notes:   r.notes   || '',
    }));
  }

  function _normStudents(rows) {
    return rows.map(r => ({
      name:    r.name    || r.student    || '',
      status:  r.status  || r.stage      || 'Active',
      joined:  r.joined  || r.start_date || r.enrolled || '',
      module:  r.module  || r.lesson     || r.progress || '',
      email:   r.email   || '',
      source:  r.source  || '',
    }));
  }

  function _parseMoney(str) {
    return parseFloat(String(str).replace(/[^0-9.-]/g, '')) || 0;
  }

  // ── Demo data (shown when no Sheet URL is set) ───────────────
  function _loadDemoData() {
    _cache.leads = [
      { name: 'Sarah & Tom Mitchell', source: 'GigSalad',  status: 'Hot Lead',  date: '2026-04-22', value: 2800, notes: 'Wedding June 15, wants Elton tribute', email: '', phone: '' },
      { name: 'Parkview Corp Events', source: 'BookLive',  status: 'Quoted',    date: '2026-04-20', value: 3500, notes: 'Corporate dinner for 120 pax', email: '', phone: '' },
      { name: 'Jessica Reynolds',     source: 'Instagram', status: 'New',       date: '2026-04-25', value: 0,    notes: 'Interested in GOB course', email: '', phone: '' },
      { name: 'Grand Hyatt Chicago',  source: 'Referral',  status: 'Negotiating', date: '2026-04-18', value: 4200, notes: 'New Year\'s Eve residency', email: '', phone: '' },
    ];
    _cache.gigs = [
      { name: 'Harrison Wedding',      date: '2026-05-10', type: 'Wedding',         fee: 2500, status: 'Confirmed', venue: 'The Biltmore Hotel', notes: '' },
      { name: 'TechConf Awards Night', date: '2026-05-17', type: 'Corporate',       fee: 3200, status: 'Confirmed', venue: 'Convention Center', notes: 'Rat Pack set' },
      { name: 'Elton Tribute — Rialto',date: '2026-06-02', type: 'Tribute Show',    fee: 2000, status: 'Confirmed', venue: 'Rialto Theater', notes: 'Full production' },
      { name: 'Private Birthday',      date: '2026-06-14', type: 'Private Event',   fee: 1800, status: 'Hold',      venue: 'Private Residence', notes: 'Pending deposit' },
    ];
    _cache.students = [
      { name: 'Marcus Webb',   status: 'Active',   joined: '2026-03-01', module: 'Module 4 — Reharmonisation', email: '', source: 'Instagram' },
      { name: 'Diana Chow',    status: 'Active',   joined: '2026-02-15', module: 'Module 6 — Performance',     email: '', source: 'YouTube' },
      { name: 'Robert Palma',  status: 'Stalled',  joined: '2026-01-10', module: 'Module 2 — Chord Voicing',   email: '', source: 'GigSalad referral' },
      { name: 'Lena Fischer',  status: 'Active',   joined: '2026-04-01', module: 'Module 1 — Foundations',     email: '', source: 'Instagram' },
      { name: 'James Nguyen',  status: 'Complete', joined: '2025-12-01', module: 'Complete ✓',                email: '', source: 'Email list' },
    ];
    _cache.lastFetch = new Date();
  }

  // ── Quick stats for JARVIS context ───────────────────────────
  function getStats() {
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const gigsThisMonth = _cache.gigs.filter(g => g.date.startsWith(thisMonth));
    const revenueThisMonth = gigsThisMonth.reduce((s, g) => s + g.fee, 0);
    const revenueTotal = _cache.gigs.filter(g => g.status === 'Confirmed').reduce((s, g) => s + g.fee, 0);
    const hotLeads = _cache.leads.filter(l => ['Hot Lead', 'Quoted', 'Negotiating'].includes(l.status));
    return {
      totalLeads:       _cache.leads.length,
      hotLeads:         hotLeads.length,
      pipelineValue:    hotLeads.reduce((s, l) => s + l.value, 0),
      confirmedGigs:    _cache.gigs.filter(g => g.status === 'Confirmed').length,
      revenueThisMonth,
      revenueTotal,
      activeStudents:   _cache.students.filter(s => s.status === 'Active').length,
      totalStudents:    _cache.students.length,
    };
  }

  // ── Summarise data as text for AI context ────────────────────
  function getSummaryText() {
    const s = getStats();
    const upcomingGigs = _cache.gigs
      .filter(g => g.date >= new Date().toISOString().slice(0, 10))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)
      .map(g => `${g.date} — ${g.name} (${g.type}, $${g.fee.toLocaleString()})`)
      .join('\n');

    const hotLeadsList = _cache.leads
      .filter(l => ['Hot Lead','Quoted','Negotiating'].includes(l.status))
      .map(l => `${l.name} via ${l.source} — ${l.status}${l.value ? ' ($'+l.value.toLocaleString()+')' : ''}`)
      .join('\n');

    return `CURRENT DASHBOARD DATA:
Leads: ${s.totalLeads} total | ${s.hotLeads} hot | Pipeline $${s.pipelineValue.toLocaleString()}
Gigs: ${s.confirmedGigs} confirmed | Revenue this month $${s.revenueThisMonth.toLocaleString()} | Total booked $${s.revenueTotal.toLocaleString()}
GOB Students: ${s.activeStudents} active / ${s.totalStudents} total

UPCOMING GIGS:
${upcomingGigs || 'None scheduled'}

HOT LEADS:
${hotLeadsList || 'None'}`;
  }

  return { refresh, getStats, getSummaryText, cache: () => _cache };

})();
