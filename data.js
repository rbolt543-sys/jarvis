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
      // Only show demo data if no manual leads exist
      const manualLeads = _getManualLeads();
      if (manualLeads.length === 0) _loadDemoData();
      else {
        _cache.leads    = [];
        _cache.gigs     = _cache.gigs.length ? _cache.gigs : _demoGigs();
        _cache.students = _cache.students.length ? _cache.students : _demoStudents();
        _cache.lastFetch = new Date();
      }
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

  // ── Normalisers — mapped to your exact JARVIS Data sheet columns ──
  // Sheet cols: Timestamp | Name | Source | Type | Note | Stage | Raw_Subject
  function _normLeads(rows) {
    return rows.map(r => ({
      name:    r.name        || r.client_name  || r.contact     || '',
      source:  r.source      || r.platform     || r.origin      || '',
      status:  r.stage       || r.status       || 'New',
      type:    r.type        || r.event_type   || '',
      date:    r.timestamp   || r.date         || r.enquiry_date || r.created || '',
      value:   _parseMoney(r.value || r.budget || r.fee || '0'),
      notes:   r.note        || r.notes        || r.raw_subject  || r.message || '',
      email:   r.email       || '',
      phone:   r.phone       || r.mobile       || '',
    }));
  }

  function _normGigs(rows) {
    return rows.map(r => ({
      name:    r.event   || r.gig        || r.name   || r.client || '',
      date:    r.date    || r.event_date  || r.gig_date || '',
      type:    r.type    || r.event_type  || r.category || '',
      fee:     _parseMoney(r.fee || r.total || r.value || r.revenue || '0'),
      paid:    _parseMoney(r.paid || r.deposit || r.amount_paid || '0'),
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

    // ── Real gig data — scraped from BookLive April 2026 ────
  function _demoGigs() {
    return [
      { name: 'Weekend Getaway Cocktail Party',                    date: '2026-05-02', type: 'Corporate',     fee: 1912, paid: 1912, status: 'Paid In Full',  venue: 'Blue Harbor Resort',                  notes: '' },
      { name: 'A Special Tribute to Bunny',                        date: '2026-05-02', type: 'Private Event', fee: 750,  paid: 750,  status: 'Paid In Full',  venue: 'Three Pillars Senior Living',         notes: '' },
      { name: 'Celebration of Life — Roger Bjerke',                date: '2026-05-05', type: 'Memorial',      fee: 750,  paid: 0,    status: 'Confirmed',     venue: 'Saint Marks EV Lutheran Church',      notes: '' },
      { name: 'Celebration of Life — Dorothy Plehn',               date: '2026-05-09', type: 'Memorial',      fee: 1300, paid: 0,    status: 'Confirmed',     venue: 'Trinity Lutheran Church',             notes: '' },
      { name: 'Glitter and Be Gay: Liberace, Elton & Friends',     date: '2026-05-16', type: 'Tribute Show',  fee: 4000, paid: 0,    status: 'Confirmed',     venue: 'OPE! Brewing Co.',                    notes: '' },
      { name: 'Village at the Square Music',                        date: '2026-05-22', type: 'Senior Living', fee: 250,  paid: 0,    status: 'Confirmed',     venue: 'Three Pillars Village on the Square', notes: '' },
      { name: "Sean's Wedding Extravaganza!!",                      date: '2026-06-06', type: 'Wedding',       fee: 5950, paid: 0,    status: 'Confirmed',     venue: 'Green Bay Distillery',                notes: '' },
      { name: "Kayley & Sean's Beach Wedding Extravaganza",         date: '2026-06-13', type: 'Wedding',       fee: 1695, paid: 0,    status: 'Confirmed',     venue: 'Blue Harbor Resort',                  notes: '' },
      { name: "Abby and Giovanni's Wedding Extravaganza!",          date: '2026-06-20', type: 'Wedding',       fee: 2882, paid: 0,    status: 'Confirmed',     venue: 'Beau Chateau',                        notes: '' },
      { name: "Trek's 50th Anniversary MACC Fund Fundraiser",       date: '2026-06-20', type: 'Corporate',     fee: 4100, paid: 0,    status: 'Confirmed',     venue: '801 W Madison St',                    notes: '' },
      { name: 'Elvis 4th of July Parade',                           date: '2026-07-04', type: 'Parade',        fee: 1695, paid: 350,  status: 'Deposit Paid',  venue: 'Greendale',                           notes: '' },
      { name: "Laura & James' Wedding Extravaganza!",               date: '2026-08-08', type: 'Wedding',       fee: 4000, paid: 750,  status: 'Deposit Paid',  venue: '',                                    notes: '' },
      { name: "McKenzie and Garrett's Wedding Cocktail Celebration",date: '2026-08-15', type: 'Wedding',       fee: 1370, paid: 0,    status: 'Confirmed',     venue: 'Barnwood Events Wisconsin',            notes: '' },
      { name: "Alex and Matt's Amazing Wedding!",                   date: '2026-08-30', type: 'Wedding',       fee: 2294, paid: 0,    status: 'Confirmed',     venue: 'Klehm Arboretum & Botanic Garden',    notes: '' },
    ];
  }
  function _demoStudents() {
    return [
      { name: 'Marcus Webb',  status: 'Active',   joined: '2026-03-01', module: 'Module 4 — Reharmonisation', email: '', source: 'Instagram' },
      { name: 'Diana Chow',   status: 'Active',   joined: '2026-02-15', module: 'Module 6 — Performance',     email: '', source: 'YouTube' },
      { name: 'Robert Palma', status: 'Stalled',  joined: '2026-01-10', module: 'Module 2 — Chord Voicing',   email: '', source: 'GigSalad referral' },
      { name: 'Lena Fischer', status: 'Active',   joined: '2026-04-01', module: 'Module 1 — Foundations',     email: '', source: 'Instagram' },
      { name: 'James Nguyen', status: 'Complete', joined: '2025-12-01', module: 'Complete ✓',                 email: '', source: 'Email list' },
    ];
  }
  function _loadDemoData() {
    _cache.leads    = [
      { name: 'Sarah & Tom Mitchell', source: 'GigSalad',  status: 'Hot Lead',    date: '2026-04-22', value: 2800, notes: 'Wedding June 15, wants Elton tribute', email: '', phone: '' },
      { name: 'Parkview Corp Events', source: 'BookLive',  status: 'Quoted',      date: '2026-04-20', value: 3500, notes: 'Corporate dinner for 120 pax',          email: '', phone: '' },
      { name: 'Jessica Reynolds',     source: 'Instagram', status: 'New',         date: '2026-04-25', value: 0,    notes: 'Interested in GOB course',               email: '', phone: '' },
      { name: 'Grand Hyatt Chicago',  source: 'Referral',  status: 'Negotiating', date: '2026-04-18', value: 4200, notes: "New Year's Eve residency",               email: '', phone: '' },
    ];
    _cache.gigs     = _demoGigs();
    _cache.students = _demoStudents();
    _cache.lastFetch = new Date();
  }

    // ── Quick stats for JARVIS context ───────────
  function getStats() {
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const gigsThisMonth = _cache.gigs.filter(g => g.date.startsWith(thisMonth));
    const revenueThisMonth = gigsThisMonth.reduce((s, g) => s + g.fee, 0);
    const revenueTotal = _cache.gigs.reduce((s, g) => s + g.fee, 0);
    const depositsCollected = _cache.gigs.reduce((s, g) => s + (g.paid || 0), 0);
    const gigsWithDeposit = _cache.gigs.filter(g => (g.paid || 0) > 0);
    const hotLeads = _cache.leads.filter(l => ['Hot Lead', 'Quoted', 'Negotiating'].includes(l.status));
    return {
      totalLeads:        _cache.leads.length,
      hotLeads:          hotLeads.length,
      pipelineValue:     hotLeads.reduce((s, l) => s + l.value, 0),
      confirmedGigs:     _cache.gigs.length,
      gigsWithDeposit:   gigsWithDeposit.length,
      depositsCollected,
      revenueThisMonth,
      revenueTotal,
      activeStudents:    _cache.students.filter(s => s.status === 'Active').length,
      totalStudents:     _cache.students.length,
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

  // ── Manual Leads (localStorage) ──────────────────────────────
  const MANUAL_LEADS_KEY = 'jarvis_manual_leads_v1';

  function _getManualLeads() {
    try { return JSON.parse(localStorage.getItem(MANUAL_LEADS_KEY) || '[]'); }
    catch(_) { return []; }
  }

  function addManualLead(lead) {
    const leads = _getManualLeads();
    lead._id     = 'ml_' + Date.now();
    lead._manual = true;
    lead._added  = new Date().toISOString();
    leads.unshift(lead);
    localStorage.setItem(MANUAL_LEADS_KEY, JSON.stringify(leads));
    // Merge into cache immediately
    _cache.leads = [...leads.map(_normManualLead), ..._cache.leads.filter(l => !l._manual)];
  }

  function deleteManualLead(id) {
    const leads = _getManualLeads().filter(l => l._id !== id);
    localStorage.setItem(MANUAL_LEADS_KEY, JSON.stringify(leads));
    _cache.leads = _cache.leads.filter(l => l._id !== id);
  }

  function _normManualLead(l) {
    return {
      name:    l.name    || '',
      source:  l.source  || '',
      status:  l.status  || 'New',
      type:    l.type    || '',
      date:    l.date    || '',
      value:   l.value   || 0,
      notes:   l.notes   || '',
      email:   l.email   || '',
      phone:   l.phone   || '',
      _manual: true,
      _id:     l._id,
    };
  }

  // Merge manual leads into cache after sheet refresh
  function _mergeManualLeads() {
    const manual = _getManualLeads().map(_normManualLead);
    // Prepend manual leads (most recent first), sheet leads after
    _cache.leads = [...manual, ..._cache.leads.filter(l => !l._manual)];
  }

  return {
    refresh: async () => { await refresh(); _mergeManualLeads(); return _cache; },
    getStats,
    getSummaryText,
    addManualLead,
    deleteManualLead,
    cache: () => _cache,
  };

})();
