import { mkid, parseBudgetNotes } from "./utils";
import { getSupabase } from "./supabase-client";

async function withRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}

async function loadAllData(userId) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: wedding } = await supabase.from('weddings').select('*').eq('user_id', userId).single();
  if (!wedding) return null;
  const [guests, tables, budgetItems, tasks, vendors] = await Promise.all([
    supabase.from('guests').select('*').eq('wedding_id', wedding.id).order('created_at'),
    supabase.from('tables').select('*').eq('wedding_id', wedding.id).order('sort_order'),
    supabase.from('budget_items').select('*').eq('wedding_id', wedding.id).order('created_at'),
    supabase.from('tasks').select('*').eq('wedding_id', wedding.id).order('due'),
    supabase.from('vendors').select('*').eq('wedding_id', wedding.id).order('created_at'),
  ]);

  return {
    wedding: {
      couple: wedding.couple || '',
      date: wedding.date || '',
      venue: wedding.venue || '',
      budget: Number(wedding.budget) || 15000,
      guestTarget: Math.max(1, Number(wedding.guest_target) || Number(wedding.guestTarget) || 100),
      program: Array.isArray(wedding.program) ? wedding.program : [],
      theme: wedding.theme || '',
    },
    weddingId: wedding.id,
    groups: wedding.groups || ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"],
    tags: wedding.tags || ["Copil", "Cazare", "Parcare", "Din alt oraș", "Martor", "Naș/Nașă"],
    onboarded: wedding.onboarded || false,
    guests: (guests.data || []).map(item => ({ ...item, tid: item.table_id, group: item.group, count: item.count || 1 })),
    tables: (tables.data || []).map(item => ({ ...item })),
    budget: (budgetItems.data || []).map(item => {
      const parsed = parseBudgetNotes(item.notes || "");
      return { ...item, cat: item.category, notes: parsed.cleanNotes, payments: parsed.payments || [] };
    }),
    tasks: (tasks.data || []).map(item => ({ ...item, prio: item.priority })),
    vendors: (vendors.data || []),
    activity: [{ id: mkid(), msg: "Date încărcate", ts: new Date().toISOString() }],
  };
}

