import { useState, useEffect, useCallback, useMemo, useRef, useReducer, createContext, useContext } from "react";
import { createPortal } from "react-dom";

// ═══════════════════════════════════════════════════════════════
// WEDIFY v1.0 — Wedding Organizer | Rebranded from Wedify v14
// ═══════════════════════════════════════════════════════════════

const Ctx = createContext(null);
const mkid = () => "x" + Math.random().toString(36).slice(2, 10);
const gCount = (g) => Math.max(1, Number(g?.count) || 1);
const sumGuests = (list) => list.reduce((a, g) => a + gCount(g), 0);
const gTypeLabel = (g) => { const c = gCount(g); if (c === 1) return "Single"; if (c === 2) return "Cuplu"; return `Familie (${c})`; };
const gTypeIcon = (g) => { const c = gCount(g); if (c === 1) return "👤"; if (c === 2) return "👫"; return "👨‍👩‍👧"; };
const fmtD = (d) => { try { return new Date(d).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };
const fmtC = (n) => new Intl.NumberFormat("ro-RO", { style: "currency", currency: "EUR" }).format(n || 0);

const LOGO_SM = "data:image/png;base64,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";
const LOGO_XS = "data:image/png;base64,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";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
:root{
--g:#B8956A;--gl:#DCCBAA;--gd:#8A6D47;
--cr:#FAF6F0;--cr2:#EDE7DD;--iv:#FFFDF8;
--ink:#1A1A1A;--gr:#6B6B6B;--mt:#9A9A9A;--ft:#D2CCC2;
--ok:#6B9E68;--wn:#C9A032;--er:#B85C5C;
--cd:#FFFFFF;--bg:var(--iv);--bd:#E5DFD5;--sh:0 2px 14px rgba(0,0,0,.05);
--r:14px;--rs:10px;--hd:54px;--nv:66px;
--f:'DM Sans',-apple-system,sans-serif;--fd:'Playfair Display',Georgia,serif;
}
[data-theme="dark"]{
--g:#C9A87A;--gl:#E0D0B8;--gd:#B89060;
--cr:#2A2520;--cr2:#332D27;--iv:#1A1816;
--ink:#E8E0D6;--gr:#B0A898;--mt:#7B7370;--ft:#3A3530;
--ok:#7DB87A;--wn:#D4B040;--er:#D07070;
--cd:#22201C;--bg:#1A1816;--bd:#3A3530;--sh:0 2px 14px rgba(0,0,0,.2);
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body,#root{height:100%;width:100%;font-family:var(--f);background:var(--bg);color:var(--ink);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased}
#root{overflow:hidden}
input,select,textarea,button{font-family:var(--f);font-size:15px;border:none;outline:none;background:none;color:var(--ink)}
button{cursor:pointer}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--gl);border-radius:3px}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fu{animation:fadeUp .35s ease-out both}
`;

const ic = {
  home:<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/></svg>,
  users:<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  tbl:<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  wallet:<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  chk:<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  brief:<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
  plus:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  search:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  trash:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  heart:<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  lock:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  ring:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="14" r="7"/><path d="M9.17 7.08L7 2l2.5 2L12 2l2.5 2L17 2l-2.17 5.08"/></svg>,
  logout:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevD:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  mail:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>,
  shield:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  star:<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  starO:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  settings:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  edit:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  moon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  sun:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  tag:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  chevD:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
};

// ─── Supabase Client ──────────────────────────────────────────
// Uses @supabase/ssr for browser client
import { createBrowserClient } from '@supabase/ssr';

let _supabase = null;
function getSupabase() {
  if (_supabase) return _supabase;
  const url = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL;
  const key = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    _supabase = createBrowserClient(url, key);
  }
  return _supabase;
}

// ─── Supabase Data Layer ──────────────────────────────────────
async function loadAllData(userId) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: wedding } = await sb.from('weddings').select('*').eq('user_id', userId).single();
  if (!wedding) return null;
  const [g, t, b, tk, v] = await Promise.all([
    sb.from('guests').select('*').eq('wedding_id', wedding.id).order('created_at'),
    sb.from('tables').select('*').eq('wedding_id', wedding.id).order('sort_order'),
    sb.from('budget_items').select('*').eq('wedding_id', wedding.id).order('created_at'),
    sb.from('tasks').select('*').eq('wedding_id', wedding.id).order('due'),
    sb.from('vendors').select('*').eq('wedding_id', wedding.id).order('created_at'),
  ]);
  return {
    wedding: {
      couple: wedding.couple || '', date: wedding.date || '', venue: wedding.venue || '',
      budget: Number(wedding.budget) || 15000,
    },
    weddingId: wedding.id,
    groups: wedding.groups || ["Familie Mireasă","Familie Mire","Prieteni","Colegi"],
    tags: wedding.tags || ["Copil","Cazare","Parcare","Din alt oraș","Martor","Naș/Nașă"],
    onboarded: wedding.onboarded || false,
    guests: (g.data || []).map(x => ({ ...x, tid: x.table_id, group: x.group, count: x.count || 1 })),
    tables: (t.data || []).map(x => ({ ...x })),
    budget: (b.data || []).map(x => ({ ...x, cat: x.category })),
    tasks: (tk.data || []).map(x => ({ ...x, prio: x.priority })),
    vendors: (v.data || []),
    activity: [{ id: mkid(), msg: "Date încărcate", ts: new Date().toISOString() }],
  };
}

// Supabase sync helper — fire & forget DB writes
const dbSync = {
  async updateWedding(weddingId, data) {
    const sb = getSupabase(); if (!sb || !weddingId) return;
    const mapped = {};
    if (data.couple !== undefined) mapped.couple = data.couple;
    if (data.date !== undefined) mapped.date = data.date;
    if (data.venue !== undefined) mapped.venue = data.venue;
    if (data.budget !== undefined) mapped.budget = data.budget;
    if (data.groups !== undefined) mapped.groups = data.groups;
    if (data.tags !== undefined) mapped.tags = data.tags;
    if (data.onboarded !== undefined) mapped.onboarded = data.onboarded;
    if (data.program !== undefined) mapped.program = data.program;
    if (data.theme !== undefined) mapped.theme = data.theme;
    if (Object.keys(mapped).length > 0) await sb.from('weddings').update(mapped).eq('id', weddingId);
  },
  async addGuest(weddingId, guest) {
    const sb = getSupabase(); if (!sb || !weddingId) return null;
    const { data } = await sb.from('guests').insert({
      wedding_id: weddingId, name: guest.name, group: guest.group || 'Prieteni',
      rsvp: guest.rsvp || 'pending', dietary: guest.dietary || '', tags: guest.tags || [],
      notes: guest.notes || '', table_id: guest.tid || null, count: guest.count || 1,
    }).select().single();
    return data;
  },
  async updateGuest(id, data) {
    const sb = getSupabase(); if (!sb) return;
    const mapped = {};
    if (data.name !== undefined) mapped.name = data.name;
    if (data.group !== undefined) mapped.group = data.group;
    if (data.rsvp !== undefined) mapped.rsvp = data.rsvp;
    if (data.dietary !== undefined) mapped.dietary = data.dietary;
    if (data.tags !== undefined) mapped.tags = data.tags;
    if (data.notes !== undefined) mapped.notes = data.notes;
    if (data.tid !== undefined) mapped.table_id = data.tid;
    if (data.count !== undefined) mapped.count = data.count;
    if (Object.keys(mapped).length > 0) await sb.from('guests').update(mapped).eq('id', id);
  },
  async deleteGuest(id) { const sb = getSupabase(); if (sb) await sb.from('guests').delete().eq('id', id); },
  async addTable(weddingId, table) {
    const sb = getSupabase(); if (!sb || !weddingId) return null;
    const { data } = await sb.from('tables').insert({
      wedding_id: weddingId, name: table.name, seats: table.seats || 8,
      shape: table.shape || 'round', notes: table.notes || '',
    }).select().single();
    return data;
  },
  async updateTable(id, data) {
    const sb = getSupabase(); if (!sb) return;
    const mapped = {};
    if (data.name !== undefined) mapped.name = data.name;
    if (data.seats !== undefined) mapped.seats = data.seats;
    if (data.shape !== undefined) mapped.shape = data.shape;
    if (data.notes !== undefined) mapped.notes = data.notes;
    if (Object.keys(mapped).length > 0) await sb.from('tables').update(mapped).eq('id', id);
  },
  async deleteTable(id) {
    const sb = getSupabase(); if (!sb) return;
    await sb.from('guests').update({ table_id: null }).eq('table_id', id);
    await sb.from('tables').delete().eq('id', id);
  },
  async addBudgetItem(weddingId, item) {
    const sb = getSupabase(); if (!sb || !weddingId) return null;
    const { data } = await sb.from('budget_items').insert({
      wedding_id: weddingId, category: item.cat, planned: item.planned || 0,
      spent: item.spent || 0, vendor: item.vendor || '', status: item.status || 'unpaid', notes: item.notes || '',
    }).select().single();
    return data;
  },
  async updateBudgetItem(id, data) {
    const sb = getSupabase(); if (!sb) return;
    const mapped = {};
    if (data.cat !== undefined) mapped.category = data.cat;
    if (data.planned !== undefined) mapped.planned = data.planned;
    if (data.spent !== undefined) mapped.spent = data.spent;
    if (data.vendor !== undefined) mapped.vendor = data.vendor;
    if (data.status !== undefined) mapped.status = data.status;
    if (data.notes !== undefined) mapped.notes = data.notes;
    if (Object.keys(mapped).length > 0) await sb.from('budget_items').update(mapped).eq('id', id);
  },
  async deleteBudgetItem(id) { const sb = getSupabase(); if (sb) await sb.from('budget_items').delete().eq('id', id); },
  async addTask(weddingId, task) {
    const sb = getSupabase(); if (!sb || !weddingId) return null;
    const { data } = await sb.from('tasks').insert({
      wedding_id: weddingId, title: task.title, due: task.due || null,
      status: task.status || 'pending', priority: task.prio || 'medium', category: task.cat || '',
    }).select().single();
    return data;
  },
  async updateTask(id, data) {
    const sb = getSupabase(); if (!sb) return;
    const mapped = {};
    if (data.title !== undefined) mapped.title = data.title;
    if (data.due !== undefined) mapped.due = data.due || null;
    if (data.status !== undefined) mapped.status = data.status;
    if (data.prio !== undefined) mapped.priority = data.prio;
    if (data.cat !== undefined) mapped.category = data.cat;
    if (Object.keys(mapped).length > 0) await sb.from('tasks').update(mapped).eq('id', id);
  },
  async deleteTask(id) { const sb = getSupabase(); if (sb) await sb.from('tasks').delete().eq('id', id); },
  async addVendor(weddingId, vendor) {
    const sb = getSupabase(); if (!sb || !weddingId) return null;
    const { data } = await sb.from('vendors').insert({
      wedding_id: weddingId, name: vendor.name, category: vendor.category || '',
      phone: vendor.phone || '', email: vendor.email || '', status: vendor.status || 'potential',
      rating: vendor.rating || 0, notes: vendor.notes || '',
    }).select().single();
    return data;
  },
  async updateVendor(id, data) {
    const sb = getSupabase(); if (!sb) return;
    const mapped = { ...data };
    if (Object.keys(mapped).length > 0) await sb.from('vendors').update(mapped).eq('id', id);
  },
  async deleteVendor(id) { const sb = getSupabase(); if (sb) await sb.from('vendors').delete().eq('id', id); },
  async bulkInsertGuests(weddingId, guests) {
    const sb = getSupabase(); if (!sb || !weddingId) return [];
    const rows = guests.map(g => ({
      wedding_id: weddingId, name: g.name, group: g.group || 'Prieteni',
      rsvp: g.rsvp || 'pending', dietary: g.dietary || '', tags: g.tags || [],
      notes: g.notes || '', table_id: g.tid || null,
    }));
    const { data } = await sb.from('guests').insert(rows).select();
    return data || [];
  },
  async bulkInsertTables(weddingId, tables) {
    const sb = getSupabase(); if (!sb || !weddingId) return [];
    const rows = tables.map(t => ({
      wedding_id: weddingId, name: t.name, seats: t.seats || 8,
      shape: t.shape || 'round', notes: t.notes || '',
    }));
    const { data } = await sb.from('tables').insert(rows).select();
    return data || [];
  },
  async bulkInsertBudget(weddingId, items) {
    const sb = getSupabase(); if (!sb || !weddingId) return [];
    const rows = items.map(b => ({
      wedding_id: weddingId, category: b.cat, planned: b.planned || 0,
      spent: b.spent || 0, vendor: b.vendor || '', status: b.status || 'unpaid', notes: b.notes || '',
    }));
    const { data } = await sb.from('budget_items').insert(rows).select();
    return data || [];
  },
  async bulkInsertTasks(weddingId, tasks) {
    const sb = getSupabase(); if (!sb || !weddingId) return [];
    const rows = tasks.map(t => ({
      wedding_id: weddingId, title: t.title, due: t.due || null,
      status: t.status || 'pending', priority: t.prio || 'medium', category: t.cat || '',
    }));
    const { data } = await sb.from('tasks').insert(rows).select();
    return data || [];
  },
};

// Persistence fallback for themes (local only)
async function loadTheme() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return localStorage.getItem("wedify_theme") || "light";
  } catch {}
  return "light";
}
async function saveTheme(t) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem("wedify_theme", t);
  } catch {}
}

// ─── Confirm Dialog ──────────────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 320, background: "var(--cd)", color: "var(--ink)", borderRadius: "var(--r)", padding: "24px 20px", boxShadow: "0 12px 40px rgba(0,0,0,.15)", animation: "fadeUp .25s ease-out both" }}>
        <h4 style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 500, marginBottom: 8 }}>{title || "Confirmare"}</h4>
        <p style={{ fontSize: 13, color: "var(--gr)", marginBottom: 20, lineHeight: 1.5 }}>{message || "Ești sigur? Acțiunea nu poate fi anulată."}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="secondary" onClick={onClose} full>Anulează</Btn>
          <Btn v="danger" onClick={() => { onConfirm(); onClose(); }} full>Șterge</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Toast Notification ──────────────────────────────────────
function Toast({ message, visible, type = "info" }) {
  if (!visible) return null;
  const bg = type === "error" ? "var(--er)" : type === "success" ? "var(--ok)" : "var(--g)";
  return (
    <div style={{
      position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
      zIndex: 3000, padding: "10px 20px", borderRadius: 12,
      background: bg, color: "#fff", fontSize: 13, fontWeight: 600,
      boxShadow: "0 4px 20px rgba(0,0,0,.2)",
      animation: "fadeUp .3s ease-out both",
      maxWidth: "90%", textAlign: "center",
    }}>
      {message}
    </div>
  );
}

// ─── PDF Export Helper ───────────────────────────────────────
function generateGuestsPDF(guests, wedding) {
  const conf = guests.filter(g => g.rsvp === "confirmed");
  const pend = guests.filter(g => g.rsvp === "pending");
  const decl = guests.filter(g => g.rsvp === "declined");
  const groups = {};
  conf.forEach(g => { const k = g.group || "Altele"; if (!groups[k]) groups[k] = []; groups[k].push(g); });

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lista Invitați - ${wedding.couple}</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1a1a1a;max-width:800px;margin:0 auto}
    h1{font-family:Georgia,serif;font-size:28px;font-weight:400;color:#8A6D47;margin-bottom:4px}
    .sub{color:#999;font-size:13px;margin-bottom:30px}
    .stats{display:flex;gap:20px;margin-bottom:30px;padding:16px;background:#FAF6F0;border-radius:10px}
    .stat{text-align:center;flex:1}.stat-v{font-size:24px;font-weight:700;color:#B8956A}.stat-l{font-size:11px;color:#999;text-transform:uppercase}
    h2{font-size:16px;color:#8A6D47;margin:24px 0 10px;border-bottom:1px solid #E5DFD5;padding-bottom:6px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{text-align:left;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.05em;padding:6px 10px;border-bottom:2px solid #E5DFD5}
    td{padding:8px 10px;border-bottom:1px solid #F0EAE0;font-size:13px}
    .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
    .b-conf{background:rgba(107,158,104,.12);color:#6B9E68}
    .b-pend{background:rgba(90,130,180,.12);color:#5A82B4}
    .b-decl{background:rgba(184,92,92,.1);color:#B85C5C}
    .b-diet{background:rgba(212,160,160,.12);color:#B07070;margin-left:4px}
    .footer{margin-top:40px;text-align:center;font-size:11px;color:#ccc}
    @media print{body{padding:20px}.stats{break-inside:avoid}}
  </style></head><body>
  <h1>Lista Invitați</h1>
  <div class="sub">${wedding.couple} · ${fmtD(wedding.date)} · ${wedding.venue}</div>
  <div class="stats">
    <div class="stat"><div class="stat-v">${guests.length}</div><div class="stat-l">Total</div></div>
    <div class="stat"><div class="stat-v">${conf.length}</div><div class="stat-l">Confirmați</div></div>
    <div class="stat"><div class="stat-v">${pend.length}</div><div class="stat-l">Așteptare</div></div>
    <div class="stat"><div class="stat-v">${decl.length}</div><div class="stat-l">Refuz</div></div>
  </div>`;

  Object.entries(groups).forEach(([name, list]) => {
    html += `<h2>${name} (${list.length})</h2><table><tr><th>Nr</th><th>Nume</th><th>Status</th><th>Restricții</th></tr>`;
    list.forEach((g, i) => {
      const sc = g.rsvp === "confirmed" ? "conf" : g.rsvp === "pending" ? "pend" : "decl";
      const sl = g.rsvp === "confirmed" ? "Confirmat" : g.rsvp === "pending" ? "Așteptare" : "Refuzat";
      html += `<tr><td>${i + 1}</td><td><b>${g.name}</b></td><td><span class="badge b-${sc}">${sl}</span></td><td>${g.dietary ? `<span class="badge b-diet">${g.dietary}</span>` : "—"}</td></tr>`;
    });
    html += `</table>`;
  });

  html += `<div class="footer">Generat de Wedify · ${new Date().toLocaleDateString("ro-RO")}</div></body></html>`;
  return html;
}

