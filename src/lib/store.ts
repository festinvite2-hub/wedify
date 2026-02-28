import { create } from 'zustand'
import { createClient } from '@/lib/supabase-browser'

// Fiecare cuplu are 1 cont → 1 wedding → datele lor
// Nu există multi-user, nu există roluri, nu există sharing

interface Store {
  wedding: any | null
  guests: any[]
  tables: any[]
  budget: any[]
  tasks: any[]
  vendors: any[]
  loading: boolean
  weddingId: string | null

  init: () => Promise<void>
  
  // Wedding (onboarding + settings)
  updateWedding: (data: any) => Promise<void>
  
  // CRUD for all entities
  addGuest: (data: any) => Promise<void>
  updateGuest: (id: string, data: any) => Promise<void>
  deleteGuest: (id: string) => Promise<void>
  importGuests: (guests: any[]) => Promise<void>
  
  addTable: (data: any) => Promise<void>
  updateTable: (id: string, data: any) => Promise<void>
  deleteTable: (id: string) => Promise<void>
  
  addBudgetItem: (data: any) => Promise<void>
  updateBudgetItem: (id: string, data: any) => Promise<void>
  deleteBudgetItem: (id: string) => Promise<void>
  
  addTask: (data: any) => Promise<void>
  updateTask: (id: string, data: any) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  
  addVendor: (data: any) => Promise<void>
  updateVendor: (id: string, data: any) => Promise<void>
  deleteVendor: (id: string) => Promise<void>
}

export const useStore = create<Store>((set, get) => {
  const supabase = createClient()

  return {
    wedding: null, guests: [], tables: [], budget: [], tasks: [], vendors: [],
    loading: true, weddingId: null,

    // Load all data for the logged-in couple
    init: async () => {
      set({ loading: true })
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { set({ loading: false }); return }

      // Get this couple's wedding (created automatically at signup)
      const { data: wedding } = await supabase
        .from('weddings').select('*').eq('user_id', user.id).single()

      if (!wedding) { set({ loading: false }); return }

      // Load all data in parallel
      const [guests, tables, budget, tasks, vendors] = await Promise.all([
        supabase.from('guests').select('*').eq('wedding_id', wedding.id).order('created_at'),
        supabase.from('tables').select('*').eq('wedding_id', wedding.id).order('sort_order'),
        supabase.from('budget_items').select('*').eq('wedding_id', wedding.id).order('created_at'),
        supabase.from('tasks').select('*').eq('wedding_id', wedding.id).order('due'),
        supabase.from('vendors').select('*').eq('wedding_id', wedding.id).order('created_at'),
      ])

      set({
        weddingId: wedding.id, wedding,
        guests: guests.data || [], tables: tables.data || [],
        budget: budget.data || [], tasks: tasks.data || [],
        vendors: vendors.data || [], loading: false,
      })
    },

    // ── Wedding ─────────────────────────
    updateWedding: async (data) => {
      const wid = get().weddingId
      if (!wid) return
      await supabase.from('weddings').update(data).eq('id', wid)
      set(s => ({ wedding: s.wedding ? { ...s.wedding, ...data } : null }))
    },

    // ── Guests ──────────────────────────
    addGuest: async (data) => {
      const wid = get().weddingId; if (!wid) return
      const { data: row } = await supabase.from('guests')
        .insert({ ...data, wedding_id: wid }).select().single()
      if (row) set(s => ({ guests: [...s.guests, row] }))
    },
    updateGuest: async (id, data) => {
      await supabase.from('guests').update(data).eq('id', id)
      set(s => ({ guests: s.guests.map(g => g.id === id ? { ...g, ...data } : g) }))
    },
    deleteGuest: async (id) => {
      await supabase.from('guests').delete().eq('id', id)
      set(s => ({ guests: s.guests.filter(g => g.id !== id) }))
    },
    importGuests: async (guests) => {
      const wid = get().weddingId; if (!wid) return
      const rows = guests.map(g => ({ ...g, wedding_id: wid }))
      const { data } = await supabase.from('guests').insert(rows).select()
      if (data) set(s => ({ guests: [...s.guests, ...data] }))
    },

    // ── Tables ──────────────────────────
    addTable: async (data) => {
      const wid = get().weddingId; if (!wid) return
      const { data: row } = await supabase.from('tables')
        .insert({ ...data, wedding_id: wid }).select().single()
      if (row) set(s => ({ tables: [...s.tables, row] }))
    },
    updateTable: async (id, data) => {
      await supabase.from('tables').update(data).eq('id', id)
      set(s => ({ tables: s.tables.map(t => t.id === id ? { ...t, ...data } : t) }))
    },
    deleteTable: async (id) => {
      await supabase.from('guests').update({ table_id: null }).eq('table_id', id)
      await supabase.from('tables').delete().eq('id', id)
      set(s => ({
        tables: s.tables.filter(t => t.id !== id),
        guests: s.guests.map(g => g.table_id === id ? { ...g, table_id: null } : g),
      }))
    },

    // ── Budget ──────────────────────────
    addBudgetItem: async (data) => {
      const wid = get().weddingId; if (!wid) return
      const { data: row } = await supabase.from('budget_items')
        .insert({ ...data, wedding_id: wid }).select().single()
      if (row) set(s => ({ budget: [...s.budget, row] }))
    },
    updateBudgetItem: async (id, data) => {
      await supabase.from('budget_items').update(data).eq('id', id)
      set(s => ({ budget: s.budget.map(b => b.id === id ? { ...b, ...data } : b) }))
    },
    deleteBudgetItem: async (id) => {
      await supabase.from('budget_items').delete().eq('id', id)
      set(s => ({ budget: s.budget.filter(b => b.id !== id) }))
    },

    // ── Tasks ───────────────────────────
    addTask: async (data) => {
      const wid = get().weddingId; if (!wid) return
      const { data: row } = await supabase.from('tasks')
        .insert({ ...data, wedding_id: wid }).select().single()
      if (row) set(s => ({ tasks: [...s.tasks, row] }))
    },
    updateTask: async (id, data) => {
      await supabase.from('tasks').update(data).eq('id', id)
      set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...data } : t) }))
    },
    deleteTask: async (id) => {
      await supabase.from('tasks').delete().eq('id', id)
      set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))
    },

    // ── Vendors ─────────────────────────
    addVendor: async (data) => {
      const wid = get().weddingId; if (!wid) return
      const { data: row } = await supabase.from('vendors')
        .insert({ ...data, wedding_id: wid }).select().single()
      if (row) set(s => ({ vendors: [...s.vendors, row] }))
    },
    updateVendor: async (id, data) => {
      await supabase.from('vendors').update(data).eq('id', id)
      set(s => ({ vendors: s.vendors.map(v => v.id === id ? { ...v, ...data } : v) }))
    },
    deleteVendor: async (id) => {
      await supabase.from('vendors').delete().eq('id', id)
      set(s => ({ vendors: s.vendors.filter(v => v.id !== id) }))
    },
  }
})
