import { ic } from "../lib/icons";
import { useTheme } from "../context/ThemeContext";
import { useData } from "../context/DataContext";

/**
 * Consumă context intern (activeTab, setTab).
 * Nu primește props externe obligatorii.
 */
function TabBar({ overdueCount = 0 }) {
  const { activeTab, setTab } = useData();
  const { theme } = useTheme();
  const tabs = [{ k: "home", l: "Acasă", i: ic.home }, { k: "guests", l: "Invitați", i: ic.users }, { k: "tables", l: "Mese", i: ic.tbl }, { k: "budget", l: "Buget", i: ic.wallet }, { k: "tasks", l: "Tasks", i: ic.chk }, { k: "tools", l: "Unelte", i: ic.settings }];

  return (
    <nav className="fixed bottom-0 left-1/2 z-[100] flex h-nav w-full max-w-[460px] -translate-x-1/2 items-center justify-around border-t border-border pb-[env(safe-area-inset-bottom,4px)] backdrop-blur-[14px]" style={{ background: theme === "dark" ? "rgba(26,24,22,.95)" : "rgba(255,253,248,.95)" }}>
      {tabs.map(tabItem => (
        <button key={tabItem.k} onClick={() => setTab(tabItem.k)} className="relative flex min-w-11 flex-col items-center gap-[1px] px-[2px] py-[5px] transition-all" style={{ color: activeTab === tabItem.k ? "var(--g)" : "var(--mt)" }}>
          {activeTab === tabItem.k && <div className="absolute -top-px h-0.5 w-[18px] rounded-[1px] bg-gold" />}
          {tabItem.k === "tasks" && overdueCount > 0 && <div className="absolute right-0.5 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-err text-[9px] font-bold leading-none text-white">{overdueCount}</div>}
          <span style={{ transform: activeTab === tabItem.k ? "scale(1.08)" : "scale(1)", transition: "transform .2s" }}>{tabItem.i}</span>
          <span className="text-[8px] uppercase tracking-[.04em]" style={{ fontWeight: activeTab === tabItem.k ? 700 : 500 }}>{tabItem.l}</span>
        </button>
      ))}
    </nav>
  );
}

export { TabBar };