function generateTablesPDF(tables, guests, wedding) {
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Plan Mese - ${wedding.couple}</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1a1a1a;max-width:800px;margin:0 auto}
    h1{font-family:Georgia,serif;font-size:28px;font-weight:400;color:#8A6D47;margin-bottom:4px}
    .sub{color:#999;font-size:13px;margin-bottom:30px}
    .table-card{border:1px solid #E5DFD5;border-radius:12px;padding:16px;margin-bottom:14px;break-inside:avoid}
    .table-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
    .table-nm{font-size:16px;font-weight:700}.table-info{font-size:12px;color:#999}
    .guest-chip{display:inline-block;padding:4px 12px;margin:3px;border-radius:14px;font-size:12px;background:#FAF6F0;border:1px solid #E5DFD5}
    .diet-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#B85C5C;margin-left:4px;vertical-align:middle}
    .empty{color:#ccc;font-style:italic;font-size:12px}
    .summary{display:flex;gap:20px;margin-bottom:24px;padding:16px;background:#FAF6F0;border-radius:10px}
    .sval{font-size:22px;font-weight:700;color:#B8956A}.slbl{font-size:11px;color:#999;text-transform:uppercase}
    .footer{margin-top:40px;text-align:center;font-size:11px;color:#ccc}
  </style></head><body>
  <h1>Plan Aranjare Mese</h1>
  <div class="sub">${wedding.couple} · ${fmtD(wedding.date)} · ${wedding.venue}</div>
  <div class="summary">
    <div style="flex:1;text-align:center"><div class="sval">${tables.length}</div><div class="slbl">Mese</div></div>
    <div style="flex:1;text-align:center"><div class="sval">${tables.reduce((a, t) => a + t.seats, 0)}</div><div class="slbl">Locuri total</div></div>
    <div style="flex:1;text-align:center"><div class="sval">${guests.filter(g => g.tid).length}</div><div class="slbl">Așezați</div></div>
    <div style="flex:1;text-align:center"><div class="sval">${guests.filter(g => !g.tid && g.rsvp === "confirmed").length}</div><div class="slbl">Nealocați</div></div>
  </div>`;

  tables.forEach(t => {
    const seated = guests.filter(g => g.tid === t.id);
    html += `<div class="table-card"><div class="table-hd"><div><span class="table-nm">${t.name}</span></div><div class="table-info">${t.shape === "round" ? "Rotundă" : "Dreptunghiulară"} · ${seated.length}/${t.seats} locuri</div></div>`;
    if (seated.length > 0) {
      seated.forEach(g => {
        html += `<span class="guest-chip">${g.name}${g.dietary ? '<span class="diet-dot"></span>' : ''}</span>`;
      });
    } else {
      html += `<div class="empty">Niciun invitat alocat</div>`;
    }
    html += `</div>`;
  });

  html += `<div class="footer">Generat de Wedify · ${new Date().toLocaleDateString("ro-RO")}</div></body></html>`;
  return html;
}

function openPDF(html) {
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

// ─── Shared UI ───────────────────────────────────────────────
function Card({children,style,onClick}){return <div onClick={onClick} style={{background:"var(--cd)",color:"var(--ink)",borderRadius:"var(--r)",border:"1px solid var(--bd)",boxShadow:"var(--sh)",padding:14,...style}}>{children}</div>}
function Modal({open,onClose,title,children}){
  const overlayRef=useRef(null);
  useEffect(()=>{
    if(!open)return;
    const prevBodyOverflow=document.body.style.overflow;
    const prevRootOverflow=document.getElementById("root")?.style.overflow;
    document.body.style.overflow="hidden";
    const rootEl=document.getElementById("root");
    if(rootEl)rootEl.style.overflow="hidden";
    return()=>{
      document.body.style.overflow=prevBodyOverflow;
      if(rootEl&&prevRootOverflow!==undefined)rootEl.style.overflow=prevRootOverflow;
    };
  },[open]);
  if(!open||typeof document==="undefined")return null;
  return createPortal(
    <div ref={overlayRef} style={{position:"fixed",inset:0,zIndex:1000,height:"100dvh",display:"flex",flexDirection:"column",justifyContent:"flex-end",overscrollBehavior:"contain"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"relative",width:"100%",maxWidth:460,margin:"0 auto",background:"var(--cd)",color:"var(--ink)",borderRadius:"18px 18px 0 0",padding:"16px 16px calc(20px + env(safe-area-inset-bottom,8px))",maxHeight:"calc(100dvh - 8px)",display:"flex",flexDirection:"column",animation:"slideUp .28s ease-out both",boxShadow:"0 -6px 30px rgba(0,0,0,.12)"}}>
        <div style={{width:28,height:3,background:"var(--ft)",borderRadius:2,margin:"0 auto 10px",flexShrink:0}}/>
        {title&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,paddingBottom:10,borderBottom:"1px solid var(--bd)",flexShrink:0}}><h3 style={{fontFamily:"var(--fd)",fontSize:19,fontWeight:500}}>{title}</h3><button onClick={onClose} style={{padding:5,color:"var(--mt)"}}>{ic.x}</button></div>}
        <div data-ms="1" style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",overscrollBehavior:"contain",touchAction:"pan-y",minHeight:0,paddingBottom:12}}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
function Btn({children,v="primary",onClick,style,disabled,full}){
  const m={primary:{background:"linear-gradient(135deg,var(--g),var(--gd))",color:"#fff",fontWeight:600,boxShadow:"0 3px 12px rgba(184,149,106,.25)"},secondary:{background:"var(--cr)",color:"var(--ink)",border:"1px solid var(--bd)"},danger:{background:"rgba(184,92,92,.08)",color:"var(--er)"},ghost:{background:"transparent",color:"var(--gd)"}};
  return <button disabled={disabled} onClick={onClick} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,padding:"11px 18px",borderRadius:"var(--rs)",fontSize:13,letterSpacing:".02em",transition:"all .2s",opacity:disabled?.4:1,width:full?"100%":"auto",...m[v],...style}}>{children}</button>;
}
function Fld({label,value,onChange,type="text",placeholder,options}){
  const b={width:"100%",padding:"11px 13px",background:"var(--cr)",border:"1.5px solid var(--bd)",borderRadius:"var(--rs)",fontSize:14,color:"var(--ink)"};
  return(<div style={{marginBottom:12}}>
    {label&&<label style={{display:"block",fontSize:10,fontWeight:700,color:"var(--mt)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>{label}</label>}
    {options?<select value={value||""} onChange={e=>onChange(e.target.value)} style={{...b,appearance:"none"}}>{options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}</select>
    :type==="textarea"?<textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{...b,resize:"vertical"}}/>
    :<input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={b}/>}
  </div>);
}
function Badge({children,c="gold"}){const m={gold:{b:"rgba(184,149,106,.1)",c:"var(--gd)"},green:{b:"rgba(107,158,104,.1)",c:"var(--ok)"},red:{b:"rgba(184,92,92,.08)",c:"var(--er)"},blue:{b:"rgba(90,130,180,.1)",c:"#5A82B4"},gray:{b:"rgba(160,160,160,.08)",c:"var(--mt)"},rose:{b:"rgba(212,160,160,.12)",c:"#B07070"}};const s=m[c]||m.gold;return <span style={{display:"inline-flex",padding:"2px 8px",borderRadius:12,fontSize:9,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",background:s.b,color:s.c}}>{children}</span>}
function Stars({v,onChange}){return <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(i=><button key={i} onClick={()=>onChange?.(i)} style={{padding:1,color:i<=v?"var(--g)":"var(--ft)"}}>{i<=v?ic.star:ic.starO}</button>)}</div>}

// ─── AUTH ────────────────────────────────────────────────────
// ─── Auth Screen (Supabase production) ───────────────────────
function AuthScreen({onLogin}){
  const[mode,setMode]=useState("login"); // login | register | forgot | confirm | forgot_sent
  const[email,setEmail]=useState("");
  const[name,setName]=useState("");
  const[pass,setPass]=useState("");
  const[pass2,setPass2]=useState("");
  const[err,setErr]=useState("");
  const[loading,setLoading]=useState(false);
  const[ready,setReady]=useState(false);
  useEffect(()=>{setTimeout(()=>setReady(true),100)},[]);

  const doLogin=async()=>{
    setErr("");const e=email.trim().toLowerCase();
    if(!e)return setErr("Introdu email-ul");
    if(!pass)return setErr("Introdu parola");
    setLoading(true);
    const sb=getSupabase();
    if(!sb){setLoading(false);return setErr("Eroare configurare server. Verifică .env.local.");}
    const{error}=await sb.auth.signInWithPassword({email:e,password:pass});
    setLoading(false);
    if(error){
      if(error.message.includes("Invalid login"))return setErr("Email sau parolă incorectă.");
      if(error.message.includes("Email not confirmed"))return setErr("Contul nu e confirmat. Verifică email-ul.");
      return setErr(error.message);
    }
    // onAuthStateChange in App will handle the rest
  };

  const doRegister=async()=>{
    setErr("");const e=email.trim().toLowerCase();const n=name.trim();
    if(!n)return setErr("Introdu numele tău");
    if(!e)return setErr("Introdu email-ul");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))return setErr("Email invalid");
    if(pass.length<6)return setErr("Parola: minim 6 caractere");
    if(pass!==pass2)return setErr("Parolele nu coincid");
    setLoading(true);
    const sb=getSupabase();
    if(!sb){setLoading(false);return setErr("Eroare configurare server.");}
    const{error}=await sb.auth.signUp({
      email:e,password:pass,
      options:{data:{name:n}}
    });
    setLoading(false);
    if(error){
      if(error.message.includes("already registered"))return setErr("Există deja un cont cu acest email.");
      return setErr(error.message);
    }
    setMode("confirm");
  };

  const doForgot=async()=>{
    setErr("");const e=email.trim().toLowerCase();
    if(!e)return setErr("Introdu email-ul contului");
    setLoading(true);
    const sb=getSupabase();
    if(!sb){setLoading(false);return setErr("Eroare configurare server.");}
    const{error}=await sb.auth.resetPasswordForEmail(e,{
      redirectTo:window.location.origin
    });
    setLoading(false);
    if(error)return setErr(error.message);
    setMode("forgot_sent");
  };

  const inp={width:"100%",padding:"13px 14px",borderRadius:12,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#fff",fontSize:15,marginBottom:10};
  const mBtn={width:"100%",padding:14,borderRadius:12,background:loading?"rgba(184,149,106,.5)":"linear-gradient(135deg,var(--g),var(--gd))",color:"#fff",fontSize:14,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8};
  const spin=<div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .5s linear infinite"}}/>;

  return(
    <div style={{height:"100vh",width:"100%",display:"flex",flexDirection:"column",background:"linear-gradient(155deg,#1A1A1A,#28221C,#1A1A1A)",overflow:"auto",opacity:ready?1:0,transition:"opacity .7s"}}>
      <div style={{position:"absolute",top:-50,right:-50,width:180,height:180,background:"radial-gradient(circle,rgba(184,149,106,.12),transparent 70%)",borderRadius:"50%"}}/>
      <div style={{flex:"0 0 auto",padding:"50px 28px 0",textAlign:"center",position:"relative",zIndex:1}}>
        <img src={LOGO_SM} alt="Wedify" style={{width:120,height:120,objectFit:"contain",marginBottom:6}} />
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"20px 22px",position:"relative",zIndex:1}}>
        <div style={{background:"rgba(255,255,255,.035)",backdropFilter:"blur(16px)",borderRadius:18,padding:"24px 20px",border:"1px solid rgba(255,255,255,.05)"}}>

          {mode==="login"&&<>
            <h2 style={{fontFamily:"var(--fd)",fontSize:20,color:"#fff",textAlign:"center",marginBottom:20}}>Conectare</h2>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={inp} autoComplete="email"/>
            <input value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="Parola" type="password" style={inp} autoComplete="current-password"/>
            {err&&<div style={{padding:"8px 12px",borderRadius:10,marginBottom:10,background:"rgba(184,92,92,.12)",color:"#E88",fontSize:12,animation:"shake .3s"}}>{err}</div>}
            <button onClick={doLogin} disabled={loading} style={mBtn}>{loading&&spin}Intră</button>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
              <button onClick={()=>{setMode("forgot");setErr("")}} style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>Am uitat parola</button>
              <button onClick={()=>{setMode("register");setErr("");setPass("");setPass2("")}} style={{fontSize:12,color:"var(--gl)",opacity:.6}}>Creează cont →</button>
            </div>
          </>}

          {mode==="register"&&<>
            <button onClick={()=>{setMode("login");setErr("")}} style={{color:"var(--gl)",fontSize:12,marginBottom:12,opacity:.7}}>← Conectare</button>
            <h2 style={{fontFamily:"var(--fd)",fontSize:20,color:"#fff",textAlign:"center",marginBottom:16}}>Creare cont</h2>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Numele tău complet" type="text" style={inp} autoComplete="name"/>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={inp} autoComplete="email"/>
            <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Parolă (min 6 caractere)" type="password" style={inp} autoComplete="new-password"/>
            <input value={pass2} onChange={e=>setPass2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doRegister()} placeholder="Confirmă parola" type="password" style={inp} autoComplete="new-password"/>
            {err&&<div style={{padding:"8px 12px",borderRadius:10,marginBottom:10,background:"rgba(184,92,92,.12)",color:"#E88",fontSize:12,animation:"shake .3s"}}>{err}</div>}
            <button onClick={doRegister} disabled={loading} style={mBtn}>{loading&&spin}Creează contul</button>
          </>}

          {mode==="confirm"&&<>
            <div style={{textAlign:"center",padding:"12px 0"}}>
              <div style={{fontSize:36,marginBottom:10}}>📧</div>
              <h2 style={{fontFamily:"var(--fd)",fontSize:20,color:"#fff",marginBottom:8}}>Verifică email-ul</h2>
              <p style={{fontSize:13,color:"rgba(255,255,255,.4)",marginBottom:6}}>Am trimis un link de confirmare la:</p>
              <p style={{fontSize:14,color:"var(--gl)",fontWeight:600,marginBottom:18}}>{email}</p>
              <p style={{fontSize:11,color:"rgba(255,255,255,.3)",marginBottom:18}}>Verifică și folderul Spam.</p>
              <button onClick={()=>{setMode("login");setErr("");setPass("")}} style={mBtn}>Mergi la conectare</button>
            </div>
          </>}

          {mode==="forgot"&&<>
            <button onClick={()=>{setMode("login");setErr("")}} style={{color:"var(--gl)",fontSize:12,marginBottom:12,opacity:.7}}>← Conectare</button>
            <h2 style={{fontFamily:"var(--fd)",fontSize:20,color:"#fff",textAlign:"center",marginBottom:16}}>Resetare parolă</h2>
            <p style={{fontSize:12,color:"rgba(255,255,255,.35)",textAlign:"center",marginBottom:14}}>Introdu emailul contului tău</p>
            <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doForgot()} placeholder="Email" type="email" style={inp}/>
            {err&&<div style={{padding:"8px 12px",borderRadius:10,marginBottom:10,background:"rgba(184,92,92,.12)",color:"#E88",fontSize:12}}>{err}</div>}
            <button onClick={doForgot} disabled={loading} style={mBtn}>{loading&&spin}Trimite link de resetare</button>
          </>}

          {mode==="forgot_sent"&&<>
            <div style={{textAlign:"center",padding:"12px 0"}}>
              <div style={{fontSize:36,marginBottom:10}}>🔑</div>
              <h2 style={{fontFamily:"var(--fd)",fontSize:20,color:"#fff",marginBottom:8}}>Email trimis!</h2>
              <p style={{fontSize:13,color:"rgba(255,255,255,.4)",marginBottom:18}}>Verifică inbox-ul pentru linkul de resetare.</p>
              <button onClick={()=>{setMode("login");setErr("");setPass("")}} style={mBtn}>Mergi la conectare</button>
            </div>
          </>}

        </div>
      </div>
      <div style={{padding:"8px 22px 20px",textAlign:"center",fontSize:10,color:"rgba(255,255,255,.18)"}}>Wedify · Wedding Organizer</div>
    </div>
  );
}

// ─── Access Manager ──────────────────────────────────────────
function AccessMgr({open,onClose,whitelist,setWhitelist}){
  const[ne,setNe]=useState("");const[nn,setNn]=useState("");
  const add=()=>{const e=ne.trim().toLowerCase();if(!e||whitelist.some(w=>w.email===e))return;setWhitelist([...whitelist,{email:e,name:nn||e.split("@")[0]}]);setNe("");setNn("")};
  return(<Modal open={open} onClose={onClose} title="Gestionare Acces">
    <div style={{fontSize:12,color:"var(--mt)",marginBottom:14}}>Persoanele adăugate aici pot accesa aplicația. La prima conectare își setează parola.</div>
    <div style={{display:"flex",gap:6,marginBottom:6}}>
      <input value={ne} onChange={e=>setNe(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="email@exemplu.ro" style={{flex:1,padding:"10px 12px",borderRadius:"var(--rs)",background:"var(--cr)",border:"1.5px solid var(--bd)",fontSize:13}}/>
      <button onClick={add} style={{width:38,height:38,borderRadius:"var(--rs)",background:"var(--g)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{ic.plus}</button>
    </div>
    <input value={nn} onChange={e=>setNn(e.target.value)} placeholder="Nume (opțional)" style={{width:"100%",padding:"10px 12px",marginBottom:14,borderRadius:"var(--rs)",background:"var(--cr)",border:"1.5px solid var(--bd)",fontSize:13}}/>
    <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"var(--mt)",marginBottom:8}}>Persoane ({whitelist.length})</div>
    {whitelist.map((w,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:i?"1px solid var(--bd)":"none"}}>
        <div style={{width:30,height:30,borderRadius:"50%",background:"var(--cr2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--gd)",flexShrink:0}}>{w.name?.[0]?.toUpperCase()||"?"}</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600}}>{w.name}</div><div style={{fontSize:11,color:"var(--mt)"}}>{w.email}</div></div>
        <button onClick={()=>setWhitelist(whitelist.filter((_,j)=>j!==i))} style={{padding:4,color:"var(--ft)"}}>{ic.trash}</button>
      </div>
    ))}
  </Modal>);
}

// ─── Wedding Settings ────────────────────────────────────────
function SettingsModal({open,onClose}){
  const{s,d,theme,setTheme}=useContext(Ctx);
  const[f,setF]=useState({});
  useEffect(()=>{if(open)setF({...s.wedding})},[open]);
  const u=k=>v=>setF(x=>({...x,[k]:v}));
  const[groups,setGroups]=useState(()=>s.groups||["Familie Mireasă","Familie Mire","Prieteni","Colegi"]);
  const[tags,setTags]=useState(()=>s.tags||["Copil","Cazare","Parcare","Din alt oraș","Martor","Naș/Nașă"]);
  const[newG,setNewG]=useState("");
  const[newT,setNewT]=useState("");
  const addG=()=>{const g=newG.trim();if(g&&!groups.includes(g)){setGroups([...groups,g]);setNewG("")}};
  const addT=()=>{const t=newT.trim();if(t&&!tags.includes(t)){setTags([...tags,t]);setNewT("")}};
  return(<Modal open={open} onClose={onClose} title="Setări">
    {/* Dark mode toggle */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",marginBottom:12,borderBottom:"1px solid var(--bd)"}}>
      <div>
        <div style={{fontSize:13,fontWeight:600}}>Mod întunecat</div>
        <div style={{fontSize:11,color:"var(--mt)"}}>Schimbă tema aplicației</div>
      </div>
      <button onClick={()=>{const n=theme==="dark"?"light":"dark";setTheme(n);saveTheme(n)}} style={{width:48,height:28,borderRadius:14,background:theme==="dark"?"var(--g)":"var(--cr2)",border:"1px solid var(--bd)",position:"relative",transition:"all .2s"}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:"var(--cd)",position:"absolute",top:2,left:theme==="dark"?23:2,transition:"left .2s",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {theme==="dark"?ic.moon:ic.sun}
        </div>
      </button>
    </div>

    <Fld label="Numele mirilor" value={f.couple} onChange={u("couple")} placeholder="Alexandra & Mihai"/>
    <Fld label="Data nunții" value={f.date} onChange={u("date")} type="date"/>
    <Fld label="Locația" value={f.venue} onChange={u("venue")} placeholder="Palatul Mogoșoaia"/>
    <Fld label="Buget total (€)" value={f.budget} onChange={v=>u("budget")(parseFloat(v)||0)} type="number"/>
    
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:10,fontWeight:700,color:"var(--mt)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Grupuri invitați</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
        {groups.map((g,i)=>(
          <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:14,fontSize:12,background:"var(--cr)",border:"1px solid var(--bd)"}}>
            {g}<button onClick={()=>setGroups(groups.filter((_,j)=>j!==i))} style={{padding:1,color:"var(--mt)",display:"flex"}}>{ic.x}</button>
          </span>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        <input value={newG} onChange={e=>setNewG(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addG()} placeholder="Grup nou..." style={{flex:1,padding:"9px 11px",borderRadius:"var(--rs)",background:"var(--cr)",border:"1.5px solid var(--bd)",fontSize:13}}/>
        <button onClick={addG} style={{width:36,height:36,borderRadius:"var(--rs)",background:"var(--g)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{ic.plus}</button>
      </div>
    </div>

    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:10,fontWeight:700,color:"var(--mt)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Tag-uri disponibile</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
        {tags.map((t,i)=>(
          <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:12,fontSize:11,background:"var(--cr)",border:"1px solid var(--bd)"}}>
            {t}<button onClick={()=>setTags(tags.filter((_,j)=>j!==i))} style={{padding:1,color:"var(--mt)",display:"flex"}}>{ic.x}</button>
          </span>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        <input value={newT} onChange={e=>setNewT(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addT()} placeholder="Tag nou..." style={{flex:1,padding:"9px 11px",borderRadius:"var(--rs)",background:"var(--cr)",border:"1.5px solid var(--bd)",fontSize:13}}/>
        <button onClick={addT} style={{width:36,height:36,borderRadius:"var(--rs)",background:"var(--g)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{ic.plus}</button>
      </div>
    </div>

    <Btn full onClick={()=>{d({type:"SET",p:{wedding:f,groups,tags}});onClose()}}>Salvează</Btn>

    {/* Logout */}
    <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid var(--bd)"}}>
      <button onClick={async()=>{
        if(confirm("Sigur vrei să te deconectezi?")){
          const sb=getSupabase();
          if(sb) await sb.auth.signOut();
          window.location.reload();
        }
      }} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 16px",borderRadius:"var(--rs)",background:"rgba(184,92,92,.06)",border:"1.5px solid rgba(184,92,92,.15)",color:"var(--er)",fontSize:13,fontWeight:600,transition:"all .15s"}}>
        {ic.logout} Deconectare
      </button>
      <div style={{textAlign:"center",marginTop:8,fontSize:10,color:"var(--mt)"}}>Wedify v1.0 · Wedding Organizer</div>
    </div>
  </Modal>);
}

// ═══════════════════════════════════════════════════════════════
// DATA + REDUCER
// ═══════════════════════════════════════════════════════════════
const DATA = {
  wedding:{couple:"Alexandra & Mihai",date:"2026-09-12",venue:"Palatul Mogoșoaia",budget:25000},
  groups:["Familie Mireasă","Familie Mire","Prieteni","Colegi"],
  tags:["Copil","Cazare","Parcare","Din alt oraș","Martor","Naș/Nașă","Vegetarian","Plus one"],
  onboarded: true,
  activity: [],
  guests:[
    {id:"g1",name:"Maria Popescu",group:"Familie Mireasă",rsvp:"confirmed",dietary:"vegetarian",tid:null,notes:"",tags:["Vegetarian"]},
    {id:"g2",name:"Ion Ionescu",group:"Familie Mire",rsvp:"confirmed",dietary:"",tid:null,notes:"",tags:["Naș/Nașă"]},
    {id:"g3",name:"Elena Dragomir",group:"Prieteni",rsvp:"pending",dietary:"vegan",tid:null,notes:"",tags:["Din alt oraș","Cazare"]},
    {id:"g4",name:"Andrei Vasile",group:"Colegi",rsvp:"confirmed",dietary:"",tid:null,notes:"",tags:[]},
    {id:"g5",name:"Cristina Marin",group:"Familie Mireasă",rsvp:"declined",dietary:"",tid:null,notes:"",tags:[]},
    {id:"g6",name:"Vlad Radu",group:"Prieteni",rsvp:"confirmed",dietary:"",tid:null,notes:"",tags:["Plus one"]},
    {id:"g7",name:"Ana Stoica",group:"Familie Mire",rsvp:"confirmed",dietary:"",tid:null,notes:"",tags:["Martor"]},
    {id:"g8",name:"George Popa",group:"Colegi",rsvp:"pending",dietary:"",tid:null,notes:"",tags:[]},
    {id:"g9",name:"Diana Florea",group:"Prieteni",rsvp:"confirmed",dietary:"pescetarian",tid:null,notes:"",tags:["Din alt oraș"]},
    {id:"g10",name:"Bogdan Neagu",group:"Familie Mireasă",rsvp:"confirmed",dietary:"",tid:null,notes:"",tags:[]},
    {id:"g11",name:"Roxana Tudor",group:"Prieteni",rsvp:"confirmed",dietary:"",tid:null,notes:"",tags:["Copil"]},
    {id:"g12",name:"Mihai D.",group:"Colegi",rsvp:"confirmed",dietary:"",tid:null,notes:"",tags:[]},
  ],
  tables:[
    {id:"t1",name:"Masa Mirilor",seats:6,shape:"rectangular",notes:""},
    {id:"t2",name:"Masa 1",seats:8,shape:"round",notes:""},
    {id:"t3",name:"Masa 2",seats:8,shape:"round",notes:""},
    {id:"t4",name:"Masa 3",seats:10,shape:"rectangular",notes:""},
  ],
  budget:[
    {id:"b1",cat:"Locație",planned:5000,spent:4500,vendor:"Palatul Mogoșoaia",status:"paid",notes:""},
    {id:"b2",cat:"Catering",planned:8000,spent:3000,vendor:"Chef's Table",status:"partial",notes:""},
    {id:"b3",cat:"Fotograf",planned:2500,spent:1000,vendor:"ArtStudio",status:"partial",notes:""},
    {id:"b4",cat:"Muzică",planned:2000,spent:0,vendor:"",status:"unpaid",notes:""},
    {id:"b5",cat:"Floristică",planned:1500,spent:1500,vendor:"Flora Design",status:"paid",notes:""},
    {id:"b6",cat:"Rochie",planned:3000,spent:2800,vendor:"Bridal House",status:"paid",notes:""},
  ],
  tasks:[
    {id:"tk1",title:"Confirmă meniu final",due:"2026-08-01",status:"pending",prio:"high",cat:"Catering"},
    {id:"tk2",title:"Probă rochie finală",due:"2026-08-15",status:"pending",prio:"high",cat:"Rochie"},
    {id:"tk3",title:"Trimite invitațiile",due:"2026-07-01",status:"done",prio:"medium",cat:"Invitații"},
    {id:"tk4",title:"Alege DJ-ul",due:"2026-06-15",status:"pending",prio:"medium",cat:"Muzică"},
    {id:"tk5",title:"Comandă tort",due:"2026-08-20",status:"pending",prio:"low",cat:"Catering"},
    {id:"tk6",title:"Aranjament floral",due:"2026-09-01",status:"pending",prio:"high",cat:"Floristică"},
  ],
  vendors:[
    {id:"v1",name:"Palatul Mogoșoaia",cat:"Locație",phone:"+40212345678",email:"events@mogos.ro",status:"contracted",rating:5,notes:"Contract semnat"},
    {id:"v2",name:"Chef's Table",cat:"Catering",phone:"+40723456789",email:"info@chefs.ro",status:"contracted",rating:4,notes:""},
    {id:"v3",name:"ArtStudio Pro",cat:"Fotograf",phone:"",email:"",status:"contracted",rating:5,notes:"Foto+video"},
    {id:"v4",name:"DJ MaxBeat",cat:"Muzică",phone:"+40756789012",email:"",status:"negotiating",rating:3,notes:""},
  ],
};

function reducer(s, a) {
  const p = a.p;
  const log = (msg) => [{ id: mkid(), msg, ts: new Date().toISOString() }, ...(s.activity || []).slice(0, 49)];
  switch (a.type) {
    case "SET": return { ...s, ...p };
    case "ADD_GUEST": return { ...s, guests: [...s.guests, p], activity: log(`${p.name} adăugat`) };
    case "UPD_GUEST": {
      const old = s.guests.find(g => g.id === p.id);
      let guests = s.guests.map(g => {
        if (g.id !== p.id) return g;
        const updated = { ...g, ...p };
        // Smart table management on RSVP change
        if (p.rsvp && p.rsvp !== g.rsvp) {
          if (p.rsvp !== "confirmed" && g.tid) {
            // Moving away from confirmed → save table & unseat
            updated.lastTid = g.tid;
            updated.tid = null;
          } else if (p.rsvp === "confirmed" && !g.tid && g.lastTid) {
            // Coming back to confirmed → restore saved table if there's room
            const tableStillExists = s.tables.some(t => t.id === g.lastTid);
            if (tableStillExists) {
              const seatedCount = s.guests.filter(x => x.tid === g.lastTid && x.id !== g.id).length;
              const tableSeats = s.tables.find(t => t.id === g.lastTid)?.seats || 0;
              if (seatedCount < tableSeats) {
                updated.tid = g.lastTid;
              }
            }
            updated.lastTid = null;
          }
        }
        return updated;
      });
      return { ...s, guests, activity: log(`${old?.name || "Invitat"} actualizat`) };
    }
    case "DEL_GUEST": { const old = s.guests.find(g => g.id === p); return { ...s, guests: s.guests.filter(g => g.id !== p), activity: log(`${old?.name || "Invitat"} șters`) }; }
    case "ADD_TABLE": return { ...s, tables: [...s.tables, p], activity: log(`${p.name} creată`) };
    case "UPD_TABLE": return { ...s, tables: s.tables.map(t => t.id === p.id ? { ...t, ...p } : t), activity: log(`Masă actualizată`) };
    case "DEL_TABLE": return { ...s, tables: s.tables.filter(t => t.id !== p), guests: s.guests.map(g => g.tid === p ? { ...g, tid: null } : g), activity: log(`Masă ștearsă`) };
    case "SEAT": { const g = s.guests.find(x => x.id === p.gid); const t = s.tables.find(x => x.id === p.tid); return { ...s, guests: s.guests.map(x => x.id === p.gid ? { ...x, tid: p.tid } : x), activity: log(`${g?.name} → ${t?.name}`) }; }
    case "UNSEAT": { const g = s.guests.find(x => x.id === p); return { ...s, guests: s.guests.map(x => x.id === p ? { ...x, tid: null } : x), activity: log(`${g?.name} scos de la masă`) }; }
    case "MOVE_SEAT": { const g = s.guests.find(x => x.id === p.gid); const t = s.tables.find(x => x.id === p.tid); return { ...s, guests: s.guests.map(x => x.id === p.gid ? { ...x, tid: p.tid } : x), activity: log(`${g?.name} mutat → ${t?.name}`) }; }
    case "ADD_BUDGET": return { ...s, budget: [...s.budget, p], activity: log(`Buget: ${p.cat} adăugat`) };
    case "UPD_BUDGET": return { ...s, budget: s.budget.map(b => b.id === p.id ? { ...b, ...p } : b) };
    case "DEL_BUDGET": { const old = s.budget.find(b => b.id === p); return { ...s, budget: s.budget.filter(b => b.id !== p), activity: log(`Buget: ${old?.cat} șters`) }; }
    case "ADD_TASK": return { ...s, tasks: [...s.tasks, p], activity: log(`Task: ${p.title} adăugat`) };
    case "UPD_TASK": return { ...s, tasks: s.tasks.map(t => t.id === p.id ? { ...t, ...p } : t) };
    case "DEL_TASK": { const old = s.tasks.find(t => t.id === p); return { ...s, tasks: s.tasks.filter(t => t.id !== p), activity: log(`Task: ${old?.title} șters`) }; }
    case "IMPORT_GUESTS": return { ...s, guests: [...s.guests, ...p], activity: log(`${p.length} invitați importați`) };
    case "SET_GUESTS_IMPORTED": return { ...s, guests: [...s.guests.filter(g => !p.some(ng => ng.name === g.name)), ...p] };
    default: return s;
  }
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function Home() {
  const { s, setShowSettings } = useContext(Ctx);
  const days = Math.max(0, Math.ceil((new Date(s.wedding.date) - new Date()) / 864e5));
  const conf = s.guests.filter(g => g.rsvp === "confirmed").length;
  const pend = s.guests.filter(g => g.rsvp === "pending").length;
  const decl = s.guests.filter(g => g.rsvp === "declined").length;
  const confPpl = sumGuests(s.guests.filter(g => g.rsvp === "confirmed"));
  const tP = s.budget.reduce((a, b) => a + b.planned, 0);
  const tS = s.budget.reduce((a, b) => a + b.spent, 0);
  const bP = tP > 0 ? Math.round((tS / tP) * 100) : 0;
  const doneT = s.tasks.filter(t => t.status === "done").length;
  const seated = s.guests.filter(g => g.tid).length;
  const seatedConfPpl = sumGuests(s.guests.filter(g => g.tid && g.rsvp === "confirmed"));
  const urgent = s.tasks.filter(t => t.prio === "high" && t.status !== "done");
  const overdue = s.tasks.filter(t => new Date(t.due) < new Date() && t.status !== "done").length;
  const paidC = s.budget.filter(b => b.status === "paid").length;
  const partC = s.budget.filter(b => b.status === "partial").length;
  const unpC = s.budget.filter(b => b.status === "unpaid").length;
  const costPerGuest = confPpl > 0 ? Math.round(tP / confPpl) : 0;

  return (
    <div className="fu" style={{ padding: "4px 14px 24px" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(145deg,var(--cd),var(--cr))", borderRadius: "var(--r)", padding: "18px 16px", marginBottom: 12, position: "relative", overflow: "hidden", border: "1px solid var(--bd)", boxShadow: "var(--sh)" }}>
        <div style={{ position: "absolute", top: -45, right: -35, width: 150, height: 150, background: "radial-gradient(circle,rgba(184,149,106,.2),transparent 70%)", borderRadius: "50%" }} />
        <button onClick={() => setShowSettings(true)} style={{ position: "absolute", top: 10, right: 10, padding: 5, color: "var(--mt)", zIndex: 2 }}>{ic.edit}</button>
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}><span style={{ color: "var(--g)" }}>{ic.heart}</span><span style={{ fontSize: 9, color: "var(--gd)", textTransform: "uppercase", letterSpacing: ".15em", fontWeight: 700 }}>Countdown</span></div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 44, fontWeight: 500, color: "var(--gd)", lineHeight: 1 }}>{days}</div>
          <div style={{ fontSize: 12, color: "var(--mt)", marginBottom: 10 }}>zile rămase</div>
          <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 600 }}>{s.wedding.couple}</div>
          <div style={{ fontSize: 11, color: "var(--gr)", marginTop: 2 }}>{fmtD(s.wedding.date)} · {s.wedding.venue}</div>
        </div>
      </div>

      {/* Stats */}
      {/* Overdue warning banner */}
      {overdue > 0 && <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: "var(--r)", background: "rgba(184,92,92,.08)", border: "1.5px solid rgba(184,92,92,.2)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(184,92,92,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>⚠</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--er)" }}>{overdue} task-uri depășite</div>
          <div style={{ fontSize: 11, color: "var(--gr)" }}>Verifică secțiunea Tasks pentru detalii</div>
        </div>
      </div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { l: "Confirmați", v: conf, sub: `${pend} așteptare · ${decl} refuz`, cl: "var(--ok)" },
          { l: "Așezați", v: `${seatedConfPpl}/${confPpl}`, sub: `${Math.max(confPpl - seatedConfPpl, 0)} rămași`, cl: "var(--g)" },
          { l: "Tasks", v: `${Math.round((doneT / Math.max(s.tasks.length, 1)) * 100)}%`, sub: `${doneT}/${s.tasks.length} gata`, cl: overdue > 0 ? "var(--er)" : "var(--ok)" },
          { l: "Total invitați", v: s.guests.length, sub: `${sumGuests(s.guests)} persoane · ${s.guests.filter(g => g.dietary).length} cu restricții`, cl: "var(--g)" },
          { l: "Cost/persoană", v: fmtC(costPerGuest), sub: `buget ${fmtC(tP)} / ${confPpl} pers. confirmate`, cl: "var(--gd)" },
        ].map((x, i) => (
          <Card key={i} style={{ padding: "12px 10px" }}>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 5 }}>{x.l}</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 500, color: x.cl, lineHeight: 1.1 }}>{x.v}</div>
            <div style={{ fontSize: 10, color: "var(--mt)", marginTop: 1 }}>{x.sub}</div>
          </Card>
        ))}
      </div>

      {/* Budget dashboard — ENHANCED */}
      <Card style={{ marginBottom: 12, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Buget</span>
          <span style={{ fontFamily: "var(--fd)", fontSize: 20, color: bP > 90 ? "var(--er)" : "var(--g)" }}>{bP}%</span>
        </div>
        <div style={{ height: 8, background: "var(--cr2)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", borderRadius: 4, width: `${Math.min(bP, 100)}%`, background: bP > 90 ? "linear-gradient(90deg,var(--wn),var(--er))" : "linear-gradient(90deg,var(--gl),var(--g))", transition: "width 1s" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Cheltuit</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 17, fontWeight: 500, color: "var(--g)" }}>{fmtC(tS)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Planificat</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 17, fontWeight: 500, color: "var(--ink)" }}>{fmtC(tP)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Rămas</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 17, fontWeight: 500, color: tP - tS >= 0 ? "var(--ok)" : "var(--er)" }}>{fmtC(tP - tS)}</div>
          </div>
        </div>
        {/* Status chips */}
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: "rgba(107,158,104,.08)", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ok)" }}>{paidC}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>plătite</div>
          </div>
          <div style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: "rgba(90,130,180,.08)", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#5A82B4" }}>{partC}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>parțial</div>
          </div>
          <div style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: "rgba(160,160,160,.06)", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mt)" }}>{unpC}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>neplătite</div>
          </div>
        </div>
        {/* Top categories */}
        <div style={{ marginTop: 10 }}>
          {s.budget.slice(0, 3).map(b => {
            const p = Math.round((b.spent / Math.max(b.planned, 1)) * 100);
            return (<div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <span style={{ fontSize: 11, flex: 1, fontWeight: 500 }}>{b.cat}</span>
              <div style={{ width: 60, height: 4, background: "var(--cr2)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 2, width: `${Math.min(p, 100)}%`, background: p > 100 ? "var(--er)" : "var(--g)" }} /></div>
              <span style={{ fontSize: 10, color: "var(--mt)", minWidth: 32, textAlign: "right" }}>{p}%</span>
            </div>);
          })}
        </div>
      </Card>

      {/* Urgent */}
      {urgent.length > 0 && <Card>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Urgente</div>
        {urgent.slice(0, 4).map((t, i) => <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: i ? "1px solid var(--bd)" : "none" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--er)", flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div><div style={{ fontSize: 10, color: "var(--mt)" }}>{fmtD(t.due)}</div></div></div>)}
      </Card>}

      {/* Export buttons */}
      <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 10 }}>Export</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="secondary" onClick={() => openPDF(generateGuestsPDF(s.guests, s.wedding))} style={{ flex: 1, fontSize: 11, padding: "9px 12px" }}>📄 Lista invitați</Btn>
          <Btn v="secondary" onClick={() => openPDF(generateTablesPDF(s.tables, s.guests, s.wedding))} style={{ flex: 1, fontSize: 11, padding: "9px 12px" }}>📄 Plan mese</Btn>
        </div>
      </Card>

      {/* Activity log */}
      {(s.activity || []).length > 0 && <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Activitate recentă</div>
        {(s.activity || []).slice(0, 8).map((a, i) => {
          const ago = Math.round((Date.now() - new Date(a.ts).getTime()) / 60000);
          const agoText = ago < 1 ? "acum" : ago < 60 ? `${ago}m` : ago < 1440 ? `${Math.round(ago / 60)}h` : `${Math.round(ago / 1440)}z`;
          return (<div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: i ? "1px solid var(--bd)" : "none" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--g)", flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, color: "var(--gr)" }}>{a.msg}</div>
            <div style={{ fontSize: 10, color: "var(--ft)", flexShrink: 0 }}>{agoText}</div>
          </div>);
        })}
      </Card>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GUESTS — with configurable groups
// ═══════════════════════════════════════════════════════════════
function Guests() {
  const { s, d } = useContext(Ctx);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [qn, setQn] = useState("");
  const [qg, setQg] = useState(s.groups?.[0] || "Prieteni");
  const [qType, setQType] = useState("single");
  const [qFamilySize, setQFamilySize] = useState(3);
  const [confirmDel, setConfirmDel] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const ref = useRef(null);
  const groups = s.groups || ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"];

  const list = useMemo(() => {
    let l = s.guests;
    if (filter !== "all") l = l.filter(g => g.rsvp === filter);
    if (tagFilter) l = l.filter(g => (g.tags || []).includes(tagFilter));
    if (search) l = l.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    return l;
  }, [s.guests, filter, search, tagFilter]);

  const grouped = useMemo(() => { const g = {}; list.forEach(x => { const k = x.group || "Altele"; if (!g[k]) g[k] = []; g[k].push(x) }); return g }, [list]);
  const st = { total: s.guests.length, conf: s.guests.filter(g => g.rsvp === "confirmed").length, pend: s.guests.filter(g => g.rsvp === "pending").length, totalPpl: sumGuests(s.guests), confPpl: sumGuests(s.guests.filter(g => g.rsvp === "confirmed")), pendPpl: sumGuests(s.guests.filter(g => g.rsvp === "pending")) };
  const groupStats = useMemo(() => { const gs = {}; s.guests.forEach(g => { const k = g.group || "Altele"; gs[k] = (gs[k] || 0) + 1 }); return Object.entries(gs).map(([name, count]) => ({ name, count, pct: Math.round((count / Math.max(s.guests.length, 1)) * 100) })); }, [s.guests]);
  const allTags = useMemo(() => { const t = new Set(s.tags || []); s.guests.forEach(g => (g.tags || []).forEach(tag => t.add(tag))); return [...t]; }, [s.guests, s.tags]);
  const gCl = ["#B8956A","#8BA888","#D4A0A0","#5A82B4","#C9A032","#9A9A9A","#A088B8","#B85C5C"];

  const quickCount = qType === "couple" ? 2 : qType === "family" ? Math.max(3, Number(qFamilySize) || 3) : 1;
  const quickAdd = () => { const n = qn.trim(); if (!n) return; d({ type: "ADD_GUEST", p: { id: mkid(), name: n, group: qg, rsvp: "pending", dietary: "", tid: null, notes: "", tags: [], count: quickCount } }); setQn(""); ref.current?.focus() };
  const cycleRsvp = g => { const nx = { pending: "confirmed", confirmed: "declined", declined: "pending" }; d({ type: "UPD_GUEST", p: { id: g.id, rsvp: nx[g.rsvp] } }) };

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {[{ l: "Total", v: st.total, ppl: st.totalPpl, f: "all" }, { l: "Conf.", v: st.conf, ppl: st.confPpl, f: "confirmed" }, { l: "Aștept.", v: st.pend, ppl: st.pendPpl, f: "pending" }].map(x => (
          <button key={x.f} onClick={() => setFilter(f => f === x.f ? "all" : x.f)} style={{ padding: "6px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600, background: filter === x.f ? "var(--ink)" : "var(--cd)", color: filter === x.f ? "var(--bg)" : "var(--mt)", border: `1px solid ${filter === x.f ? "var(--ink)" : "var(--bd)"}` }}>
            {x.l} <span style={{ fontFamily: "var(--fd)", fontSize: 14, marginLeft: 3 }}>{x.v}</span>{x.ppl !== x.v && <span style={{ fontSize: 9, opacity: .6, marginLeft: 2 }}>({x.ppl}p)</span>}
          </button>))}
        <button onClick={() => setShowStats(!showStats)} style={{ padding: "6px 10px", borderRadius: 16, fontSize: 11, fontWeight: 600, background: showStats ? "rgba(184,149,106,.1)" : "var(--cd)", color: showStats ? "var(--gd)" : "var(--mt)", border: `1px solid ${showStats ? "var(--g)" : "var(--bd)"}`, marginLeft: "auto" }}>📊</button>
      </div>

      {showStats && <Card style={{ marginBottom: 12, padding: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Distribuție pe grupuri</div>
        {groupStats.map((g, i) => (
          <div key={g.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: gCl[i % gCl.length], flexShrink: 0 }} />
            <span style={{ fontSize: 12, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
            <div style={{ width: 80, height: 6, background: "var(--cr2)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 3, width: `${g.pct}%`, background: gCl[i % gCl.length] }} /></div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gd)", minWidth: 24, textAlign: "right" }}>{g.count}</span>
            <span style={{ fontSize: 10, color: "var(--mt)", minWidth: 26 }}>{g.pct}%</span>
          </div>
        ))}
      </Card>}

      {allTags.length > 0 && <div style={{ display: "flex", gap: 4, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
        <span style={{ fontSize: 10, color: "var(--mt)", alignSelf: "center", marginRight: 2, flexShrink: 0 }}>{ic.tag}</span>
        {allTags.map(t => { const cnt = s.guests.filter(g => (g.tags || []).includes(t)).length; return (
          <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)} style={{ padding: "3px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, background: tagFilter === t ? "var(--gd)" : "var(--cr)", color: tagFilter === t ? "#fff" : "var(--gr)", border: `1px solid ${tagFilter === t ? "var(--gd)" : "var(--bd)"}` }}>{t} <span style={{ opacity: .6 }}>{cnt}</span></button>
        ); })}
      </div>}

      {/* Quick add with configurable groups */}
      <Card style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(184,149,106,.03)", border: "1.5px dashed var(--gl)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gd)" }}>⚡ Adaugă rapid</div>
          <button onClick={() => setShowImport(true)} style={{ fontSize: 10, fontWeight: 600, color: "var(--g)", padding: "3px 8px", borderRadius: 8, background: "rgba(184,149,106,.08)" }}>📥 Import CSV</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 7 }}>
          <input ref={ref} value={qn} onChange={e => setQn(e.target.value)} onKeyDown={e => e.key === "Enter" && quickAdd()} placeholder="Nume invitat/familie..." style={{ flex: 1, padding: "9px 11px", borderRadius: "var(--rs)", background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 13 }} />
          <select value={qg} onChange={e => setQg(e.target.value)} style={{ padding: "9px 6px", borderRadius: "var(--rs)", background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 11, color: "var(--gr)", maxWidth: 110 }}>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={quickAdd} style={{ width: 38, height: 38, borderRadius: "var(--rs)", background: "var(--g)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic.plus}</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {[{k:"single",l:"👤 Single"},{k:"couple",l:"👫 Cuplu"},{k:"family",l:"👨‍👩‍👧 Familie"}].map(t => (
            <button key={t.k} onClick={() => setQType(t.k)} style={{ padding: "5px 9px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: qType === t.k ? "var(--gd)" : "var(--cd)", color: qType === t.k ? "#fff" : "var(--gr)", border: `1px solid ${qType === t.k ? "var(--gd)" : "var(--bd)"}` }}>{t.l}</button>
          ))}
          {qType === "family" && <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 2 }}>
            <span style={{ fontSize: 10, color: "var(--mt)", fontWeight: 700 }}>Persoane</span>
            <button onClick={() => setQFamilySize(v => Math.max(3, v - 1))} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--bd)", background: "var(--cd)", fontWeight: 700, color: "var(--gr)" }}>−</button>
            <span style={{ minWidth: 14, textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--gd)" }}>{qFamilySize}</span>
            <button onClick={() => setQFamilySize(v => Math.min(12, v + 1))} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--bd)", background: "var(--cd)", fontWeight: 700, color: "var(--gr)" }}>+</button>
          </div>}
          <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--mt)", fontWeight: 600 }}>Se adaugă: {quickCount} pers.</span>
        </div>
      </Card>

      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 11px", background: "var(--cd)", border: "1px solid var(--bd)", borderRadius: "var(--rs)", marginBottom: 12 }}>
        <span style={{ color: "var(--mt)" }}>{ic.search}</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută..." style={{ flex: 1, padding: "9px 0", fontSize: 13 }} />
      </div>

      {Object.entries(grouped).map(([gn, gl]) => (
        <div key={gn} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5, paddingLeft: 2 }}>{gn} ({gl.length})</div>
          {gl.map(g => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "var(--cd)", borderRadius: "var(--rs)", border: "1px solid var(--bd)", marginBottom: 5 }}>
              <button onClick={() => cycleRsvp(g)} title="Apasă pentru a schimba statusul" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: g.rsvp === "confirmed" ? "var(--ok)" : g.rsvp === "declined" ? "var(--er)" : "var(--cr2)", color: g.rsvp === "pending" ? "var(--mt)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, border: g.rsvp === "pending" ? "2px dashed var(--ft)" : "none", transition: "all .2s" }}>
                  {g.rsvp === "confirmed" ? "✓" : g.rsvp === "declined" ? "✕" : "?"}
                </div>
                <span style={{ fontSize: 8, fontWeight: 600, color: g.rsvp === "confirmed" ? "var(--ok)" : g.rsvp === "declined" ? "var(--er)" : "var(--mt)", textTransform: "uppercase", letterSpacing: ".04em", lineHeight: 1 }}>
                  {g.rsvp === "confirmed" ? "Da" : g.rsvp === "declined" ? "Nu" : "Apasă"}
                </span>
              </button>
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => { setEditing(g); setShowForm(true) }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
                <div style={{ display: "flex", gap: 3, marginTop: 1, flexWrap: "wrap" }}>{g.dietary && <Badge c="rose">{g.dietary}</Badge>}{g.tid && <Badge c="green">Așezat</Badge>}{g.notes && <span style={{ fontSize: 10, color: "var(--mt)" }} title={g.notes}>📝</span>}{(g.tags||[]).map(t=><Badge key={t} c="blue">{t}</Badge>)}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setConfirmDel(g.id) }} style={{ padding: 4, color: "var(--ft)" }}>{ic.trash}</button>
            </div>
          ))}
        </div>
      ))}

      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => d({ type: "DEL_GUEST", p: confirmDel })} title="Șterge invitatul?" message="Invitatul va fi eliminat din listă și de la masă. Acțiunea nu poate fi anulată." />

      <ImportCSV open={showImport} onClose={() => setShowImport(false)} />

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare" : "Invitat nou"}>
        {showForm && <GuestFormInner guest={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
      </Modal>
    </div>
  );
}

function GuestFormInner({ guest, onClose }) {
  const { s, d } = useContext(Ctx);
  const groups = s.groups || ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"];
  const allTags = s.tags || ["Copil","Cazare","Parcare","Din alt oraș","Martor","Naș/Nașă"];
  const [f, setF] = useState(guest ? { ...guest, tags: guest.tags || [], count: guest.count || 1 } : { name: "", group: groups[0], rsvp: "pending", dietary: "", notes: "", tags: [], count: 1 });
  const u = k => v => setF(x => ({ ...x, [k]: v }));
  const toggleTag = t => setF(x => ({ ...x, tags: x.tags.includes(t) ? x.tags.filter(v => v !== t) : [...x.tags, t] }));
  return <>
    <Fld label="Nume" value={f.name} onChange={u("name")} />
    <div style={{display:"flex",gap:8,marginBottom:12}}>
      <div style={{flex:1}}>
        <Fld label="Grup" value={f.group} onChange={u("group")} options={groups} />
      </div>
      <div style={{width:100}}>
        <Fld label="Persoane" value={f.count} onChange={v=>u("count")(Number(v)||1)} options={[{value:1,label:"👤 1"},{value:2,label:"👫 2"},{value:3,label:"👨‍👩‍👧 3"},{value:4,label:"👨‍👩‍👧‍👦 4"},{value:5,label:"5"},{value:6,label:"6"}]} />
      </div>
    </div>
    <Fld label="RSVP" value={f.rsvp} onChange={u("rsvp")} options={[{ value: "pending", label: "Așteptare" }, { value: "confirmed", label: "Confirmat" }, { value: "declined", label: "Refuzat" }]} />
    <Fld label="Restricții alimentare" value={f.dietary} onChange={u("dietary")} placeholder="vegetarian, vegan..." />
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5 }}>Tag-uri</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {allTags.map(t => (
          <button key={t} onClick={() => toggleTag(t)} style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: f.tags.includes(t) ? "var(--gd)" : "var(--cr)", color: f.tags.includes(t) ? "#fff" : "var(--gr)", border: `1px solid ${f.tags.includes(t) ? "var(--gd)" : "var(--bd)"}` }}>{t}</button>
        ))}
      </div>
    </div>
    <Fld label="Note" value={f.notes} onChange={u("notes")} type="textarea" placeholder="Vine cu copil, necesită cazare..." />
    <Btn full onClick={() => { d({ type: guest ? "UPD_GUEST" : "ADD_GUEST", p: { ...f, id: guest?.id || mkid(), tid: f.tid || null } }); onClose() }} disabled={!f.name}>{guest ? "Salvează" : "Adaugă"}</Btn>
  </>;
}

// ── Seated Guest Row (extracted for hooks) ──────────────────
function SeatedGuestRow({ g, table, isMoving, setMovingGuest, moveGuest, unseat, gAt, allTables }) {
  const [showInfo, setShowInfo] = useState(false);
  const hasInfo = g.dietary || (g.tags||[]).length > 0 || g.notes;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 14, fontSize: 12, fontWeight: 500, background: isMoving ? "rgba(184,149,106,.08)" : "var(--cr)", border: `1px solid ${isMoving ? "var(--g)" : "var(--bd)"}` }}>
        <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
          {g.name}{gCount(g)>1&&<span style={{fontSize:8,padding:"1px 4px",borderRadius:6,background:"rgba(184,149,106,.12)",color:"var(--gd)",fontWeight:700}}>×{gCount(g)}</span>}
          {g.dietary && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--er)", flexShrink: 0 }} title={g.dietary} />}
          {(g.tags||[]).includes("Copil") && <span style={{ fontSize: 10 }} title="Vine cu copil">👶</span>}
          {(g.tags||[]).includes("Vegetarian") && <span style={{ fontSize: 10 }} title="Vegetarian">🌱</span>}
        </span>
        {hasInfo && <button onClick={() => setShowInfo(!showInfo)} style={{ padding: "2px 6px", borderRadius: 6, fontSize: 9, fontWeight: 700, color: showInfo ? "var(--g)" : "var(--mt)", background: showInfo ? "rgba(184,149,106,.1)" : "transparent" }}>ℹ</button>}
        <button onClick={() => setMovingGuest(isMoving ? null : { gid: g.id, fromTid: table.id })} style={{ padding: "1px 4px", color: isMoving ? "var(--g)" : "var(--mt)", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>↗</button>
        <button onClick={() => unseat(g.id)} style={{ padding: 1, color: "var(--mt)", display: "flex" }}>{ic.x}</button>
      </div>
      {showInfo && <div style={{ padding: "6px 12px", marginTop: 2, marginBottom: 2, borderRadius: 8, background: "rgba(184,149,106,.04)", border: "1px solid var(--bd)", fontSize: 11 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {g.dietary && <Badge c="rose">{g.dietary}</Badge>}
          {(g.tags||[]).map(t => <Badge key={t} c="blue">{t}</Badge>)}
          {g.rsvp === "confirmed" && <Badge c="green">Confirmat</Badge>}
        </div>
        {g.notes && <div style={{ marginTop: 4, color: "var(--mt)", fontStyle: "italic" }}>📝 {g.notes}</div>}
      </div>}
      {isMoving && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 4px", marginTop: 2 }}>
          <span style={{ fontSize: 10, color: "var(--mt)", alignSelf: "center", marginRight: 2 }}>Mută la:</span>
          {allTables.filter(t => t.id !== table.id).map(t => {
            const cnt = gAt(t.id).reduce((a, g) => a + gCount(g), 0);
            const full = cnt >= t.seats;
            return (
              <button key={t.id} disabled={full} onClick={() => moveGuest(g.id, t.id)} style={{
                padding: "4px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                background: full ? "var(--cr2)" : "rgba(184,149,106,.08)", border: `1px solid ${full ? "var(--bd)" : "var(--gl)"}`,
                color: full ? "var(--ft)" : "var(--gd)", opacity: full ? .5 : 1,
              }}>
                {t.name} <span style={{ fontSize: 9, color: "var(--mt)" }}>{cnt}/{t.seats}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🔥 TABLES — List cards, edit seats, FIXED add bug
// ═══════════════════════════════════════════════════════════════
function TablesList() {
  const { s, d } = useContext(Ctx);
  const [expanded, setExpanded] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [pickingFor, setPickingFor] = useState(null);
  const [searchG, setSearchG] = useState("");
  const [editingTable, setEditingTable] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [movingGuest, setMovingGuest] = useState(null); // {gid, fromTid}

  const unassigned = useMemo(() => s.guests.filter(g => !g.tid && g.rsvp === "confirmed"), [s.guests]);
  const gAt = useCallback(tid => s.guests.filter(g => g.tid === tid), [s.guests]);
  const totalSeats = s.tables.reduce((a, t) => a + t.seats, 0); // seats = person capacity
  const totalSeated = sumGuests(s.guests.filter(g => g.tid));

  const toggle = tid => setExpanded(e => ({ ...e, [tid]: !e[tid] }));
  const seat = (gid, tid) => d({ type: "SEAT", p: { gid, tid } });
  const unseat = gid => d({ type: "UNSEAT", p: gid });
  const moveGuest = (gid, newTid) => { d({ type: "MOVE_SEAT", p: { gid, tid: newTid } }); setMovingGuest(null); };

  const avail = useMemo(() => {
    let l = unassigned;
    if (searchG) l = l.filter(g => g.name.toLowerCase().includes(searchG.toLowerCase()));
    return l;
  }, [unassigned, searchG]);

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      <Card style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Locuri ocupate</div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 500, color: "var(--g)" }}>{totalSeated}<span style={{ fontSize: 13, color: "var(--mt)", fontFamily: "var(--f)" }}> / {totalSeats}</span></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Nealocați</div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 500, color: unassigned.length > 0 ? "var(--wn)" : "var(--ok)" }}>{unassigned.length}</div>
        </div>
      </Card>

      {/* Unassigned chips — just names, no instruction text */}
      {unassigned.length > 0 && <Card style={{ marginBottom: 12, padding: "10px 12px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gd)", marginBottom: 6 }}>Nealocați ({unassigned.length})</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {unassigned.slice(0, 30).map(g => (
            <span key={g.id} style={{ padding: "4px 9px", borderRadius: 12, fontSize: 11, fontWeight: 500, background: "var(--cr)", border: "1px solid var(--bd)", display: "inline-flex", alignItems: "center", gap: 3 }}>
              {g.name.split(" ")[0]}
              {g.dietary && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--er)" }} />}
            </span>
          ))}
          {unassigned.length > 30 && <span style={{ padding: "4px 9px", fontSize: 11, color: "var(--mt)" }}>+{unassigned.length - 30}</span>}
        </div>
      </Card>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>{s.tables.length} mese</span>
        <Btn v="secondary" onClick={() => setShowAdd(true)} style={{ fontSize: 11, padding: "5px 12px" }}>{ic.plus} Masă nouă</Btn>
      </div>

      {s.tables.map(table => {
        const seated = gAt(table.id);
        const seatedPersons = seated.reduce((a, g) => a + gCount(g), 0);
        const free = table.seats - seatedPersons;
        const isFull = free <= 0;
        const isOpen = expanded[table.id];
        const isPicking = pickingFor === table.id;

        return (
          <Card key={table.id} style={{ marginBottom: 8, padding: 0, overflow: "hidden" }}>
            <div onClick={() => toggle(table.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}>
              <div style={{ width: 36, height: 36, borderRadius: table.shape === "round" ? "50%" : 8, background: isFull ? "rgba(107,158,104,.1)" : "var(--cr)", border: `1.5px solid ${isFull ? "var(--ok)" : "var(--bd)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isFull ? "var(--ok)" : "var(--gd)" }}>{seated.length}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{table.name}</div>
                <div style={{ fontSize: 11, color: "var(--mt)" }}>
                  {table.shape === "round" ? "Rotundă" : "Dreptunghiulară"} · {table.seats} locuri · <span style={{ color: isFull ? "var(--ok)" : "var(--gd)", fontWeight: 600 }}>{free} libere</span>
                </div>
              </div>
              <span style={{ color: "var(--ft)", transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>{ic.chevD}</span>
            </div>

            {isOpen && <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--bd)" }}>
              {/* Table notes */}
              {table.notes && <div style={{ fontSize: 11, color: "var(--mt)", fontStyle: "italic", padding: "6px 0", borderBottom: "1px solid var(--bd)" }}>📝 {table.notes}</div>}
              {seated.length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 0" }}>
                {seated.map(g => {
                  const isMoving = movingGuest?.gid === g.id;
                  return (
                    <SeatedGuestRow key={g.id} g={g} table={table} isMoving={isMoving} setMovingGuest={setMovingGuest} moveGuest={moveGuest} unseat={unseat} gAt={gAt} allTables={s.tables} />
                  );
                })}
              </div> : <div style={{ padding: "10px 0", fontSize: 12, color: "var(--mt)", fontStyle: "italic" }}>Niciun invitat</div>}

              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {!isFull && <Btn v="secondary" onClick={() => { setPickingFor(isPicking ? null : table.id); setSearchG("") }} style={{ fontSize: 11, padding: "7px 12px", flex: 1, border: isPicking ? "2px solid var(--g)" : "1px solid var(--bd)", background: isPicking ? "rgba(184,149,106,.06)" : "var(--cr)" }}>
                  {isPicking ? "Anulează" : "+ Adaugă invitați"}
                </Btn>}
                <Btn v="ghost" onClick={() => setEditingTable(table)} style={{ fontSize: 11, padding: "7px 10px" }}>{ic.edit}</Btn>
                <Btn v="danger" onClick={() => setConfirmDel(table.id)} style={{ fontSize: 11, padding: "7px 10px" }}>{ic.trash}</Btn>
              </div>

              {isPicking && <div style={{ marginTop: 10, padding: 10, borderRadius: "var(--rs)", background: "rgba(184,149,106,.04)", border: "1px solid var(--gl)" }}>
                <input value={searchG} onChange={e => setSearchG(e.target.value)} placeholder="Caută invitat..." style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 12, marginBottom: 8 }} />
                {avail.length === 0 ? <div style={{ fontSize: 11, color: "var(--mt)", textAlign: "center", padding: 8 }}>Toți invitații sunt așezați</div>
                  : <div style={{ maxHeight: 160, overflow: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
                    {avail.map(g => (
                      <button key={g.id} onClick={() => { seat(g.id, table.id); if (seatedPersons + gCount(g) >= table.seats) setPickingFor(null) }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, background: "var(--cd)", border: "1px solid var(--bd)", textAlign: "left" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--cr2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--gd)", flexShrink: 0 }}>{g.name[0]}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{g.name}</div><div style={{ fontSize: 10, color: "var(--mt)" }}>{g.group}{g.dietary ? ` · ${g.dietary}` : ""}</div></div>
                        <span style={{ color: "var(--g)", fontSize: 11, fontWeight: 600 }}>+ Adaugă</span>
                      </button>
                    ))}
                  </div>}
              </div>}
            </div>}
          </Card>
        );
      })}

      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => { d({ type: "DEL_TABLE", p: confirmDel }); setExpanded(e => { const n = { ...e }; delete n[confirmDel]; return n }); }} title="Șterge masa?" message="Toți invitații de la această masă vor deveni nealocați." />

      {/* Add table modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Masă nouă">
        <AddTableForm onClose={() => setShowAdd(false)} />
      </Modal>

      {/* Edit table modal */}
      <Modal open={!!editingTable} onClose={() => setEditingTable(null)} title="Editare masă">
        {editingTable && <EditTableForm table={editingTable} onClose={() => setEditingTable(null)} />}
      </Modal>
    </div>
  );
}

function AddTableForm({ onClose }) {
  const { s, d } = useContext(Ctx);
  const [name, setName] = useState("Masa " + (s.tables.length + 1));
  const [shape, setShape] = useState("round");
  const [seats, setSeats] = useState(8);

  const handleAdd = () => {
    if (!name.trim()) return;
    d({ type: "ADD_TABLE", p: { id: mkid(), name: name.trim(), shape, seats: Number(seats) || 8 } });
    onClose();
  };

  return <>
    <Fld label="Nume" value={name} onChange={setName} placeholder="Masa 5" />
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5 }}>Formă</label>
      <div style={{ display: "flex", gap: 8 }}>
        {[{ v: "round", l: "Rotundă", i: "●" }, { v: "rectangular", l: "Dreptunghi", i: "▬" }].map(sh => (
          <button key={sh.v} onClick={() => setShape(sh.v)} style={{ flex: 1, padding: "12px 8px", borderRadius: "var(--rs)", textAlign: "center", border: `2px solid ${shape === sh.v ? "var(--g)" : "var(--bd)"}`, background: shape === sh.v ? "rgba(184,149,106,.05)" : "var(--cr)" }}>
            <div style={{ fontSize: 20, opacity: .4, marginBottom: 3 }}>{sh.i}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: shape === sh.v ? "var(--gd)" : "var(--mt)" }}>{sh.l}</div>
          </button>
        ))}
      </div>
    </div>
    <Fld label="Număr locuri" value={seats} onChange={v => setSeats(v)} type="number" />
    <Btn full onClick={handleAdd} disabled={!name.trim()}>Adaugă masa</Btn>
  </>;
}

