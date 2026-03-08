import { useReducer, useState, useEffect, useCallback, useRef } from "react";
import { EMPTY_STATE, reducer } from "./state/reducer";
import { INITIAL_DATA } from "./state/demo-data";
import { loadAllData, dbSync } from "./lib/db-sync";
import { getSupabase } from "./lib/supabase-client";
import { loadTheme, saveTheme, serializeBudgetNotes } from "./lib/utils";

import { Header } from "./ui/Header";
import { TabBar } from "./ui/TabBar";
import { Toast } from "./ui/Toast";
import { ErrorBoundary } from "./ui/ErrorBoundary";
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
import { AuthContext } from "./context/AuthContext";
import { ThemeContext } from "./context/ThemeContext";
import { DataContext } from "./context/DataContext";
import { createSyncQueue } from "./lib/sync-queue";

export default function WeddingPlanner() {
  const [state, setReducerDispatch] = useReducer(reducer, EMPTY_STATE);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [tab, setTab] = useState("home");
  const [theme, setTheme] = useState("light");
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [weddingId, setWeddingId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [ready, setReady] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const stateRef = useRef(state);
  const syncInProgressRef = useRef(false);
  const syncOpsCounter = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const showToast = (message, type = "info") => setToast({ visible: true, message, type });

  const markSyncStart = useCallback(() => {
    syncOpsCounter.current += 1;
    syncInProgressRef.current = true;
    setSyncInProgress(true);
  }, []);

  const markSyncEnd = useCallback(() => {
    syncOpsCounter.current = Math.max(0, syncOpsCounter.current - 1);
    if (syncOpsCounter.current === 0) {
      syncInProgressRef.current = false;
      setSyncInProgress(false);
    }
  }, []);

  const syncQueue = useRef(createSyncQueue({ onError: (err) => showToast(`Sync eșuat: ${err.message}`, "error") }));

  const loadUserData = useCallback(async () => {
    if (!user || syncInProgressRef.current) return;
    if (weddingId && stateRef.current.onboarded) return;
    setDataLoading(true);
    const fresh = await loadAllData(user.id);
    if (fresh) {
      setReducerDispatch({ type: "SET", p: fresh });
      setWeddingId(fresh.weddingId);
    } else if (process.env.NODE_ENV === "development") {
      setReducerDispatch({ type: "SET", p: INITIAL_DATA });
    } else {
      setReducerDispatch({ type: "SET", p: { ...EMPTY_STATE, onboarded: false } });
    }
    setDataLoading(false);
  }, [user, weddingId]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getUser().then(({ data: { user } }) => { setUser(user); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const authUser = session?.user || null;
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setUser(authUser);
      }
      if (event === "SIGNED_OUT") {
        setReducerDispatch({ type: "SET", p: { ...EMPTY_STATE, onboarded: false } });
        setWeddingId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !syncInProgressRef.current) {
        void loadUserData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loadUserData]);

  const retryDbSync = useCallback(async (task) => {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await task();
        return;
      } catch (err) {
        lastError = err;
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, attempt * 250));
        }
      }
    }
    throw lastError;
  }, []);

  const dispatch = useCallback((action) => {
    const payload = action.p;
    const currentWeddingId = weddingId;
    const key = `${action.type}:${action.p?.id || action.p?.gid || action.p || "global"}`;
    const currentGuestTid = ["SEAT", "UNSEAT", "MOVE_SEAT"].includes(action.type)
      ? stateRef.current.guests.find(guest => guest.id === (action.type === "UNSEAT" ? payload : payload.gid))?.tid ?? null
      : null;

    setReducerDispatch(action);

    syncQueue.current.push(key, async () => {
      markSyncStart();
      try {
        switch (action.type) {
          case "SET":
            if (currentWeddingId) await dbSync.updateWedding(currentWeddingId, payload.wedding || payload);
            break;
          case "ADD_GUEST": {
            const dbGuest = await dbSync.addGuest(currentWeddingId, payload);
            if (dbGuest?.id && dbGuest.id !== payload.id) {
              setReducerDispatch({ type: "REPLACE_ID", p: { collection: "guests", oldId: payload.id, newId: dbGuest.id } });
            }
            break;
          }
          case "UPD_GUEST": await dbSync.updateGuest(payload.id, payload); break;
          case "DEL_GUEST": await dbSync.deleteGuest(payload); break;
          case "ADD_TABLE": {
            const dbTable = await dbSync.addTable(currentWeddingId, payload);
            if (dbTable?.id && dbTable.id !== payload.id) {
              setReducerDispatch({ type: "REPLACE_ID", p: { collection: "tables", oldId: payload.id, newId: dbTable.id } });
            }
            break;
          }
          case "UPD_TABLE": await dbSync.updateTable(payload.id, payload); break;
          case "DEL_TABLE": await dbSync.deleteTable(payload); break;
          case "ADD_BUDGET": {
            const dbBudget = await dbSync.addBudgetItem(currentWeddingId, { ...payload, notes: serializeBudgetNotes(payload.notes, payload.payments) });
            if (dbBudget?.id && dbBudget.id !== payload.id) {
              setReducerDispatch({ type: "REPLACE_ID", p: { collection: "budget", oldId: payload.id, newId: dbBudget.id } });
            }
            break;
          }
          case "UPD_BUDGET": await dbSync.updateBudgetItem(payload.id, { ...payload, notes: serializeBudgetNotes(payload.notes, payload.payments) }); break;
          case "DEL_BUDGET": await dbSync.deleteBudgetItem(payload); break;
          case "ADD_TASK": {
            const dbTask = await dbSync.addTask(currentWeddingId, payload);
            if (dbTask?.id && dbTask.id !== payload.id) {
              setReducerDispatch({ type: "REPLACE_ID", p: { collection: "tasks", oldId: payload.id, newId: dbTask.id } });
            }
            break;
          }
          case "UPD_TASK": await dbSync.updateTask(payload.id, payload); break;
          case "DEL_TASK": await dbSync.deleteTask(payload); break;
          case "ADD_VENDOR": {
            const dbVendor = await dbSync.addVendor(currentWeddingId, payload);
            if (dbVendor?.id && dbVendor.id !== payload.id) {
              setReducerDispatch({ type: "REPLACE_ID", p: { collection: "vendors", oldId: payload.id, newId: dbVendor.id } });
            }
            break;
          }
          case "UPD_VENDOR": await dbSync.updateVendor(payload.id, payload); break;
          case "DEL_VENDOR": await dbSync.deleteVendor(payload); break;
          case "SEAT":
            await retryDbSync(() => dbSync.updateGuest(payload.gid, { tid: payload.tid }));
            break;
          case "UNSEAT":
            await retryDbSync(() => dbSync.updateGuest(payload, { tid: null }));
            break;
          case "MOVE_SEAT":
            await retryDbSync(() => dbSync.updateGuest(payload.gid, { tid: payload.tid }));
            break;
        }
      } catch (err) {
        if (action.type === "SEAT" || action.type === "MOVE_SEAT") {
          if (currentGuestTid) {
            setReducerDispatch({ type: "MOVE_SEAT", p: { gid: payload.gid, tid: currentGuestTid } });
          } else {
            setReducerDispatch({ type: "UNSEAT", p: payload.gid });
          }
          showToast("Nu am putut salva așezarea la masă. Am revenit la starea anterioară.", "error");
        }

        if (action.type === "UNSEAT" && currentGuestTid) {
          setReducerDispatch({ type: "MOVE_SEAT", p: { gid: payload, tid: currentGuestTid } });
          showToast("Nu am putut scoate invitatul de la masă. Am revenit la starea anterioară.", "error");
        }

        throw err;
      } finally {
        markSyncEnd();
      }
    });
  }, [markSyncEnd, markSyncStart, retryDbSync, weddingId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      void syncQueue.current.flush();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => { loadTheme().then(themeValue => { if (themeValue) setTheme(themeValue); }); }, []);
  useEffect(() => { saveTheme(theme); }, [theme]);

  useEffect(() => {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) { viewport = document.createElement("meta"); viewport.name = "viewport"; document.head.appendChild(viewport); }
    viewport.content = "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover";
    setTimeout(() => setReady(true), 50);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.background = theme === "dark" ? "#1A1816" : "#FFFDF8";
    document.body.style.color = theme === "dark" ? "#E8E0D6" : "#1A1A1A";
  }, [theme]);

  const toggleTheme = () => setTheme(current => current === "dark" ? "light" : "dark");

  if (authLoading || dataLoading) {
    return <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", background: "#171513" }}><img src="/wedify-logo.png" alt="Wedify" style={{ width: 140, height: "auto", objectFit: "contain" }} onError={(e)=>{e.currentTarget.style.display="none";e.currentTarget.nextElementSibling?.classList.remove("hidden");}} /><div className="hidden" style={{ color: "#fff", fontFamily:"var(--fd)", fontSize: 32 }}>Wedify</div><p style={{ color: "#fff", marginTop: 8 }}>Se încarcă...</p></div>;
  }

  const authContextValue = { user, setUser };
  const themeContextValue = { theme, setTheme, toggleTheme };
  const dataContextValue = { state, dispatch, weddingId, setWeddingId, showToast, setShowSettings, setTab, activeTab: tab, syncInProgress };

  if (!user) {
    return <AuthContext.Provider value={authContextValue}><ThemeContext.Provider value={themeContextValue}><DataContext.Provider value={dataContextValue}><Auth /></DataContext.Provider></ThemeContext.Provider></AuthContext.Provider>;
  }

  if (!state.onboarded) {
    return <AuthContext.Provider value={authContextValue}><ThemeContext.Provider value={themeContextValue}><DataContext.Provider value={dataContextValue}><Onboarding /></DataContext.Provider></ThemeContext.Provider></AuthContext.Provider>;
  }

  const titles = { home: "Dashboard", guests: "Invitați", tables: "Aranjare Mese", budget: "Buget", tasks: "Timeline", tools: "Unelte", vendors: "Furnizori" };
  const overdueCount = state.tasks.filter(task => new Date(task.due) < new Date() && task.status !== "done").length;
  const pages = { home: Home, guests: Guests, tables: Tables, budget: Budget, tasks: Tasks, vendors: Vendors, tools: Tools };
  const Page = pages[tab] || Home;

  return (
    <AuthContext.Provider value={authContextValue}>
      <ThemeContext.Provider value={themeContextValue}>
        <DataContext.Provider value={dataContextValue}>
          <div data-theme={theme} style={{ width: "100%", maxWidth: 460, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--ink)", opacity: ready ? 1 : 0, transition: "opacity .3s" }}>
            <Header title={titles[tab]} onOpenSettings={() => setShowSettings(true)} />
            <main style={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", paddingTop: 12, paddingBottom: "calc(var(--nv) + 20px)" }}>
              <ErrorBoundary key={tab}>
                <Page />
              </ErrorBoundary>
            </main>
            <TabBar overdueCount={overdueCount} />
            <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast(previous => ({ ...previous, visible: false }))} />
            <Settings open={showSettings} onClose={() => setShowSettings(false)} />
          </div>
        </DataContext.Provider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}
