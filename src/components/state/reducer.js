import { mkid } from "../lib/utils";

const INITIAL_DATA = {
  wedding:{couple:"Alexandra & Mihai",date:"2026-09-12",venue:"Palatul Mogoșoaia",budget:25000,guestTarget:120,program:[],theme:""},
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
    {id:"b1",cat:"Locație",planned:5000,spent:4500,vendor:"Palatul Mogoșoaia",status:"paid",notes:"",payments:[]},
    {id:"b2",cat:"Catering",planned:8000,spent:3000,vendor:"Chef's Table",status:"partial",notes:"",payments:[]},
    {id:"b3",cat:"Fotograf",planned:2500,spent:1000,vendor:"ArtStudio",status:"partial",notes:"",payments:[]},
    {id:"b4",cat:"Muzică",planned:2000,spent:0,vendor:"",status:"unpaid",notes:"",payments:[]},
    {id:"b5",cat:"Floristică",planned:1500,spent:1500,vendor:"Flora Design",status:"paid",notes:"",payments:[]},
    {id:"b6",cat:"Rochie",planned:3000,spent:2800,vendor:"Bridal House",status:"paid",notes:"",payments:[]},
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
    case "REORDER_TABLES": return { ...s, tables: p, activity: log("Ordine mese actualizată") };
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

export { INITIAL_DATA, reducer };
