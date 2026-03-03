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
    <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 460, height: "var(--nv)", display: "flex", alignItems: "center", justifyContent: "space-around", background: theme === "dark" ? "rgba(26,24,22,.95)" : "rgba(255,253,248,.95)", backdropFilter: "blur(14px)", borderTop: "1px solid var(--bd)", paddingBottom: "env(safe-area-inset-bottom,4px)", zIndex: 100 }}>
      {tabs.map(tabItem => (
        <button key={tabItem.k} onClick={() => setTab(tabItem.k)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "5px 2px", minWidth: 44, color: activeTab === tabItem.k ? "var(--g)" : "var(--mt)", transition: "all .2s", position: "relative" }}>
          {activeTab === tabItem.k && <div style={{ position: "absolute", top: -1, width: 18, height: 2, borderRadius: 1, background: "var(--g)" }} />}
          {tabItem.k === "tasks" && overdueCount > 0 && <div style={{ position: "absolute", top: 0, right: 2, width: 16, height: 16, borderRadius: "50%", background: "var(--er)", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{overdueCount}</div>}
          <span style={{ transform: activeTab === tabItem.k ? "scale(1.08)" : "scale(1)", transition: "transform .2s" }}>{tabItem.i}</span>
          <span style={{ fontSize: 8, fontWeight: activeTab === tabItem.k ? 700 : 500, letterSpacing: ".04em", textTransform: "uppercase" }}>{tabItem.l}</span>
        </button>
      ))}
    </nav>
  );
}

export { TabBar };