const dbSync = {
  async updateWedding(weddingId, data) {
    const supabase = getSupabase(); if (!supabase || !weddingId) return;
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
    if (Object.keys(mapped).length > 0) await withRetry(() => supabase.from('weddings').update(mapped).eq('id', weddingId));
  },

  async addGuest(weddingId, guest) {
    const supabase = getSupabase(); if (!supabase || !weddingId) return null;
    const { data } = await withRetry(() => supabase.from('guests').insert({
      wedding_id: weddingId,
      name: guest.name,
      group: guest.group || 'Prieteni',
      rsvp: guest.rsvp || 'pending',
      dietary: guest.dietary || '',
      tags: guest.tags || [],
      notes: guest.notes || '',
      table_id: guest.tid || null,
      count: guest.count || 1,
    }).select().single());
    return data;
  },

  async updateGuest(id, data) {
    const supabase = getSupabase(); if (!supabase) return;
    const mapped = {};
    if (data.name !== undefined) mapped.name = data.name;
    if (data.group !== undefined) mapped.group = data.group;
    if (data.rsvp !== undefined) mapped.rsvp = data.rsvp;
    if (data.dietary !== undefined) mapped.dietary = data.dietary;
    if (data.tags !== undefined) mapped.tags = data.tags;
    if (data.notes !== undefined) mapped.notes = data.notes;
    if (data.tid !== undefined) mapped.table_id = data.tid;
    if (data.count !== undefined) mapped.count = data.count;
    if (Object.keys(mapped).length > 0) await withRetry(() => supabase.from('guests').update(mapped).eq('id', id));
  },

  async deleteGuest(id) {
    const supabase = getSupabase();
    if (supabase) await withRetry(() => supabase.from('guests').delete().eq('id', id));
  },

  async addTable(weddingId, table) {
    const supabase = getSupabase(); if (!supabase || !weddingId) return null;
    const { data } = await withRetry(() => supabase.from('tables').insert({
      wedding_id: weddingId,
      name: table.name,
      seats: table.seats || 8,
      shape: table.shape || 'round',
      notes: table.notes || '',
    }).select().single());
    return data;
  },

  async updateTable(id, data) {
    const supabase = getSupabase(); if (!supabase) return;
    const mapped = {};
    if (data.name !== undefined) mapped.name = data.name;
    if (data.seats !== undefined) mapped.seats = data.seats;
    if (data.shape !== undefined) mapped.shape = data.shape;
    if (data.notes !== undefined) mapped.notes = data.notes;
    if (Object.keys(mapped).length > 0) await withRetry(() => supabase.from('tables').update(mapped).eq('id', id));
  },

  async deleteTable(id) {
    const supabase = getSupabase(); if (!supabase) return;
    await withRetry(() => supabase.from('guests').update({ table_id: null }).eq('table_id', id));
    await withRetry(() => supabase.from('tables').delete().eq('id', id));
  },

  async addBudgetItem(weddingId, item) {
    const supabase = getSupabase(); if (!supabase || !weddingId) return null;
    const { data } = await withRetry(() => supabase.from('budget_items').insert({
      wedding_id: weddingId,
      category: item.cat,
      planned: item.planned || 0,
      spent: item.spent || 0,
      vendor: item.vendor || '',
      status: item.status || 'unpaid',
      notes: item.notes || '',
    }).select().single());
    return data;
  },

  async updateBudgetItem(id, data) {
    const supabase = getSupabase(); if (!supabase) return;
    const mapped = {};
    if (data.cat !== undefined) mapped.category = data.cat;
    if (data.planned !== undefined) mapped.planned = data.planned;
    if (data.spent !== undefined) mapped.spent = data.spent;
    if (data.vendor !== undefined) mapped.vendor = data.vendor;
    if (data.status !== undefined) mapped.status = data.status;
    if (data.notes !== undefined) mapped.notes = data.notes;
    if (Object.keys(mapped).length > 0) await withRetry(() => supabase.from('budget_items').update(mapped).eq('id', id));
  },

  async deleteBudgetItem(id) {
    const supabase = getSupabase();
    if (supabase) await withRetry(() => supabase.from('budget_items').delete().eq('id', id));
  },

  async addTask(weddingId, task) {
    const supabase = getSupabase(); if (!supabase || !weddingId) return null;
    const { data } = await withRetry(() => supabase.from('tasks').insert({
      wedding_id: weddingId,
      title: task.title,
      due: task.due || null,
      status: task.status || 'pending',
      priority: task.prio || 'medium',
      category: task.cat || '',
    }).select().single());
    return data;
  },

  async updateTask(id, data) {
    const supabase = getSupabase(); if (!supabase) return;
    const mapped = {};
    if (data.title !== undefined) mapped.title = data.title;
    if (data.due !== undefined) mapped.due = data.due || null;
    if (data.status !== undefined) mapped.status = data.status;
    if (data.prio !== undefined) mapped.priority = data.prio;
    if (data.cat !== undefined) mapped.category = data.cat;
    if (Object.keys(mapped).length > 0) await withRetry(() => supabase.from('tasks').update(mapped).eq('id', id));
  },

  async deleteTask(id) {
    const supabase = getSupabase();
    if (supabase) await withRetry(() => supabase.from('tasks').delete().eq('id', id));
  },

  async addVendor(weddingId, vendor) {
    const supabase = getSupabase(); if (!supabase || !weddingId) return null;
    const { data } = await withRetry(() => supabase.from('vendors').insert({
      wedding_id: weddingId,
      name: vendor.name,
      category: vendor.category || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      status: vendor.status || 'potential',
      rating: vendor.rating || 0,
      notes: vendor.notes || '',
    }).select().single());
    return data;
  },

  async updateVendor(id, data) {
    const supabase = getSupabase(); if (!supabase) return;
    const mapped = { ...data };
    if (Object.keys(mapped).length > 0) await withRetry(() => supabase.from('vendors').update(mapped).eq('id', id));
  },

  async deleteVendor(id) {
    const supabase = getSupabase();
    if (supabase) await withRetry(() => supabase.from('vendors').delete().eq('id', id));
  },

  async bulkInsertGuests(weddingId, guests) {
    const supabase = getSupabase(); if (!supabase || !weddingId) return [];
    const rows = guests.map(guest => ({
      wedding_id: weddingId,
      name: guest.name,
      group: guest.group || 'Prieteni',
      rsvp: guest.rsvp || 'pending',
      dietary: guest.dietary || '',
      tags: guest.tags || [],
      notes: guest.notes || '',
      table_id: guest.tid || null,
    }));
    const { data } = await withRetry(() => supabase.from('guests').insert(rows).select());
    return data || [];
  },

  async bulkInsertTables(weddingId, tables) {
    const supabase = getSupabase(); if (!supabase || !weddingId) return [];
    const rows = tables.map(table => ({
      wedding_id: weddingId,
      name: table.name,
      seats: table.seats || 8,
      shape: table.shape || 'round',
      notes: table.notes || '',
    }));
    const { data } = await withRetry(() => supabase.from('tables').insert(rows).select());
    return data || [];
  },

  async bulkInsertBudget(weddingId, items) {
    const supabase = getSupabase(); if (!supabase || !weddingId) return [];
    const rows = items.map(item => ({
      wedding_id: weddingId,
      category: item.cat,
      planned: item.planned || 0,
      spent: item.spent || 0,
      vendor: item.vendor || '',
      status: item.status || 'unpaid',
      notes: item.notes || '',
    }));
    const { data } = await withRetry(() => supabase.from('budget_items').insert(rows).select());
    return data || [];
  },

  async bulkInsertTasks(weddingId, tasks) {
    const supabase = getSupabase(); if (!supabase || !weddingId) return [];
    const rows = tasks.map(task => ({
      wedding_id: weddingId,
      title: task.title,
      due: task.due || null,
      status: task.status || 'pending',
      priority: task.prio || 'medium',
      category: task.cat || '',
    }));
    const { data } = await withRetry(() => supabase.from('tasks').insert(rows).select());
    return data || [];
  },
};

export { withRetry, loadAllData, dbSync };
