import { useReducer, useState, useEffect, useCallback } from "react";
import { AppContext } from "./context/AppContext";
import { INITIAL_DATA, reducer } from "./state/reducer";
import { CSS, LOGO_SM } from "./lib/constants";
import { loadAllData, dbSync } from "./lib/db-sync";
import { getSupabase } from "./lib/supabase-client";
import { loadTheme, saveTheme, parseBudgetNotes, serializeBudgetNotes } from "./lib/utils";

import { Header } from "./ui/Header";
import { TabBar } from "./ui/TabBar";
import { Toast } from "./ui/Toast";
import Auth from "./features/Auth";
import Onboarding from "./features/Onboarding";
import Home from "./features/Home";
import Guests from "./features/Guests";
import Tables from "./features/Tables";
import Budget from "./features/Budget";
import Tasks from "./features/Tasks";
import Vendors from "./features/Vendors";
import Tools from "./features/Tools";
import Settings from "./features/Settings";

export default function WeddingPlanner() {
  const [s, dispatch] = useReducer(reducer, INITIAL_DATA);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [tab, setTab] = useState("home");
  const [theme, setTheme] = useState("light");
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [weddingId, setWeddingId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setAuthLoading(false); return; }
    sb.auth.getUser().then(({ data: { user } }) => { setUser(user); setAuthLoading(false); });
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (event === "SIGNED_OUT") {
        dispatch({ type: "SET", p: { ...INITIAL_DATA, onboarded: false } });
        setWeddingId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setDataLoading(true);
      const fresh = await loadAllData(user.id);
      if (fresh) {
        dispatch({ type: "SET", p: fresh });
        setWeddingId(fresh.weddingId);
      } else {
        dispatch({ type: "SET", p: { ...INITIAL_DATA, onboarded: false } });
      }
      setDataLoading(false);
    };
    run();
  }, [user]);

  const d = useCallback((a) => {
    dispatch(a);
    const p = a.p;
    const wid = weddingId;
    switch (a.type) {
      case "SET":
        if (wid) dbSync.updateWedding(wid, p.wedding || p);
        break;
      case "ADD_GUEST": dbSync.addGuest(wid, p).then(row => { if (row) dispatch({ type: "UPD_GUEST", p: { id: p.id, ...row, tid: row.table_id } }); }); break;
      case "UPD_GUEST": dbSync.updateGuest(p.id, p); break;
      case "DEL_GUEST": dbSync.deleteGuest(p); break;
      case "ADD_TABLE": dbSync.addTable(wid, p).then(row => { if (row) dispatch({ type: "UPD_TABLE", p: { id: p.id, ...row } }); }); break;
      case "UPD_TABLE": dbSync.updateTable(p.id, p); break;
      case "DEL_TABLE": dbSync.deleteTable(p); break;
      case "ADD_BUDGET": dbSync.addBudgetItem(wid, { ...p, notes: serializeBudgetNotes(p.notes, p.payments) }).then(row => { if (row) { const parsed = parseBudgetNotes(row.notes || ""); dispatch({ type: "UPD_BUDGET", p: { id: p.id, ...row, cat: row.category, notes: parsed.cleanNotes, payments: parsed.payments || [] } }); } }); break;
      case "UPD_BUDGET": dbSync.updateBudgetItem(p.id, { ...p, notes: serializeBudgetNotes(p.notes, p.payments) }); break;
      case "DEL_BUDGET": dbSync.deleteBudgetItem(p); break;
      case "ADD_TASK": dbSync.addTask(wid, p).then(row => { if (row) dispatch({ type: "UPD_TASK", p: { id: p.id, ...row, prio: row.priority } }); }); break;
      case "UPD_TASK": dbSync.updateTask(p.id, p); break;
      case "DEL_TASK": dbSync.deleteTask(p); break;
      case "SEAT": dbSync.updateGuest(p.gid, { tid: p.tid }); break;
      case "UNSEAT": dbSync.updateGuest(p, { tid: null }); break;
      case "MOVE_SEAT": dbSync.updateGuest(p.gid, { tid: p.tid }); break;
    }
  }, [weddingId]);

  useEffect(() => { loadTheme().then(t => { if (t) setTheme(t); }); }, []);
  useEffect(() => { saveTheme(theme); }, [theme]);

  const showToast = (message, type = "info") => setToast({ visible: true, message, type });

  useEffect(() => {
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    let m = document.querySelector('meta[name="viewport"]'); if (!m) { m = document.createElement("meta"); m.name = "viewport"; document.head.appendChild(m) };
    m.content = "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover";
    setTimeout(() => setReady(true), 50);
    return () => document.head.removeChild(st);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.background = theme === "dark" ? "#1A1816" : "#FFFDF8";
    document.body.style.color = theme === "dark" ? "#E8E0D6" : "#1A1A1A";
  }, [theme]);

  if (authLoading || dataLoading) {
    return <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", background: "#171513" }}><img src={LOGO_SM} alt="Wedify" style={{ width: 140, height: 140, objectFit: "contain" }} /><p style={{ color: "#fff", marginTop: 8 }}>Se încarcă...</p></div>;
  }

  if (!user) return <Auth />;

  if (!s.onboarded) {
    return <Onboarding onComplete={async (data) => {
      if (weddingId) {
        await dbSync.updateWedding(weddingId, { couple: data.wedding.couple, date: data.wedding.date, venue: data.wedding.venue, budget: data.wedding.budget, groups: data.groups, onboarded: true });
        await dbSync.bulkInsertTables(weddingId, data.tables);
        await dbSync.bulkInsertBudget(weddingId, data.budget);
        await dbSync.bulkInsertTasks(weddingId, data.tasks);
        const fresh = await loadAllData(user.id);
        if (fresh) { dispatch({ type: "SET", p: fresh }); setWeddingId(fresh.weddingId); }
      } else {
        d({ type: "SET", p: data });
      }
    }} />;
  }

  const titles = { home: "Dashboard", guests: "Invitați", tables: "Aranjare Mese", budget: "Buget", tasks: "Timeline", tools: "Unelte", vendors: "Furnizori" };
  const overdueCount = s.tasks.filter(t => new Date(t.due) < new Date() && t.status !== "done").length;
  const pages = { home: Home, guests: Guests, tables: Tables, budget: Budget, tasks: Tasks, vendors: Vendors, tools: Tools, settings: Settings };
  const Page = pages[tab] || Home;

  return (
    <AppContext.Provider value={{ s, d, user: user ? { email: user.email, name: user.user_metadata?.name || user.email.split("@")[0], role: "admin" } : null, setShowSettings, showToast, theme, setTheme, setTab, activeTab: tab, weddingId }}>
      <div data-theme={theme} style={{ width: "100%", maxWidth: 460, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--ink)", opacity: ready ? 1 : 0, transition: "opacity .3s" }}>
        <Header title={titles[tab]} onOpenSettings={() => setShowSettings(true)} />
        <main style={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", paddingTop: 12, paddingBottom: "calc(var(--nv) + 20px)" }}><Page /></main>
        <TabBar overdueCount={overdueCount} />
        <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast(x => ({ ...x, visible: false }))} />
        <Settings open={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </AppContext.Provider>
  );
}
