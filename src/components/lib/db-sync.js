import { mkid, parseBudgetNotes, serializeBudgetNotes } from "./utils";
import { getSupabase } from "./supabase-client";

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
      guestTarget: Math.max(1, Number(wedding.guest_target) || Number(wedding.guestTarget) || 100),
      program: Array.isArray(wedding.program) ? wedding.program : [],
      theme: wedding.theme || '',
    },
    weddingId: wedding.id,
    groups: wedding.groups || ["Familie Mireasă","Familie Mire","Prieteni","Colegi"],
    tags: wedding.tags || ["Copil","Cazare","Parcare","Din alt oraș","Martor","Naș/Nașă"],
    onboarded: wedding.onboarded || false,
    guests: (g.data || []).map(x => ({ ...x, tid: x.table_id, group: x.group, count: x.count || 1 })),
    tables: (t.data || []).map(x => ({ ...x })),
    budget: (b.data || []).map(x => { const parsed = parseBudgetNotes(x.notes || ""); return { ...x, cat: x.category, notes: parsed.cleanNotes, payments: parsed.payments || [] }; }),
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
    if (data.guestTarget !== undefined) mapped.guest_target = Math.max(1, Number(data.guestTarget) || 1);
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

export { loadAllData, dbSync };
