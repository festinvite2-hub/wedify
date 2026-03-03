import { ic } from "../lib/icons";
import { useTheme } from "../context/ThemeContext";
import { useData } from "../context/DataContext";

/**
 * Consumă context intern (wedding name, theme, toggleTheme, setTab).
 * Nu primește props externe obligatorii.
 */
function Header({ title, onOpenSettings }) {
  const { theme, toggleTheme } = useTheme();
  const { state, setTab } = useData();
  return (
    <header className="z-[100] flex h-header shrink-0 items-center justify-between border-b border-border px-3.5 backdrop-blur-[12px]" style={{ background: theme === "dark" ? "rgba(26,24,22,.92)" : "rgba(255,253,248,.92)" }}>
      <button onClick={() => setTab("home")} className="flex items-center gap-[7px]">
        <img src="/wedify-logo.png" alt="Wedify" className="h-8 w-8 object-contain" onError={(e)=>{e.currentTarget.style.display="none";e.currentTarget.nextElementSibling?.classList.remove("hidden");}} /><span className="hidden font-display text-base font-semibold">W</span>
        <span className="font-display text-base font-medium">{title || state?.wedding?.couple || "Wedify"}</span>
      </button>
      <div className="flex items-center gap-[5px]">
        <button onClick={toggleTheme} className="p-[5px] text-mute">{theme === "dark" ? ic.moon : ic.sun}</button>
        <button onClick={onOpenSettings} className="p-[5px] text-mute">{ic.settings}</button>
      </div>
    </header>
  );
}

export { Header };
