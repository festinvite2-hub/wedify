import { ic } from "../lib/icons";

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {Function} props.onChange
 * @param {string} [props.placeholder="Caută..."]
 */
function SearchBar({ value, onChange, placeholder = "Caută...", style }) {
  return (
    <div className="flex items-center gap-2 rounded-sm border border-border bg-card px-2.5" style={style}>
      <span className="text-mute">{ic.search}</span>
      <input className="flex-1 bg-transparent py-2 text-sm outline-none" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export { SearchBar };