function EditTableForm({ table, onClose }) {
  const { d } = useContext(Ctx);
  const [name, setName] = useState(table.name);
  const [shape, setShape] = useState(table.shape);
  const [seats, setSeats] = useState(table.seats);
  const [notes, setNotes] = useState(table.notes || "");

  return <>
    <Fld label="Nume" value={name} onChange={setName} />
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5 }}>Formă</label>
      <div style={{ display: "flex", gap: 8 }}>
        {[{ v: "round", l: "Rotundă", i: "●" }, { v: "rectangular", l: "Dreptunghi", i: "▬" }].map(sh => (
          <button key={sh.v} onClick={() => setShape(sh.v)} style={{ flex: 1, padding: "12px 8px", borderRadius: "var(--rs)", textAlign: "center", border: `2px solid ${shape === sh.v ? "var(--g)" : "var(--bd)"}`, background: shape === sh.v ? "rgba(184,149,106,.05)" : "var(--cr)" }}>
            <div style={{ fontSize: 20, opacity: .4, marginBottom: 3 }}>{sh.i}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: shape === sh.v ? "var(--gd)" : "var(--mt)" }}>{sh.l}</div>
          </button>
        ))}
      </div>
    </div>
    <Fld label="Număr locuri" value={seats} onChange={v => setSeats(v)} type="number" />
    <Fld label="Note" value={notes} onChange={setNotes} type="textarea" placeholder="Lângă ringul de dans, masă rotundă mare..." />
    <Btn full onClick={() => { d({ type: "UPD_TABLE", p: { id: table.id, name, shape, seats: Number(seats) || 8, notes } }); onClose() }} disabled={!name}>Salvează</Btn>
  </>;
}

