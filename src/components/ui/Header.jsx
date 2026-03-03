import { LOGO_XS } from "../lib/constants";
import { ic } from "../lib/icons";
import { useTheme } from "../context/ThemeContext";
import { useData } from "../context/DataContext";

function Header({ title, onOpenSettings }) {
  const { theme, toggleTheme } = useTheme();
  const { state, setTab } = useData();
  return (
    <header style={{ height: "var(--hd)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderBottom: "1px solid var(--bd)", background: theme === "dark" ? "rgba(26,24,22,.92)" : "rgba(255,253,248,.92)", backdropFilter: "blur(12px)", flexShrink: 0, zIndex: 100 }}>
      <button onClick={() => setTab("home")} style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <img src={LOGO_XS} alt="Wedify" style={{ width: 28, height: 28, objectFit: "contain" }} />
        <span style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 500 }}>{title || state?.wedding?.couple || "Wedify"}</span>
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <button onClick={toggleTheme} style={{ padding: 5, color: "var(--mt)" }}>{theme === "dark" ? ic.moon : ic.sun}</button>
        <button onClick={onOpenSettings} style={{ padding: 5, color: "var(--mt)" }}>{ic.settings}</button>
      </div>
    </header>
  );
}

export { Header };
