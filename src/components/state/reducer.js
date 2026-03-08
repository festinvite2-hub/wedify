import { mkid } from "../lib/utils";

const EMPTY_STATE = {
  wedding: { couple: '', date: '', venue: '', budget: 0, guestTarget: 1, program: [], theme: '' },
  groups: ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"],
  guestGroups: [],
  tags: ["Copil", "Cazare", "Parcare", "Din alt oraș", "Martor", "Naș/Nașă"],
  onboarded: false,
  activity: [],
  guests: [], tables: [], budget: [], tasks: [], vendors: []
};

function reducer(state, action) {
  const payload = action.p;
  const log = (msg) => [{ id: mkid(), msg, ts: new Date().toISOString() }, ...(state.activity || []).slice(0, 49)];
  switch (action.type) {
    case "SET": return { ...state, ...payload };
    case "ADD_GUEST": return { ...state, guests: [...state.guests, payload], activity: log(`${payload.name} adăugat`) };
    case "UPD_GUEST": {
      const old = state.guests.find(guest => guest.id === payload.id);
      let guests = state.guests.map(guest => {
        if (guest.id !== payload.id) return guest;
        const updated = { ...guest, ...payload };
        if (payload.rsvp && payload.rsvp !== guest.rsvp) {
          if (payload.rsvp !== "confirmed" && guest.tid) {
            updated.lastTid = guest.tid;
            updated.tid = null;
          } else if (payload.rsvp === "confirmed" && !guest.tid && guest.lastTid) {
            const tableStillExists = state.tables.some(table => table.id === guest.lastTid);
            if (tableStillExists) {
              const seatedCount = state.guests.filter(item => item.tid === guest.lastTid && item.id !== guest.id).length;
              const tableSeats = state.tables.find(table => table.id === guest.lastTid)?.seats || 0;
              if (seatedCount < tableSeats) updated.tid = guest.lastTid;
            }
            updated.lastTid = null;
          }
        }
        return updated;
      });
      return { ...state, guests, activity: log(`${old?.name || "Invitat"} actualizat`) };
    }
    case "DEL_GUEST": {
      const old = state.guests.find(guest => guest.id === payload);
      return { ...state, guests: state.guests.filter(guest => guest.id !== payload), activity: log(`${old?.name || "Invitat"} șters`) };
    }
    case "ADD_TABLE": return { ...state, tables: [...state.tables, payload], activity: log(`${payload.name} creată`) };
    case "UPD_TABLE": return { ...state, tables: state.tables.map(table => table.id === payload.id ? { ...table, ...payload } : table), activity: log(`Masă actualizată`) };
    case "DEL_TABLE": return { ...state, tables: state.tables.filter(table => table.id !== payload), guests: state.guests.map(guest => guest.tid === payload ? { ...guest, tid: null } : guest), activity: log(`Masă ștearsă`) };
    case "REORDER_TABLES": return { ...state, tables: payload, activity: log("Ordine mese actualizată") };
    case "SEAT": {
      const guest = state.guests.find(item => item.id === payload.gid);
      const table = state.tables.find(item => item.id === payload.tid);
      return { ...state, guests: state.guests.map(item => item.id === payload.gid ? { ...item, tid: payload.tid } : item), activity: log(`${guest?.name} → ${table?.name}`) };
    }
    case "UNSEAT": {
      const guest = state.guests.find(item => item.id === payload);
      return { ...state, guests: state.guests.map(item => item.id === payload ? { ...item, tid: null } : item), activity: log(`${guest?.name} scos de la masă`) };
    }
    case "MOVE_SEAT": {
      const guest = state.guests.find(item => item.id === payload.gid);
      const table = state.tables.find(item => item.id === payload.tid);
      return { ...state, guests: state.guests.map(item => item.id === payload.gid ? { ...item, tid: payload.tid } : item), activity: log(`${guest?.name} mutat → ${table?.name}`) };
    }
    case "ADD_BUDGET": return { ...state, budget: [...state.budget, payload], activity: log(`Buget: ${payload.cat} adăugat`) };
    case "UPD_BUDGET": return { ...state, budget: state.budget.map(item => item.id === payload.id ? { ...item, ...payload } : item) };
    case "DEL_BUDGET": {
      const old = state.budget.find(item => item.id === payload);
      return { ...state, budget: state.budget.filter(item => item.id !== payload), activity: log(`Buget: ${old?.cat} șters`) };
    }
    case "ADD_TASK": return { ...state, tasks: [...state.tasks, payload], activity: log(`Task: ${payload.title} adăugat`) };
    case "UPD_TASK": return { ...state, tasks: state.tasks.map(task => task.id === payload.id ? { ...task, ...payload } : task) };
    case "DEL_TASK": {
      const old = state.tasks.find(task => task.id === payload);
      return { ...state, tasks: state.tasks.filter(task => task.id !== payload), activity: log(`Task: ${old?.title} șters`) };
    }
    case "ADD_VENDOR": return { ...state, vendors: [...state.vendors, payload], activity: log(`Furnizor: ${payload.name} adăugat`) };
    case "UPD_VENDOR": return { ...state, vendors: state.vendors.map(vendor => vendor.id === payload.id ? { ...vendor, ...payload } : vendor) };
    case "DEL_VENDOR": return { ...state, vendors: state.vendors.filter(vendor => vendor.id !== payload), activity: log(`Furnizor șters`) };
    case "REPLACE_ID": {
      const { collection, oldId, newId } = payload;
      if (collection === "guests") {
        return {
          ...state,
          guests: state.guests.map(guest => guest.id === oldId ? { ...guest, id: newId } : guest),
        };
      }
      if (collection === "tables") {
        return {
          ...state,
          tables: state.tables.map(table => table.id === oldId ? { ...table, id: newId } : table),
          guests: state.guests.map(guest => guest.tid === oldId ? { ...guest, tid: newId } : guest),
        };
      }
      if (collection === "budget") {
        return { ...state, budget: state.budget.map(item => item.id === oldId ? { ...item, id: newId } : item) };
      }
      if (collection === "tasks") {
        return { ...state, tasks: state.tasks.map(task => task.id === oldId ? { ...task, id: newId } : task) };
      }
      if (collection === "vendors") {
        return { ...state, vendors: state.vendors.map(vendor => vendor.id === oldId ? { ...vendor, id: newId } : vendor) };
      }
      return state;
    }
    case "IMPORT_GUESTS": return { ...state, guests: [...state.guests, ...payload], activity: log(`${payload.length} invitați importați`) };
    case "SET_GUESTS_IMPORTED": return { ...state, guests: [...state.guests.filter(guest => !payload.some(newGuest => newGuest.name === guest.name)), ...payload] };
    default: return state;
  }
}

export { EMPTY_STATE, reducer };