// ═══════════════════════════════════════════════════════════════
// BUDGET — Enhanced dashboard
// ═══════════════════════════════════════════════════════════════
function BudgetMod() {
  const { s, d } = useContext(Ctx);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const tP = s.budget.reduce((a, b) => a + b.planned, 0);
  const tS = s.budget.reduce((a, b) => a + b.spent, 0);
  const pct = tP > 0 ? Math.round((tS / tP) * 100) : 0;
  const cl = ["#B8956A", "#8BA888", "#D4A0A0", "#5A82B4", "#C9A032", "#B85C5C", "#9A9A9A", "#A088B8"];
  const vendorByName = useMemo(() => new Map((s.vendors || []).map(v => [(v.name || "").trim().toLowerCase(), v])), [s.vendors]);

  // SVG donut
  let angle = 0;
  const arcs = s.budget.map((b, i) => {
    const sl = tS > 0 ? (b.spent / tS) * 360 : 0;
    const s2 = angle; angle += sl;
    const sr = ((s2 - 90) * Math.PI) / 180, er = ((s2 + sl - 90) * Math.PI) / 180;
    const x1 = 55 + 42 * Math.cos(sr), y1 = 55 + 42 * Math.sin(sr);
    const x2 = 55 + 42 * Math.cos(er), y2 = 55 + 42 * Math.sin(er);
    return { path: `M55 55 L${x1} ${y1} A42 42 0 ${sl > 180 ? 1 : 0} 1 ${x2} ${y2}Z`, color: cl[i % cl.length], ...b };
  });

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      <Card style={{ marginBottom: 12, display: "flex", gap: 14, alignItems: "center" }}>
        <svg width={110} height={110} viewBox="0 0 110 110">
          {arcs.map((a, i) => <path key={i} d={a.path} fill={a.color} opacity={.85} />)}
          <circle cx={55} cy={55} r={22} fill="var(--cd)" />
          <text x={55} y={52} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)" fontFamily="var(--f)">{pct}%</text>
          <text x={55} y={63} textAnchor="middle" fontSize="7" fill="var(--mt)" fontFamily="var(--f)">consumat</text>
        </svg>
        <div style={{ flex: 1 }}>
          {[{ l: "Planificat", v: fmtC(tP), c: "var(--ink)" }, { l: "Cheltuit", v: fmtC(tS), c: "var(--g)" }, { l: "Rămas", v: fmtC(tP - tS), c: tP - tS >= 0 ? "var(--ok)" : "var(--er)" }].map(x => (
            <div key={x.l} style={{ marginBottom: 5 }}><div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>{x.l}</div><div style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 500, color: x.c }}>{x.v}</div></div>
          ))}
        </div>
      </Card>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {s.budget.map((b, i) => (
          <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cl[i % cl.length] }} /><span style={{ color: "var(--gr)" }}>{b.cat}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Categorii</span>
        <Btn v="secondary" onClick={() => { setEditing(null); setShowForm(true) }} style={{ fontSize: 10, padding: "4px 10px" }}>{ic.plus} Adaugă</Btn>
      </div>
      {s.budget.map((b, i) => { const p = Math.round((b.spent / Math.max(b.planned, 1)) * 100); const linkedVendor = vendorByName.get((b.vendor || "").trim().toLowerCase()); return (
        <Card key={b.id} onClick={() => { setEditing(b); setShowForm(true) }} style={{ marginBottom: 7, cursor: "pointer", padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: cl[i % cl.length] }} /><span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{b.cat}</span><Badge c={b.status === "paid" ? "green" : b.status === "partial" ? "blue" : "gray"}>{b.status === "paid" ? "Plătit" : b.status === "partial" ? "Parțial" : "Neplătit"}</Badge></div>
          {b.vendor && <div style={{ fontSize: 10, color: "var(--mt)", marginBottom: 3 }}>📍 {b.vendor}</div>}
          {linkedVendor && <div style={{ display: "flex", gap: 5, marginBottom: 4, flexWrap: "wrap" }}><Badge c={linkedVendor.status === "contracted" ? "green" : linkedVendor.status === "negotiating" ? "blue" : "gray"}>{linkedVendor.status === "contracted" ? "Contractat" : linkedVendor.status === "negotiating" ? "Negociere" : linkedVendor.status === "potential" ? "Potențial" : linkedVendor.status}</Badge><Badge c="gold">⭐ {linkedVendor.rating || 0}/5</Badge></div>}
          {b.notes && <div style={{ fontSize: 10, color: "var(--mt)", marginBottom: 3, fontStyle: "italic" }}>📝 {b.notes}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><span>{fmtC(b.spent)}</span><span style={{ color: "var(--mt)" }}>{fmtC(b.planned)}</span></div>
          <div style={{ height: 4, background: "var(--cr2)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 2, width: `${Math.min(p, 100)}%`, background: p > 100 ? "var(--er)" : "var(--g)", transition: "width .5s" }} /></div>
          {p > 100 && <div style={{ fontSize: 9, color: "var(--er)", fontWeight: 600, marginTop: 2 }}>⚠ +{fmtC(b.spent - b.planned)}</div>}
        </Card>
      ) })}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare" : "Categorie nouă"}>
        {showForm && <BudgetFormInner item={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
      </Modal>
    </div>
  );
}

function BudgetFormInner({ item, onClose }) {
  const { s, d } = useContext(Ctx);
  const [f, setF] = useState(item ? { ...item } : { cat: "", planned: 0, spent: 0, vendor: "", status: "unpaid" });
  const [showConfirm, setShowConfirm] = useState(false);
  const u = k => v => setF(x => ({ ...x, [k]: v }));

  const norm = (v) => (v || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const sameCat = (vCat, bCat) => norm(vCat).includes(norm(bCat)) || norm(bCat).includes(norm(vCat));

  const vendors = s.vendors || [];
  const linkedByCat = vendors.filter(v => f.cat && sameCat(v.cat, f.cat));
  const contractedByCat = linkedByCat.find(v => v.status === "contracted");
  const vendorOptions = [{ value: "", label: "— Selectează furnizor —" }, ...vendors.map(v => ({ value: v.name, label: `${v.name}${v.cat ? ` · ${v.cat}` : ""}${v.status ? ` (${v.status})` : ""}` }))];

  useEffect(() => {
    if (!f.cat || f.vendor) return;
    if (contractedByCat?.name) setF(x => ({ ...x, vendor: contractedByCat.name }));
  }, [f.cat, f.vendor, contractedByCat?.name]);

  return <>
    <Fld label="Categorie" value={f.cat} onChange={u("cat")} />
    <Fld label="Planificat (€)" value={f.planned} onChange={v => u("planned")(parseFloat(v) || 0)} type="number" />
    <Fld label="Cheltuit (€)" value={f.spent} onChange={v => u("spent")(parseFloat(v) || 0)} type="number" />

    {contractedByCat && <div style={{ marginBottom: 8, fontSize: 10, color: "var(--ok)", fontWeight: 600 }}>🔗 Sugestie automată pentru categorie: {contractedByCat.name} (contractat)</div>}
    <Fld label="Furnizor (din listă)" value={f.vendor} onChange={u("vendor")} options={vendorOptions} />
    <Fld label="Sau introdu manual" value={f.vendor} onChange={u("vendor")} placeholder="Nume furnizor..." />

    {linkedByCat.length > 0 && <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 5 }}>Furnizori pe această categorie</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {linkedByCat.map(v => <button key={v.id} onClick={() => u("vendor")(v.name)} style={{ padding: "4px 8px", borderRadius: 10, fontSize: 10, background: f.vendor === v.name ? "var(--gd)" : "var(--cr)", color: f.vendor === v.name ? "#fff" : "var(--gr)", border: `1px solid ${f.vendor === v.name ? "var(--gd)" : "var(--bd)"}` }}>{v.name} {v.status === "contracted" ? "✓" : ""}</button>)}
      </div>
    </div>}

    <Fld label="Status" value={f.status} onChange={u("status")} options={[{ value: "unpaid", label: "Neplătit" }, { value: "partial", label: "Parțial" }, { value: "paid", label: "Plătit" }]} />
    <Fld label="Note" value={f.notes} onChange={u("notes")} type="textarea" placeholder="Plata în 2 rate, factură trimisă..." />
    <div style={{ display: "flex", gap: 8 }}>
      <Btn full onClick={() => { d({ type: item ? "UPD_BUDGET" : "ADD_BUDGET", p: { ...f, id: item?.id || mkid() } }); onClose() }} disabled={!f.cat}>Salvează</Btn>
      {item && <Btn v="danger" onClick={() => setShowConfirm(true)}>{ic.trash}</Btn>}
    </div>
    <ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={() => { d({ type: "DEL_BUDGET", p: item.id }); onClose() }} title="Șterge categoria?" message={`"${item?.cat}" va fi eliminată din buget.`} />
  </>;
}

// ═══════════════════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════════════════
function TasksMod() {
  const { s, d } = useContext(Ctx);
  const [filter, setFilter] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const list = useMemo(() => { let l = [...s.tasks].sort((a, b) => new Date(a.due) - new Date(b.due)); if (filter === "active") l = l.filter(t => t.status !== "done"); if (filter === "done") l = l.filter(t => t.status === "done"); if (filter === "urgent") l = l.filter(t => t.prio === "high" && t.status !== "done"); return l }, [s.tasks, filter]);
  const done = s.tasks.filter(t => t.status === "done").length;
  const pct = Math.round((done / Math.max(s.tasks.length, 1)) * 100);
  const overdue = s.tasks.filter(t => new Date(t.due) < new Date() && t.status !== "done").length;

  const wDate = new Date(s.wedding.date);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((wDate - now) / 864e5));

  const dueLabel = (due) => {
    if (!due) return "Fără termen";
    const d = new Date(due);
    const diff = Math.ceil((d - now) / 864e5);
    if (diff < 0) return `Depășit cu ${Math.abs(diff)} zile`;
    if (diff === 0) return "Astăzi!";
    if (diff === 1) return "Mâine";
    if (diff <= 7) return `Până în ${diff} zile`;
    if (diff <= 30) return `Până la ${fmtD(due)}`;
    return `Până la ${fmtD(due)}`;
  };

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      {/* Progress + Stats */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Progres total</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: "var(--fd)", fontSize: 28, fontWeight: 500, color: "var(--g)" }}>{pct}%</span>
              <span style={{ fontSize: 11, color: "var(--mt)" }}>{done}/{s.tasks.length} gata</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--gd)" }}>{daysLeft}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>zile rămase</div>
          </div>
        </div>
        <div style={{ height: 8, background: "var(--cr2)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: "linear-gradient(90deg,var(--g),var(--ok))", transition: "width .6s" }} />
        </div>
        {overdue > 0 && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "6px 10px", borderRadius: 8, background: "rgba(184,92,92,.06)" }}>
          <span style={{ fontSize: 11 }}>⚠</span>
          <span style={{ fontSize: 11, color: "var(--er)", fontWeight: 600 }}>{overdue} task-uri depășite</span>
        </div>}
      </Card>

      {/* Filters + Add */}
      <div style={{ display: "flex", gap: 5, marginBottom: 10, alignItems: "center" }}>
        {[{ k: "active", l: "Active", cnt: s.tasks.filter(t => t.status !== "done").length }, { k: "urgent", l: "Urgente", cnt: s.tasks.filter(t => t.prio === "high" && t.status !== "done").length }, { k: "done", l: "Finalizate", cnt: done }].map(f =>
          <button key={f.k} onClick={() => setFilter(f.k)} style={{ padding: "5px 11px", borderRadius: 14, fontSize: 10, fontWeight: 600, background: filter === f.k ? "var(--g)" : "var(--cr)", color: filter === f.k ? "#fff" : "var(--mt)", border: `1px solid ${filter === f.k ? "var(--g)" : "var(--bd)"}` }}>
            {f.l} <span style={{ opacity: .7 }}>{f.cnt}</span>
          </button>
        )}
        <button onClick={() => { setEditing(null); setShowForm(true) }} style={{ marginLeft: "auto", width: 32, height: 32, borderRadius: "50%", background: "var(--g)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic.plus}</button>
      </div>

      {/* Task list */}
      {list.length === 0 && <Card style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>{filter === "done" ? "📋" : "🎉"}</div>
        <div style={{ fontSize: 13, color: "var(--mt)" }}>{filter === "done" ? "Niciun task finalizat încă" : "Totul e la zi!"}</div>
      </Card>}

      {list.map((t) => {
        const over = new Date(t.due) < new Date() && t.status !== "done";
        const dn = t.status === "done";
        return (
          <Card key={t.id} style={{ marginBottom: 6, padding: 0, overflow: "hidden", opacity: dn ? .5 : 1 }}>
            <div style={{ display: "flex", alignItems: "stretch" }}>
              {/* Checkbox area */}
              <button onClick={() => d({ type: "UPD_TASK", p: { id: t.id, status: dn ? "pending" : "done" } })} style={{ width: 48, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: dn ? "rgba(107,158,104,.08)" : over ? "rgba(184,92,92,.04)" : "transparent", borderRight: "1px solid var(--bd)" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${dn ? "var(--ok)" : over ? "var(--er)" : "var(--ft)"}`, background: dn ? "var(--ok)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
                  {dn && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
              </button>
              {/* Content */}
              <div onClick={() => { setEditing(t); setShowForm(true) }} style={{ flex: 1, padding: "10px 12px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, textDecoration: dn ? "line-through" : "none", flex: 1, color: "var(--ink)" }}>{t.title}</span>
                  {t.prio === "high" && !dn && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--er)", flexShrink: 0 }} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: over ? "var(--er)" : "var(--mt)", fontWeight: over ? 600 : 400 }}>
                    {dn ? "Finalizat ✓" : dueLabel(t.due)}
                  </span>
                  {t.cat && <Badge c="gold">{t.cat}</Badge>}
                  {t.prio === "high" && !dn && <Badge c="red">Urgent</Badge>}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare task" : "Task nou"}>
        {showForm && <TaskFormInner task={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
      </Modal>
    </div>
  );
}
function TaskFormInner({ task, onClose }) {
  const { d } = useContext(Ctx); const [f, setF] = useState(task ? { ...task } : { title: "", due: "", status: "pending", prio: "medium", cat: "" }); const [showConfirm, setShowConfirm] = useState(false); const u = k => v => setF(x => ({ ...x, [k]: v }));
  return <>
    <Fld label="Titlu" value={f.title} onChange={u("title")} placeholder="Ce trebuie făcut?" />
    <Fld label="Până la data" value={f.due} onChange={u("due")} type="date" />
    <Fld label="Categorie" value={f.cat} onChange={u("cat")} placeholder="Catering, Rochie, General..." />
    <Fld label="Prioritate" value={f.prio} onChange={u("prio")} options={[{ value: "low", label: "Scăzută" }, { value: "medium", label: "Medie" }, { value: "high", label: "Urgentă" }]} />
    <div style={{ display: "flex", gap: 8 }}>
      <Btn full onClick={() => { d({ type: task ? "UPD_TASK" : "ADD_TASK", p: { ...f, id: task?.id || mkid() } }); onClose() }} disabled={!f.title}>Salvează</Btn>
      {task && <Btn v="danger" onClick={() => setShowConfirm(true)}>{ic.trash}</Btn>}
    </div>
    <ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={() => { d({ type: "DEL_TASK", p: task.id }); onClose() }} title="Șterge task-ul?" message={`"${task?.title}" va fi eliminat.`} />
  </>;
}

// ═══════════════════════════════════════════════════════════════
// VENDORS
// ═══════════════════════════════════════════════════════════════
function VendorsMod() {
  const { s, d } = useContext(Ctx); const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState(null); const [expandedId, setExpandedId] = useState(null);
  const stL = { contracted: "Contractat", negotiating: "Negociere", contacted: "Contactat", potential: "Potențial" };
  const stC = { contracted: "green", negotiating: "blue", contacted: "gold", potential: "gray" };
  const stIcon = { contracted: "✅", negotiating: "🤝", contacted: "📩", potential: "🔍" };
  const catIcon = { "Locație": "📍", "Catering": "🍽️", "Fotograf": "📸", "Muzică": "🎵", "Floristică": "💐", "Transport": "🚗", "Altele": "📦" };
  const ratingLabels = ["", "Slab", "Acceptabil", "Bun", "Foarte bun", "Excelent"];
  const contracted = s.vendors.filter(v => v.status === "contracted").length;
  const negotiating = s.vendors.filter(v => v.status === "negotiating").length;

  return (<div className="fu" style={{ padding: "0 14px 20px" }}>
    {/* Summary */}
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 10, justifyContent: "space-around" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, color: "var(--ok)", fontWeight: 500 }}>{contracted}</div>
          <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Contractați</div>
        </div>
        <div style={{ width: 1, background: "var(--bd)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, color: "#5A82B4", fontWeight: 500 }}>{negotiating}</div>
          <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Negociere</div>
        </div>
        <div style={{ width: 1, background: "var(--bd)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, color: "var(--gd)", fontWeight: 500 }}>{s.vendors.length}</div>
          <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Total</div>
        </div>
      </div>
    </Card>

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Furnizori</span>
      <button onClick={() => { setEditing(null); setShowForm(true) }} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--g)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic.plus}</button>
    </div>

    {s.vendors.length === 0 && <Card style={{ padding: 20, textAlign: "center" }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>📇</div>
      <div style={{ fontSize: 13, color: "var(--mt)" }}>Adaugă primul furnizor</div>
    </Card>}

    {s.vendors.map(v => {
      const isExpanded = expandedId === v.id;
      return (
        <Card key={v.id} style={{ marginBottom: 7, padding: 0, overflow: "hidden" }}>
          <div onClick={() => setExpandedId(isExpanded ? null : v.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--cr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {catIcon[v.cat] || "📦"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{v.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <Badge c={stC[v.status]}>{stIcon[v.status]} {stL[v.status]}</Badge>
                {v.rating > 0 && <span style={{ fontSize: 10, color: "var(--gd)", fontWeight: 600 }}>{"★".repeat(v.rating)} <span style={{ color: "var(--mt)", fontWeight: 400 }}>{ratingLabels[v.rating]}</span></span>}
              </div>
            </div>
            <span style={{ color: "var(--ft)", transition: "transform .2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>{ic.chevD}</span>
          </div>

          {isExpanded && <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--bd)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 0" }}>
              {v.cat && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: "var(--mt)", minWidth: 70 }}>Categorie</span>
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>{v.cat}</span>
              </div>}
              {v.phone && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: "var(--mt)", minWidth: 70 }}>Telefon</span>
                <span style={{ fontWeight: 600, color: "var(--gd)" }}>{v.phone}</span>
              </div>}
              {v.email && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: "var(--mt)", minWidth: 70 }}>Email</span>
                <span style={{ fontWeight: 500, color: "var(--ink)" }}>{v.email}</span>
              </div>}
              {v.notes && <div style={{ fontSize: 11, color: "var(--gr)", fontStyle: "italic", padding: "6px 10px", background: "var(--cr)", borderRadius: 8, marginTop: 2 }}>📝 {v.notes}</div>}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <Btn v="secondary" onClick={() => { setEditing(v); setShowForm(true) }} full style={{ fontSize: 11 }}>{ic.edit} Editează</Btn>
            </div>
          </div>}
        </Card>
      );
    })}
    <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare furnizor" : "Furnizor nou"}>
      {showForm && <VendorFormInner vendor={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
    </Modal>
  </div>);
}
function VendorFormInner({ vendor, onClose }) {
  const { s, d } = useContext(Ctx); const [f, setF] = useState(vendor ? { ...vendor } : { name: "", cat: "Locație", phone: "", email: "", status: "potential", rating: 3, notes: "" }); const u = k => v => setF(x => ({ ...x, [k]: v })); const [showConfirm, setShowConfirm] = useState(false);
  const ratingLabels = ["", "Slab", "Acceptabil", "Bun", "Foarte bun", "Excelent"];
  return <>
    <Fld label="Nume furnizor" value={f.name} onChange={u("name")} placeholder="Numele firmei sau persoanei" />
    <Fld label="Categorie" value={f.cat} onChange={u("cat")} options={["Locație", "Catering", "Fotograf", "Muzică", "Floristică", "Transport", "Altele"]} />
    <Fld label="Status" value={f.status} onChange={u("status")} options={[{ value: "potential", label: "🔍 Potențial" }, { value: "contacted", label: "📩 Contactat" }, { value: "negotiating", label: "🤝 Negociere" }, { value: "contracted", label: "✅ Contractat" }]} />
    <Fld label="Telefon" value={f.phone} onChange={u("phone")} placeholder="+40..." />
    <Fld label="Email" value={f.email} onChange={u("email")} type="email" placeholder="email@furnizor.ro" />
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Evaluare: <span style={{ color: "var(--gd)", textTransform: "none" }}>{ratingLabels[f.rating || 0]}</span></label>
      <div style={{ display: "flex", gap: 4 }}>
        {[1,2,3,4,5].map(i => (
          <button key={i} onClick={() => u("rating")(i)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, textAlign: "center", border: `2px solid ${i <= f.rating ? "var(--g)" : "var(--bd)"}`, background: i <= f.rating ? "rgba(184,149,106,.08)" : "var(--cr)", transition: "all .15s" }}>
            <div style={{ fontSize: 14 }}>{i <= f.rating ? "★" : "☆"}</div>
            <div style={{ fontSize: 8, color: i <= f.rating ? "var(--gd)" : "var(--mt)", fontWeight: 600 }}>{ratingLabels[i]}</div>
          </button>
        ))}
      </div>
    </div>
    <Fld label="Note" value={f.notes} onChange={u("notes")} type="textarea" placeholder="Detalii contract, prețuri, observații..." />
    <div style={{ display: "flex", gap: 8 }}>
      <Btn full onClick={() => { if (vendor) d({ type: "SET", p: { vendors: s.vendors.map(v => v.id === vendor.id ? { ...v, ...f } : v) } }); else d({ type: "SET", p: { vendors: [...s.vendors, { ...f, id: mkid() }] } }); onClose() }} disabled={!f.name}>Salvează</Btn>
      {vendor && <Btn v="danger" onClick={() => setShowConfirm(true)}>{ic.trash}</Btn>}
    </div>
    {vendor && <ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={() => { d({ type: "SET", p: { vendors: s.vendors.filter(v => v.id !== vendor.id) } }); onClose() }} title="Șterge furnizorul?" message={`"${vendor?.name}" va fi eliminat.`} />}
  </>;
}
function VendorsInline() {
  const { s, d } = useContext(Ctx); const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState(null);
  const stL = { contracted: "Contractat", negotiating: "Negociere", contacted: "Contactat", potential: "Potențial" };
  const stC = { contracted: "green", negotiating: "blue", contacted: "gold", potential: "gray" };
  const stIcon = { contracted: "✅", negotiating: "🤝", contacted: "📩", potential: "🔍" };
  const catIcon = { "Locație": "📍", "Catering": "🍽️", "Fotograf": "📸", "Muzică": "🎵", "Floristică": "💐", "Transport": "🚗", "Altele": "📦" };
  const ratingLabels = ["", "Slab", "Acceptabil", "Bun", "Foarte bun", "Excelent"];
  return (<>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>{s.vendors.length} furnizori</span>
      <Btn v="secondary" onClick={() => { setEditing(null); setShowForm(true) }} style={{ fontSize: 10, padding: "4px 10px" }}>{ic.plus} Nou</Btn>
    </div>
    {s.vendors.map(v => (
      <Card key={v.id} onClick={() => { setEditing(v); setShowForm(true) }} style={{ marginBottom: 7, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--cr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{catIcon[v.cat] || "📦"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>{v.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <Badge c={stC[v.status]}>{stIcon[v.status]} {stL[v.status]}</Badge>
              {v.rating > 0 && <span style={{ fontSize: 10, color: "var(--gd)" }}>{"★".repeat(v.rating)} {ratingLabels[v.rating]}</span>}
            </div>
          </div>
        </div>
      </Card>
    ))}
    <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare" : "Furnizor nou"}>
      {showForm && <VendorFormInner vendor={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
    </Modal>
  </>);
}

// ═══════════════════════════════════════════════════════════════
// 📥 CSV IMPORT
// ═══════════════════════════════════════════════════════════════
function ImportCSV({ open, onClose }) {
  const { s, d, showToast } = useContext(Ctx);
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState([]);
  const groups = s.groups || ["Prieteni"];

  const parse = (text) => {
    const lines = text.trim().split("\n").filter(l => l.trim());
    const guests = [];
    for (const line of lines) {
      // Support: "Name, Group, Dietary" or just "Name"
      const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ""));
      if (parts[0] && parts[0].length > 1) {
        guests.push({
          id: mkid(),
          name: parts[0],
          group: parts[1] && groups.includes(parts[1]) ? parts[1] : groups[0],
          rsvp: "pending",
          dietary: parts[2] || "",
          tid: null,
          notes: parts[3] || "",
        });
      }
    }
    return guests;
  };

  useEffect(() => { if (raw) setPreview(parse(raw)); else setPreview([]); }, [raw]);

  const doImport = () => {
    if (preview.length === 0) return;
    d({ type: "IMPORT_GUESTS", p: preview });
    showToast?.(`${preview.length} invitați importați!`, "success");
    setRaw("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Import invitați">
      <div style={{ fontSize: 12, color: "var(--mt)", marginBottom: 10 }}>
        Lipește lista de invitați, câte un rând per invitat. Format: <b>Nume, Grup, Restricții</b> (doar numele e obligatoriu).
      </div>
      <textarea value={raw} onChange={e => setRaw(e.target.value)} placeholder={"Maria Popescu, Familie Mireasă, vegetarian\nIon Ionescu, Familie Mire\nElena Dragomir"} rows={6} style={{ width: "100%", padding: "11px 13px", background: "var(--cr)", border: "1.5px solid var(--bd)", borderRadius: "var(--rs)", fontSize: 13, fontFamily: "monospace", resize: "vertical", marginBottom: 10 }} />
      {preview.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ok)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>
            ✓ {preview.length} invitați detectați
          </div>
          <div style={{ maxHeight: 120, overflow: "auto", borderRadius: "var(--rs)", border: "1px solid var(--bd)" }}>
            {preview.slice(0, 10).map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderTop: i ? "1px solid var(--bd)" : "none", fontSize: 12 }}>
                <span style={{ fontWeight: 600, flex: 1 }}>{g.name}</span>
                <Badge c="gold">{g.group}</Badge>
                {g.dietary && <Badge c="rose">{g.dietary}</Badge>}
              </div>
            ))}
            {preview.length > 10 && <div style={{ padding: "6px 10px", fontSize: 11, color: "var(--mt)" }}>...și încă {preview.length - 10}</div>}
          </div>
        </div>
      )}
      <Btn full onClick={doImport} disabled={preview.length === 0}>Importă {preview.length} invitați</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🎉 ONBOARDING WIZARD
// ═══════════════════════════════════════════════════════════════
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [couple, setCouple] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [budget, setBudget] = useState(15000);
  const [guestCount, setGuestCount] = useState(100);

  const steps = [
    { title: "Cine se căsătorește?", sub: "Spune-ne numele mirilor" },
    { title: "Când și unde?", sub: "Data și locul nunții" },
    { title: "Planificarea", sub: "Buget estimat și număr de invitați" },
  ];

  const canNext = step === 0 ? couple.length > 2 : step === 1 ? date : true;

  const finish = () => {
    const tablesCount = Math.ceil(guestCount / 8);
    const tables = Array.from({ length: tablesCount }, (_, i) => ({
      id: mkid(), name: i === 0 ? "Masa Mirilor" : `Masa ${i}`, seats: i === 0 ? 6 : 8, shape: i === 0 ? "rectangular" : "round", notes: "",
    }));
    const defaultBudget = [
      { id: mkid(), cat: "Locație", planned: Math.round(budget * 0.2), spent: 0, vendor: venue, status: "unpaid", notes: "" },
      { id: mkid(), cat: "Catering", planned: Math.round(budget * 0.35), spent: 0, vendor: "", status: "unpaid", notes: "" },
      { id: mkid(), cat: "Fotograf/Video", planned: Math.round(budget * 0.1), spent: 0, vendor: "", status: "unpaid", notes: "" },
      { id: mkid(), cat: "Muzică", planned: Math.round(budget * 0.08), spent: 0, vendor: "", status: "unpaid", notes: "" },
      { id: mkid(), cat: "Floristică", planned: Math.round(budget * 0.07), spent: 0, vendor: "", status: "unpaid", notes: "" },
      { id: mkid(), cat: "Rochie & Costum", planned: Math.round(budget * 0.1), spent: 0, vendor: "", status: "unpaid", notes: "" },
      { id: mkid(), cat: "Altele", planned: Math.round(budget * 0.1), spent: 0, vendor: "", status: "unpaid", notes: "" },
    ];
    const defaultTasks = [
      { id: mkid(), title: "Rezervă locația", due: "", status: "pending", prio: "high", cat: "Locație" },
      { id: mkid(), title: "Alege fotograful", due: "", status: "pending", prio: "medium", cat: "Fotograf" },
      { id: mkid(), title: "Trimite invitațiile", due: "", status: "pending", prio: "high", cat: "Invitații" },
      { id: mkid(), title: "Degustare meniu", due: "", status: "pending", prio: "medium", cat: "Catering" },
      { id: mkid(), title: "Probă rochie", due: "", status: "pending", prio: "medium", cat: "Rochie" },
      { id: mkid(), title: "Alege muzica/DJ", due: "", status: "pending", prio: "low", cat: "Muzică" },
    ];
    onComplete({
      wedding: { couple, date, venue, budget: Number(budget) },
      groups: ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"],
      guests: [], tables, budget: defaultBudget, tasks: defaultTasks, vendors: [],
      onboarded: true, activity: [{ id: mkid(), msg: "Nuntă configurată!", ts: new Date().toISOString() }],
    });
  };

  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(155deg,#1A1A1A,#28221C,#1A1A1A)", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, background: "radial-gradient(circle,rgba(184,149,106,.12),transparent 70%)", borderRadius: "50%" }} />
      <div style={{ flex: "0 0 auto", padding: "48px 28px 0", textAlign: "center", position: "relative", zIndex: 1 }}>
        <img src={LOGO_SM} alt="Wedify" style={{ width: 80, height: 80, objectFit: "contain", marginBottom: 8 }} />
        <h1 style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 400, color: "var(--gl)", marginBottom: 4 }}>Bine ai venit!</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>Hai să configurăm nunta ta în 3 pași simpli</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "20px 0 10px" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i <= step ? "var(--g)" : "rgba(255,255,255,.15)", transition: "all .3s" }} />
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 22px", position: "relative", zIndex: 1 }}>
        <div style={{ background: "rgba(255,255,255,.035)", backdropFilter: "blur(16px)", borderRadius: 18, padding: "28px 20px", border: "1px solid rgba(255,255,255,.05)" }}>
          <h2 style={{ fontFamily: "var(--fd)", fontSize: 20, color: "#fff", textAlign: "center", marginBottom: 4 }}>{steps[step].title}</h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", textAlign: "center", marginBottom: 22 }}>{steps[step].sub}</p>

          {step === 0 && (
            <input value={couple} onChange={e => setCouple(e.target.value)} placeholder="Alexandra & Mihai" style={{ width: "100%", padding: "14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 16, textAlign: "center", fontFamily: "var(--fd)" }} />
          )}

          {step === 1 && <>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", padding: "13px 14px", marginBottom: 10, borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 15 }} />
            <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Locul nunții (opțional)" style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 15 }} />
          </>}

          {step === 2 && <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>Buget estimat (€)</label>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)} style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 18, fontFamily: "var(--fd)", textAlign: "center" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>Câți invitați aștepți (aproximativ)?</label>
              <input type="number" value={guestCount} onChange={e => setGuestCount(e.target.value)} style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 18, fontFamily: "var(--fd)", textAlign: "center" }} />
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", textAlign: "center", marginTop: 6 }}>
                Vom genera automat {Math.ceil(guestCount / 8)} mese + categorii buget + task-uri inițiale
              </div>
            </div>
          </>}

          <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
            {step > 0 && <button onClick={() => setStep(step - 1)} style={{ flex: 1, padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.6)", fontSize: 14 }}>Înapoi</button>}
            <button onClick={() => step < 2 ? setStep(step + 1) : finish()} disabled={!canNext} style={{ flex: 1, padding: 14, borderRadius: 12, background: canNext ? "linear-gradient(135deg,var(--g),var(--gd))" : "rgba(255,255,255,.1)", color: canNext ? "#fff" : "rgba(255,255,255,.3)", fontSize: 14, fontWeight: 600, opacity: canNext ? 1 : .5 }}>
              {step < 2 ? "Continuă" : "Începe planificarea →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🧰 TOOLS MODULE — Unelte utile
// ═══════════════════════════════════════════════════════════════
function ToolsMod() {
  const [active, setActive] = useState(null);
  const tools = [
    { k: "menu", l: "Calculator Meniu", icon: "🍽️", desc: "Sumar restricții + cantități catering" },
    { k: "wday", l: "Ziua Nunții", icon: "📋", desc: "Sumar printabil cu tot ce trebuie" },
    { k: "vendors", l: "Furnizori", icon: "📇", desc: "Gestionare și comparare furnizori" },
  ];
  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      {!active && tools.map(t => (
        <Card key={t.k} onClick={() => setActive(t.k)} style={{ marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--cr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{t.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t.l}</div>
            <div style={{ fontSize: 11, color: "var(--mt)" }}>{t.desc}</div>
          </div>
          <span style={{ color: "var(--ft)" }}>{ic.chevD}</span>
        </Card>
      ))}
      {active && <>
        <button onClick={() => setActive(null)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--gd)", fontWeight: 600, marginBottom: 12, padding: "4px 0" }}>← Înapoi la Unelte</button>
        {active === "menu" && <MenuCalc />}
        {active === "wday" && <WeddingDay />}
        {active === "vendors" && <VendorsInline />}
      </>}
    </div>
  );
}

// ── SFATURI ORGANIZARE NUNTĂ ──────────────────────────────────
function WeddingTips() {
  const [open, setOpen] = useState(null);
  const tips = [
    { cat: "📍 Locație", items: [
      "Vizitează locația la aceeași oră la care va fi nunta — lumina naturală contează",
      "Întreabă despre planul B în caz de ploaie (terasă acoperită, cort de rezervă)",
      "Verifică dacă locația permite artificii / lampionuri / DJ extern",
      "Negociază pachetul: multe locații includ catering + decor în preț",
      "Rezervă locația cu minim 10-12 luni înainte, mai ales pentru weekend-uri de vară",
    ]},
    { cat: "🍽️ Catering & Meniu", items: [
      "Programează degustarea cu minim 3 firme diferite înainte de a semna",
      "Pune meniu de copii separat (porții mai mici, mâncare simplă)",
      "Comunică TOATE restricțiile alimentare cu 2 săptămâni înainte — nu în ultima zi",
      "Calculează ~120-150g carne + garnituri per persoană pentru bufet",
      "Prevezi 10-15% mai multă mâncare decât numărul final de invitați",
    ]},
    { cat: "📸 Foto & Video", items: [
      "Cere portofoliul complet de nunți (nu doar pozele selectate de fotograf)",
      "Discută lista de poze obligatorii: cuplu, familie, nași, grupuri",
      "Stabilește clar: câte ore, second shooter, album inclus, deadline livrare",
      "Pregătește o prima întâlnire cu fotograful înainte de nuntă (engagement shoot)",
      "Verifică recenziile pe Google/Facebook, nu doar portofoliul de pe site",
    ]},
    { cat: "👗 Ținute & Pregătiri", items: [
      "Comandă rochia cu 6-8 luni înainte — ajustările durează încă 2-3 luni",
      "Fă probă cu pantofii, voalul și accesoriile împreună — nu separat",
      "Costumul mirelui: comandat cu minim 3 luni înainte",
      "Rezervă makeup artist + coafeză cu probă de proba cu 2 luni înainte",
      "Ia o trusă de urgență: ac, ață, plasture, oglindă, spray, șervețele",
    ]},
    { cat: "🎵 Muzică & Atmosferă", items: [
      "DJ vs trupă: DJ-ul e mai flexibil pe genuri, trupa creează energie live",
      "Trimite o playlist cu must-play si never-play cu 2 saptamani inainte",
      "Primul dans: alege piesa cu 2+ luni înainte, exersează minim 3-4 ori",
      "Verifică echipamentul de sunet al locației vs ce aduce DJ-ul",
      "Momentele cheie: intrarea mirilor, primul dans, aruncatul buchetului — discută timing-ul",
    ]},
    { cat: "💐 Floristică & Decor", items: [
      "Alege flori de sezon — sunt mai proaspete și mai ieftine",
      "Cere mockup / schiță a aranjamentelor înainte de ziua nunții",
      "Gândește-te la reutilizare: buchetul miresei → aranjament masă la petrecere",
      "Stabilește cine montează și demontează decorul — și la ce oră",
      "Luminile ambientale (fairy lights, lumânări) fac mai mult decât florile scumpe",
    ]},
    { cat: "💰 Buget & Negocieri", items: [
      "Pune deoparte 10-15% din buget ca fond de urgență — mereu apar extra",
      "Negociază: cere discount la plata integrală sau în avans",
      "Compară mereu 3 oferte pe aceeași categorie (nu doar preț, ci și ce include)",
      "Citește contractul cu atenție: politica de anulare, penalizări, ce e inclus",
      "Ține o evidență a TUTUROR plăților (avans, rate, sold) — nu te baza pe memorie",
    ]},
    { cat: "📋 Ziua Nunții", items: [
      "Desemnează un coordonator de zi — nu tu, nu mirele, cineva dedicat",
      "Printează programul zilei pentru: locație, DJ, fotograf, nași, coordonator",
      "Mănâncă dimineața! Mirii uită mereu și leșină la ceremonie",
      "Pregătește o geantă cu: încărcător, apă, snackuri, aspirină, bani cash",
      "Momentele de liniște: programează 15 min doar voi doi între ceremonie și petrecere",
    ]},
  ];

  return (
    <div>
      <Card style={{ marginBottom: 12, padding: 14, background: "rgba(184,149,106,.04)", border: "1px solid rgba(184,149,106,.15)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gd)", marginBottom: 4 }}>💡 Ghid practic</div>
        <div style={{ fontSize: 13, color: "var(--ink)" }}>Sfaturi testate de sute de cupluri. Apasă pe o categorie pentru detalii.</div>
      </Card>
      {tips.map((section, i) => (
        <Card key={i} style={{ marginBottom: 6, padding: 0, overflow: "hidden" }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{section.cat}</span>
            <span style={{ fontSize: 11, color: "var(--mt)", display: "flex", alignItems: "center", gap: 4 }}>{section.items.length} sfaturi <span style={{ transform: open === i ? "rotate(90deg)" : "none", transition: "transform .2s", display: "inline-flex" }}>{ic.chevD}</span></span>
          </button>
          {open === i && <div style={{ padding: "0 14px 14px" }}>
            {section.items.map((tip, j) => (
              <div key={j} style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: j ? "1px solid var(--bd)" : "none" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(184,149,106,.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 9, color: "var(--gd)", fontWeight: 700 }}>{j + 1}</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--gr)" }}>{tip}</div>
              </div>
            ))}
          </div>}
        </Card>
      ))}
    </div>
  );
}

// ── CALCULATOR MENIU ────────────────────────────────────────
function MenuCalc() {
  const { s } = useContext(Ctx);
  const conf = s.guests.filter(g => g.rsvp === "confirmed");
  const pend = s.guests.filter(g => g.rsvp === "pending");

  // Dietary breakdown
  const dietMap = {};
  conf.forEach(g => {
    const d = g.dietary?.trim().toLowerCase();
    if (d) dietMap[d] = (dietMap[d] || 0) + 1;
  });
  const confPpl = sumGuests(conf);
  const pendPpl = sumGuests(pend);
  const standard = confPpl - Object.values(dietMap).reduce((a, b) => a + b, 0);
  const dietList = Object.entries(dietMap).sort((a, b) => b[1] - a[1]);

  // Tag-based counts
  const childCount = conf.filter(g => (g.tags || []).includes("Copil")).reduce((a, g) => a + gCount(g), 0);
  const adultCount = Math.max(confPpl - childCount, 0);

  // Budget per guest — uses total budget, not magic catering lookup
  const tP = s.budget.reduce((a, b) => a + b.planned, 0);
  const tS = s.budget.reduce((a, b) => a + b.spent, 0);
  const wBudget = s.wedding.budget || tP;
  const costPerGuest = confPpl > 0 ? Math.round(wBudget / confPpl) : 0;

  const copyText = () => {
    let txt = `SUMAR MENIU — ${s.wedding.couple}\n${fmtD(s.wedding.date)} · ${s.wedding.venue}\n\n`;
    txt += `TOTAL CONFIRMAȚI: ${conf.length} invitați (${confPpl} persoane)\n`;
    txt += `  Adulți: ${adultCount}\n`;
    if (childCount > 0) txt += `  Copii: ${childCount}\n`;
    txt += `  Standard (fără restricții): ${standard}\n\n`;
    if (dietList.length > 0) {
      txt += `RESTRICȚII ALIMENTARE:\n`;
      dietList.forEach(([d, c]) => { txt += `  ${d.charAt(0).toUpperCase() + d.slice(1)}: ${c} ${c === 1 ? "persoană" : "persoane"}\n`; });
    }
    txt += `\nÎN AȘTEPTARE: ${pend.length} invitați (posibil +${pendPpl} persoane)\n`;
    txt += `\nBUGET TOTAL: ${fmtC(wBudget)}\n`;
    txt += `COST/INVITAT: ~${fmtC(costPerGuest)}\n`;
    navigator.clipboard?.writeText(txt);
  };

  return (
    <div>
      <Card style={{ marginBottom: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Sumar pentru catering</div>
          <Btn v="secondary" onClick={copyText} style={{ fontSize: 10, padding: "5px 10px" }}>📋 Copiază</Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div style={{ textAlign: "center", padding: "10px 0", background: "rgba(107,158,104,.06)", borderRadius: "var(--rs)" }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 28, color: "var(--ok)", fontWeight: 500 }}>{conf.length}</div>
            <div style={{ fontSize: 10, color: "var(--mt)", textTransform: "uppercase" }}>confirmați</div>
          </div>
          <div style={{ textAlign: "center", padding: "10px 0", background: "rgba(184,149,106,.06)", borderRadius: "var(--rs)" }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 28, color: "var(--g)", fontWeight: 500 }}>{adultCount}</div>
            <div style={{ fontSize: 10, color: "var(--mt)", textTransform: "uppercase" }}>adulți</div>
          </div>
          <div style={{ textAlign: "center", padding: "10px 0", background: "rgba(90,130,180,.06)", borderRadius: "var(--rs)" }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 28, color: "#5A82B4", fontWeight: 500 }}>{childCount}</div>
            <div style={{ fontSize: 10, color: "var(--mt)", textTransform: "uppercase" }}>copii</div>
          </div>
        </div>

        {/* Dietary breakdown */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gd)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Restricții alimentare</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ok)" }} />
            <span style={{ flex: 1, fontSize: 13 }}>Standard (fără restricții)</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ok)" }}>{standard}</span>
          </div>
          {dietList.map(([d, c]) => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--er)" }} />
              <span style={{ flex: 1, fontSize: 13, textTransform: "capitalize" }}>{d}</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--er)" }}>{c}</span>
            </div>
          ))}
          {dietList.length === 0 && <div style={{ fontSize: 12, color: "var(--mt)", fontStyle: "italic" }}>Nicio restricție alimentară înregistrată</div>}
        </div>

        {/* Pending warning */}
        {pend.length > 0 && <div style={{ padding: "8px 12px", borderRadius: "var(--rs)", background: "rgba(201,160,50,.06)", border: "1px solid rgba(201,160,50,.15)", marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "var(--wn)", fontWeight: 600 }}>⚠ {pend.length} invitați în așteptare</div>
          <div style={{ fontSize: 11, color: "var(--mt)" }}>Planifică cu o marjă de +{pend.length} persoane</div>
        </div>}

        {/* Cost estimate */}
        <div style={{ padding: "10px 12px", borderRadius: "var(--rs)", background: "var(--cr)", border: "1px solid var(--bd)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "var(--mt)" }}>Buget total nuntă</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gd)" }}>{fmtC(wBudget)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "var(--mt)" }}>Cost per invitat (total)</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--g)" }}>~{fmtC(costPerGuest)}</span>
          </div>
        </div>
      </Card>

      {/* Per-group breakdown */}
      <Card style={{ padding: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Per grup</div>
        {(() => {
          const gs = {};
          conf.forEach(g => { const k = g.group || "Altele"; if (!gs[k]) gs[k] = { total: 0, diet: 0, kids: 0 }; gs[k].total++; if (g.dietary) gs[k].diet++; if ((g.tags || []).includes("Copil")) gs[k].kids++; });
          return Object.entries(gs).map(([name, v]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--bd)" }}>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{name}</span>
              <Badge c="green">{v.total}</Badge>
              {v.diet > 0 && <Badge c="rose">{v.diet} restricții</Badge>}
              {v.kids > 0 && <Badge c="blue">{v.kids} copii</Badge>}
            </div>
          ));
        })()}
      </Card>
    </div>
  );
}

// ── CHECKLIST INTELIGENT ─────────────────────────────────────
function SmartChecklist() {
  const { s, d } = useContext(Ctx);
  const wDate = new Date(s.wedding.date);
  const now = new Date();
  const days = Math.max(0, Math.ceil((wDate - now) / 864e5));
  const months = Math.round(days / 30);
  const conf = s.guests.filter(g => g.rsvp === "confirmed").length;
  const unseated = s.guests.filter(g => !g.tid && g.rsvp === "confirmed").length;
  const tP = s.budget.reduce((a, b) => a + b.planned, 0);
  const tS = s.budget.reduce((a, b) => a + b.spent, 0);

  const [addedTips, setAddedTips] = useState(new Set());
  const [dismissed, setDismissed] = useState(new Set());

  const suggestions = useMemo(() => {
    const tips = [];
    const taskTitles = s.tasks.map(t => t.title.toLowerCase().trim());
    const isCovered = (tipTitle) => {
      const tl = tipTitle.toLowerCase().trim();
      if (taskTitles.includes(tl)) return true;
      const words = tl.split(/\s+/).filter(w => w.length > 3);
      return taskTitles.some(tt => words.filter(w => tt.includes(w)).length >= 2);
    };

    if (unseated > 0) tips.push({ id: "alert_seats", t: "Alocă " + unseated + " invitați la mese", cat: "Mese", p: "high", why: unseated + " confirmați nu au loc alocat", alert: true });
    if (tS < tP && s.budget.length > 0) tips.push({ id: "alert_pay", t: "Verifică plățile restante (" + fmtC(tP - tS) + ")", cat: "Buget", p: months < 2 ? "high" : "medium", why: "Buget neplătit", alert: true });
    if (s.guests.length === 0) tips.push({ id: "alert_guests", t: "Adaugă primii invitați", cat: "Invitații", p: "high", why: "Lista e goală", alert: true });

    const add = (id, t, cat, p, why) => { if (!tips.some(x => x.id === id)) tips.push({ id, t, cat, p, why }); };

    if (months >= 8) {
      add("s_loc", "Rezervă locația nunții", "Locație", "high", "Se rezervă cu 1 an înainte");
      add("s_foto", "Alege fotograful", "Fotograf", "medium", "Cei buni au agenda plină");
      add("s_buget", "Stabilește bugetul detaliat", "Buget", "high", "Toate deciziile depind de el");
    }
    if (months >= 5 && months <= 8) {
      add("s_dj", "Contactează DJ/trupă", "Muzică", "medium", "Se rezervă repede");
      add("s_flor", "Contactează floristul", "Floristică", "low", "Discută sezonalitatea");
      add("s_cat", "Contactează firme de catering", "Catering", "high", "Compară 3 oferte");
      add("s_inv", "Trimite invitațiile", "Invitații", "high", "Dă 2 luni să răspundă");
    }
    if (months >= 2 && months <= 5) {
      add("s_roch", "Probă rochie + costum", "Ținute", "high", "Ajustările durează");
      add("s_tort", "Comandă tortul", "Catering", "medium", "Design personalizat");
      add("s_menu", "Confirmă meniul final", "Catering", "high", conf + " confirmați");
      add("s_prog", "Pregătește programul zilei", "General", "medium", "Coordonează cu MC");
    }
    if (days > 0 && days <= 45) {
      add("s_vfin", "Confirmare finală furnizori", "General", "high", "Sună pe toți");
      add("s_plic", "Pregătește plicuri + daruri nași", "General", "medium", "Tradiție");
      add("s_pfin", "Probă finală rochie/costum", "Ținute", "high", "Ultima ajustare");
      add("s_pmese", "Printează planul meselor", "Mese", "medium", "Pentru staff locație");
    }

    return tips.filter(tip => !isCovered(tip.t) && !addedTips.has(tip.id) && !dismissed.has(tip.id));
  }, [s.tasks, s.guests, s.budget, months, days, conf, unseated, tP, tS, addedTips, dismissed]);

  const addTip = (tip) => {
    d({ type: "ADD_TASK", p: { id: mkid(), title: tip.t, due: "", status: "pending", prio: tip.p, cat: tip.cat } });
    setAddedTips(prev => new Set([...prev, tip.id]));
  };

  const dismiss = (tipId) => {
    setDismissed(prev => new Set([...prev, tipId]));
  };

  const periodLabel = months >= 8 ? "Planificare timpurie (8+ luni)" : months >= 5 ? "Pregătire activă (5-8 luni)" : months >= 2 ? "Finalizare (2-5 luni)" : days > 0 ? "Ultimele pregătiri!" : "Ziua cea mare!";
  const alerts = suggestions.filter(t => t.alert);
  const recs = suggestions.filter(t => !t.alert);

  return (
    <div>
      {/* Header explicativ */}
      <Card style={{ marginBottom: 12, padding: 14, background: "rgba(184,149,106,.04)", border: "1px solid rgba(184,149,106,.15)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gd)", marginBottom: 6 }}>🧠 Cum funcționează</div>
        <div style={{ fontSize: 12, color: "var(--gr)", lineHeight: 1.6 }}>
          Analizăm progresul nunții tale și sugerăm ce ai de făcut. Apasă <span style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "1px 6px", borderRadius: 4, background: "var(--ok)", color: "#fff", fontSize: 10, fontWeight: 700 }}>✓ Adaugă</span> pentru a transforma o sugestie în task, sau <span style={{ display: "inline-flex", padding: "1px 6px", borderRadius: 4, background: "var(--cr2)", fontSize: 10, fontWeight: 600, color: "var(--mt)" }}>Nu e cazul</span> pentru a o ascunde.
        </div>
      </Card>

      {/* Status bar */}
      <Card style={{ marginBottom: 12, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Perioada</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gd)" }}>{periodLabel}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--g)" }}>{days}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>zile rămase</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--mt)" }}>
          <span>{s.tasks.filter(t => t.status === "done").length}/{s.tasks.length} tasks gata</span>
          <span>·</span>
          <span>{conf}/{s.guests.length} confirmați</span>
          <span>·</span>
          <span>{suggestions.length} sugestii</span>
        </div>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && <>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--er)", marginBottom: 6, paddingLeft: 2 }}>⚡ Necesită atenție</div>
        {alerts.map(tip => (
          <Card key={tip.id} style={{ marginBottom: 6, padding: "10px 14px", border: "1.5px solid rgba(184,92,92,.2)", background: "rgba(184,92,92,.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(184,92,92,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 11 }}>⚡</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{tip.t}</div>
                <div style={{ fontSize: 10, color: "var(--mt)" }}>{tip.why}</div>
              </div>
            </div>
          </Card>
        ))}
        <div style={{ height: 12 }} />
      </>}

      {/* Recommendations */}
      {recs.length > 0 && <>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gd)", marginBottom: 6, paddingLeft: 2 }}>📋 Sugestii pentru tine</div>
        {recs.map(tip => (
          <Card key={tip.id} style={{ marginBottom: 6, padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: tip.p === "high" ? "rgba(184,92,92,.1)" : "rgba(184,149,106,.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <span style={{ fontSize: 10 }}>{tip.p === "high" ? "🔴" : tip.p === "medium" ? "🟡" : "🟢"}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{tip.t}</div>
                <div style={{ fontSize: 11, color: "var(--mt)", marginTop: 1 }}>{tip.why}</div>
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  <Badge c="gold">{tip.cat}</Badge>
                  {tip.p === "high" && <Badge c="red">Urgent</Badge>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--bd)" }}>
              <button onClick={() => addTip(tip)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, background: "var(--ok)", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                ✓ Adaugă la Tasks
              </button>
              <button onClick={() => dismiss(tip.id)} style={{ padding: "7px 14px", borderRadius: 8, background: "var(--cr2)", color: "var(--mt)", fontSize: 11, fontWeight: 600 }}>
                Nu e cazul
              </button>
            </div>
          </Card>
        ))}
      </>}

      {/* All clear */}
      {suggestions.length === 0 && <Card style={{ padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Totul e în regulă!</div>
        <div style={{ fontSize: 12, color: "var(--mt)" }}>Toate sugestiile sunt acoperite sau adăugate la tasks.</div>
        {dismissed.size > 0 && <button onClick={() => setDismissed(new Set())} style={{ marginTop: 10, fontSize: 11, color: "var(--gd)", fontWeight: 600, padding: "5px 12px", borderRadius: 8, background: "rgba(184,149,106,.06)" }}>Arată sugestiile ascunse ({dismissed.size})</button>}
      </Card>}
    </div>
  );
}

// ── ZIUA NUNȚII — Dashboard editabil + printabil ─────────────
function WeddingDay() {
  const { s, d } = useContext(Ctx);
  const conf = s.guests.filter(g => g.rsvp === "confirmed");
  const dietMap = {};
  conf.forEach(g => { if (g.dietary?.trim()) { const k = g.dietary.trim().toLowerCase(); dietMap[k] = (dietMap[k] || 0) + 1 } });
  const keyContacts = s.vendors.filter(v => v.status === "contracted");
  const nasi = s.guests.filter(g => (g.tags || []).some(t => ["Naș/Nașă", "Martor"].includes(t)));

  const defaultProg = [
    { time: "14:00", ev: "Cununia civilă" }, { time: "15:00", ev: "Cununia religioasă" },
    { time: "16:00", ev: "Ședință foto" }, { time: "17:00", ev: "Sosirea invitaților" },
    { time: "17:30", ev: "Cocktail & aperitive" }, { time: "18:30", ev: "Intrarea mirilor" },
    { time: "19:00", ev: "Cina" }, { time: "20:30", ev: "Primul dans" },
    { time: "21:00", ev: "Petrecere & tort" }, { time: "00:00", ev: "Aruncatul buchetului" },
  ];
  const [prog, setProg] = useState(() => s.weddingDayProgram || defaultProg);
  const [editIdx, setEditIdx] = useState(-1);
  const [addMode, setAddMode] = useState(false);
  const [nt, setNt] = useState(""); const [ne, setNe] = useState("");
  const progChanged = useRef(false);

  // Only save when user actually modifies (not on initial render)
  const updateProg = (newProg) => { setProg(newProg); progChanged.current = true; };
  useEffect(() => { if (progChanged.current) { d({ type: "SET", p: { weddingDayProgram: prog } }); progChanged.current = false; } }, [prog]);

  const addItem = () => { if (!nt || !ne.trim()) return; updateProg([...prog, { time: nt, ev: ne.trim() }].sort((a, b) => a.time.localeCompare(b.time))); setNt(""); setNe(""); setAddMode(false); };
  const delItem = (i) => updateProg(prog.filter((_, j) => j !== i));
  const updItem = (i, k, v) => updateProg(prog.map((p, j) => j === i ? { ...p, [k]: v } : p));

  const printDay = () => {
    let h = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ziua Nunții — ${s.wedding.couple}</title>
    <style>body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1a1a1a;max-width:700px;margin:0 auto}h1{font-family:Georgia,serif;font-size:26px;color:#8A6D47;margin-bottom:2px}.sub{color:#999;font-size:12px;margin-bottom:28px}h2{font-size:15px;color:#8A6D47;margin:22px 0 8px;border-bottom:1px solid #E5DFD5;padding-bottom:5px}.row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #F0EAE0;font-size:13px}.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:rgba(184,149,106,.1);color:#8A6D47;margin:2px}table{width:100%;border-collapse:collapse}th{text-align:left;font-size:11px;color:#999;text-transform:uppercase;padding:4px 8px;border-bottom:2px solid #E5DFD5}td{padding:6px 8px;border-bottom:1px solid #F0EAE0;font-size:12px}.footer{margin-top:30px;text-align:center;font-size:10px;color:#ccc}@media print{body{padding:20px}}</style></head><body>
    <h1>Ziua Nunții</h1><div class="sub">${s.wedding.couple} · ${fmtD(s.wedding.date)} · ${s.wedding.venue}</div>
    <h2>Program</h2>`;
    prog.forEach(p => { h += `<div class="row"><b>${p.time}</b><span>${p.ev}</span></div>`; });
    h += `<h2>Cifre</h2><div class="row"><span>Confirmați</span><b>${conf.length}</b></div><div class="row"><span>Mese</span><b>${s.tables.length}</b></div>`;
    if (Object.keys(dietMap).length) { h += `<h2>Restricții alimentare</h2>`; Object.entries(dietMap).forEach(([k,v])=>{ h += `<div class="row"><span style="text-transform:capitalize">${k}</span><b>${v}</b></div>`; }); }
    if (nasi.length) { h += `<h2>Nași & Martori</h2>`; nasi.forEach(g => { h += `<div class="row"><span>${g.name}</span><span class="badge">${(g.tags||[]).find(t=>["Naș/Nașă","Martor"].includes(t))}</span></div>`; }); }
    if (keyContacts.length) { h += `<h2>Contacte furnizori</h2><table><tr><th>Furnizor</th><th>Categorie</th><th>Telefon</th></tr>`; keyContacts.forEach(v => { h += `<tr><td><b>${v.name}</b></td><td>${v.cat}</td><td>${v.phone||"—"}</td></tr>`; }); h += `</table>`; }
    h += `<h2>Plan mese</h2>`;
    s.tables.forEach(t => { const seated = s.guests.filter(g => g.tid === t.id); h += `<div style="margin-bottom:10px"><b>${t.name}</b> (${seated.length}/${t.seats})<br/>`; seated.forEach(g => { h += `<span class="badge">${g.name}${g.dietary?" ⚠":""}</span> `; }); if(!seated.length) h += `<span style="color:#ccc;font-size:12px">Goală</span>`; h += `</div>`; });
    h += `<div class="footer">Generat de Wedify · ${new Date().toLocaleDateString("ro-RO")}</div></body></html>`;
    const w = window.open("", "_blank"); if (w) { w.document.write(h); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 500 }}>Ziua Nunții</div>
          <div style={{ fontSize: 11, color: "var(--mt)" }}>{fmtD(s.wedding.date)} · {s.wedding.venue}</div>
        </div>
        <Btn v="secondary" onClick={printDay} style={{ fontSize: 11, padding: "7px 14px" }}>🖨️ Printează</Btn>
      </div>

      {/* Key numbers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
        <Card style={{ padding: "10px 8px", textAlign: "center" }}><div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--ok)" }}>{conf.length}</div><div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>invitați</div></Card>
        <Card style={{ padding: "10px 8px", textAlign: "center" }}><div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--g)" }}>{s.tables.length}</div><div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>mese</div></Card>
        <Card style={{ padding: "10px 8px", textAlign: "center" }}><div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "#5A82B4" }}>{keyContacts.length}</div><div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>furnizori</div></Card>
      </div>

      {/* EDITABLE PROGRAM */}
      <Card style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>🕐 Programul zilei</div>
          <button onClick={() => setAddMode(!addMode)} style={{ fontSize: 10, fontWeight: 600, color: "var(--g)", padding: "3px 8px", borderRadius: 8, background: "rgba(184,149,106,.08)" }}>{addMode ? "✕ Anulează" : "+ Adaugă"}</button>
        </div>
        {addMode && <div style={{ display: "flex", gap: 6, marginBottom: 10, padding: 8, background: "var(--cr)", borderRadius: "var(--rs)" }}>
          <input type="time" value={nt} onChange={e => setNt(e.target.value)} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--bd)", background: "var(--cd)", fontSize: 12, width: 90 }} />
          <input value={ne} onChange={e => setNe(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()} placeholder="Eveniment..." style={{ flex: 1, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--bd)", background: "var(--cd)", fontSize: 12 }} />
          <button onClick={addItem} disabled={!nt || !ne.trim()} style={{ width: 32, height: 32, borderRadius: 8, background: "var(--g)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: nt && ne.trim() ? 1 : .4 }}>{ic.plus}</button>
        </div>}
        {prog.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 1, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? "var(--g)" : "var(--ft)", flexShrink: 0 }} />
              {i < prog.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 14, background: "var(--bd)" }} />}
            </div>
            {editIdx === i ? <div style={{ flex: 1, display: "flex", gap: 4, paddingBottom: 5 }}>
              <input type="time" value={p.time} onChange={e => updItem(i, "time", e.target.value)} style={{ padding: "3px 6px", borderRadius: 6, border: "1px solid var(--g)", fontSize: 11, width: 80, background: "var(--cd)" }} />
              <input value={p.ev} onChange={e => updItem(i, "ev", e.target.value)} style={{ flex: 1, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--g)", fontSize: 11, background: "var(--cd)" }} />
              <button onClick={() => setEditIdx(-1)} style={{ fontSize: 10, color: "var(--ok)", fontWeight: 700, padding: "0 4px" }}>✓</button>
            </div> : <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, paddingBottom: 5 }}>
              <span style={{ fontSize: 11, color: "var(--gd)", fontWeight: 700, minWidth: 38 }}>{p.time}</span>
              <span style={{ fontSize: 12, flex: 1 }}>{p.ev}</span>
              <button onClick={() => setEditIdx(i)} style={{ padding: 2, color: "var(--mt)", opacity: .5 }}>{ic.edit}</button>
              <button onClick={() => delItem(i)} style={{ padding: 2, color: "var(--ft)", opacity: .5 }}>{ic.x}</button>
            </div>}
          </div>
        ))}
      </Card>

      {/* Nași */}
      {nasi.length > 0 && <Card style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 6 }}>👑 Nași & Martori</div>
        {nasi.map(g => (
          <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--bd)" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--cr2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--gd)" }}>{g.name[0]}</div>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{g.name}</span>
            <Badge c="gold">{(g.tags || []).find(t => ["Naș/Nașă", "Martor"].includes(t))}</Badge>
          </div>
        ))}
      </Card>}

      {/* Contacte furnizori */}
      {keyContacts.length > 0 && <Card style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 6 }}>📞 Contacte furnizori</div>
        {keyContacts.map(v => (
          <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--bd)" }}>
            <span style={{ flex: 1 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</span><span style={{ fontSize: 11, color: "var(--mt)", marginLeft: 6 }}>{v.cat}</span></span>
            {v.phone && <span style={{ fontSize: 12, color: "var(--gd)", fontWeight: 500 }}>{v.phone}</span>}
          </div>
        ))}
      </Card>}

      {/* Restricții */}
      {Object.keys(dietMap).length > 0 && <Card>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 6 }}>⚠ Restricții alimentare</div>
        {Object.entries(dietMap).map(([k, c]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--bd)" }}>
            <span style={{ fontSize: 12, textTransform: "capitalize" }}>{k}</span>
            <Badge c="rose">{c} pers.</Badge>
          </div>
        ))}
      </Card>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP (Supabase Production)
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [s, dispatch] = useReducer(reducer, DATA);
  const [tab, setTab] = useState("home");
  const [showSettings, setShowSettings] = useState(false);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [theme, setTheme] = useState("light");
  const [authUser, setAuthUser] = useState(null); // Supabase auth user
  const [authLoading, setAuthLoading] = useState(true); // checking session
  const [dataLoading, setDataLoading] = useState(false);
  const [weddingId, setWeddingId] = useState(null);

  // ── Check Supabase session on mount ──
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setAuthLoading(false); return; }

    // Get current session
    sb.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user);
      setAuthLoading(false);
    });

    // Listen for auth changes (login/logout/token refresh)
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;
      setAuthUser(user);
      if (event === 'SIGNED_OUT') {
        dispatch({ type: "SET", p: { ...DATA, onboarded: false } });
        setWeddingId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load data from Supabase when user logs in ──
  useEffect(() => {
    if (!authUser) return;
    setDataLoading(true);
    loadAllData(authUser.id).then(data => {
      if (data) {
        dispatch({ type: "SET", p: data });
        setWeddingId(data.weddingId);
      }
      setDataLoading(false);
    }).catch(() => setDataLoading(false));
  }, [authUser]);

  // ── Sync reducer actions to Supabase ──
  const d = (action) => {
    dispatch(action);
    // Fire & forget DB sync
    const wid = weddingId;
    if (!wid) return;
    const p = action.p;
    switch (action.type) {
      case "SET":
        if (p.wedding) dbSync.updateWedding(wid, { ...p.wedding, groups: p.groups, tags: p.tags, onboarded: p.onboarded });
        break;
      case "ADD_GUEST": dbSync.addGuest(wid, p).then(row => { if (row) dispatch({ type: "UPD_GUEST", p: { id: p.id, ...row, tid: row.table_id } }); }); break;
      case "UPD_GUEST": dbSync.updateGuest(p.id, p); break;
      case "DEL_GUEST": dbSync.deleteGuest(p); break;
      case "IMPORT_GUESTS": dbSync.bulkInsertGuests(wid, p).then(rows => { if (rows.length) { const mapped = rows.map(r => ({ ...r, tid: r.table_id })); dispatch({ type: "SET_GUESTS_IMPORTED", p: mapped }); } }); break;
      case "ADD_TABLE": dbSync.addTable(wid, p).then(row => { if (row) dispatch({ type: "UPD_TABLE", p: { id: p.id, ...row } }); }); break;
      case "UPD_TABLE": dbSync.updateTable(p.id, p); break;
      case "DEL_TABLE": dbSync.deleteTable(p); break;
      case "ADD_BUDGET": dbSync.addBudgetItem(wid, p).then(row => { if (row) dispatch({ type: "UPD_BUDGET", p: { id: p.id, ...row, cat: row.category } }); }); break;
      case "UPD_BUDGET": dbSync.updateBudgetItem(p.id, p); break;
      case "DEL_BUDGET": dbSync.deleteBudgetItem(p); break;
      case "ADD_TASK": dbSync.addTask(wid, p).then(row => { if (row) dispatch({ type: "UPD_TASK", p: { id: p.id, ...row, prio: row.priority } }); }); break;
      case "UPD_TASK": dbSync.updateTask(p.id, p); break;
      case "DEL_TASK": dbSync.deleteTask(p); break;
      case "ADD_VENDOR": dbSync.addVendor(wid, p).then(row => { if (row) dispatch({ type: "UPD_VENDOR", p: { id: p.id, ...row } }); }); break;
      case "UPD_VENDOR": dbSync.updateVendor(p.id, p); break;
      case "DEL_VENDOR": dbSync.deleteVendor(p); break;
      case "SEAT": dbSync.updateGuest(p.guestId, { tid: p.tableId }); break;
      case "UNSEAT": dbSync.updateGuest(p, { tid: null }); break;
    }
  };

  const user = authUser ? { email: authUser.email, name: authUser.user_metadata?.name || authUser.email.split("@")[0], role: "admin" } : null;

  // Load theme
  useEffect(() => { loadTheme().then(t => { if (t) setTheme(t); }); }, []);
  useEffect(() => { saveTheme(theme); }, [theme]);

  const showToast = (message, type = "info") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  // Setup CSS + viewport
  useEffect(() => {
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    let m = document.querySelector('meta[name="viewport"]'); if (!m) { m = document.createElement("meta"); m.name = "viewport"; document.head.appendChild(m) }; m.content = "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover";
    setTimeout(() => setReady(true), 50);
    return () => document.head.removeChild(st);
  }, []);

  // Dark theme cascade
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.background = theme === "dark" ? "#1A1816" : "#FFFDF8";
    document.body.style.color = theme === "dark" ? "#E8E0D6" : "#1A1A1A";
  }, [theme]);

  // ── Loading screen ──
  if (authLoading || dataLoading) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(155deg,#1A1A1A,#28221C,#1A1A1A)" }}>
        <img src={LOGO_SM} alt="Wedify" style={{ width: 80, height: 80, objectFit: "contain", marginBottom: 16, opacity: 0.7 }} />
        <div style={{ width: 24, height: 24, border: "2px solid rgba(184,149,106,.3)", borderTopColor: "var(--g)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <p style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,.3)" }}>Se încarcă...</p>
      </div>
    );
  }

  // ── Not logged in → Auth Screen ──
  if (!authUser) {
    return <AuthScreen onLogin={() => {}} />;
  }

  // ── Onboarding (user exists but wedding not configured) ──
  if (!s.onboarded) {
    return <Onboarding onComplete={async (data) => {
      // Save onboarding data to Supabase
      if (weddingId) {
        await dbSync.updateWedding(weddingId, {
          couple: data.wedding.couple, date: data.wedding.date,
          venue: data.wedding.venue, budget: data.wedding.budget,
          groups: data.groups, onboarded: true,
        });
        // Bulk insert tables, budget, tasks
        const dbTables = await dbSync.bulkInsertTables(weddingId, data.tables);
        const dbBudget = await dbSync.bulkInsertBudget(weddingId, data.budget);
        const dbTasks = await dbSync.bulkInsertTasks(weddingId, data.tasks);
        // Reload all from DB to get real IDs
        const fresh = await loadAllData(authUser.id);
        if (fresh) { dispatch({ type: "SET", p: fresh }); setWeddingId(fresh.weddingId); }
      } else {
        d({ type: "SET", p: data });
      }
    }} />;
  }

  const overdueCount = s.tasks.filter(t => new Date(t.due) < new Date() && t.status !== "done").length;

  const tabs = [{ k: "home", l: "Acasă", i: ic.home }, { k: "guests", l: "Invitați", i: ic.users }, { k: "tables", l: "Mese", i: ic.tbl }, { k: "budget", l: "Buget", i: ic.wallet }, { k: "tasks", l: "Tasks", i: ic.chk }, { k: "tools", l: "Unelte", i: ic.settings }];
  const titles = { home: "Dashboard", guests: "Invitați", tables: "Aranjare Mese", budget: "Buget", tasks: "Timeline", tools: "Unelte" };

  return (
    <Ctx.Provider value={{ s, d, user, setShowSettings, showToast, theme, setTheme }}>
      <div data-theme={theme} style={{ width: "100%", maxWidth: 460, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--ink)", opacity: ready ? 1 : 0, transition: "opacity .3s" }}>
        <header style={{ height: "var(--hd)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderBottom: "1px solid var(--bd)", background: theme === "dark" ? "rgba(26,24,22,.92)" : "rgba(255,253,248,.92)", backdropFilter: "blur(12px)", flexShrink: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><img src={LOGO_XS} alt="Wedify" style={{ width: 28, height: 28, objectFit: "contain" }} /><span style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 500 }}>{titles[tab]}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <button onClick={() => setShowSettings(true)} style={{ padding: 5, color: "var(--mt)" }}>{ic.settings}</button>
          </div>
        </header>

        <main style={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", paddingTop: 12, paddingBottom: "calc(var(--nv) + 20px)" }}>
          {tab === "home" && <Home />}
          {tab === "guests" && <Guests />}
          {tab === "tables" && <TablesList />}
          {tab === "budget" && <BudgetMod />}
          {tab === "tasks" && <TasksMod />}
          {tab === "tools" && <ToolsMod />}
        </main>

        <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 460, height: "var(--nv)", display: "flex", alignItems: "center", justifyContent: "space-around", background: theme === "dark" ? "rgba(26,24,22,.95)" : "rgba(255,253,248,.95)", backdropFilter: "blur(14px)", borderTop: "1px solid var(--bd)", paddingBottom: "env(safe-area-inset-bottom,4px)", zIndex: 100 }}>
          {tabs.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "5px 2px", minWidth: 44, color: tab === t.k ? "var(--gd)" : "var(--mt)", transition: "all .2s", position: "relative" }}>
              {tab === t.k && <div style={{ position: "absolute", top: -1, width: 18, height: 2, borderRadius: 1, background: "var(--g)" }} />}
              {t.k === "tasks" && overdueCount > 0 && (
                <div style={{ position: "absolute", top: 0, right: 2, width: 16, height: 16, borderRadius: "50%", background: "var(--er)", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{overdueCount}</div>
              )}
              <span style={{ transform: tab === t.k ? "scale(1.08)" : "scale(1)", transition: "transform .2s" }}>{t.i}</span>
              <span style={{ fontSize: 8, fontWeight: tab === t.k ? 700 : 500, letterSpacing: ".04em", textTransform: "uppercase" }}>{t.l}</span>
            </button>
          ))}
        </nav>

        <Toast message={toast.message} visible={toast.visible} type={toast.type} />
        <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </Ctx.Provider>
  );
}
