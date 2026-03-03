import { ic } from "../lib/icons";

function SearchBar({ value, onChange, placeholder = "Caută...", style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--cd)", border: "1px solid var(--bd)", borderRadius: "var(--rs)", padding: "0 10px", ...style }}>
      <span style={{ color: "var(--mt)" }}>{ic.search}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, padding: "9px 0", fontSize: 13 }} />
    </div>
  );
}

export { SearchBar };
