function Fld({ label, type = "text", value, onChange, placeholder, options, error, required }) {
  const base = { width: "100%", padding: "11px 13px", background: "var(--cr)", border: `1.5px solid ${error ? "var(--er)" : "var(--bd)"}`, borderRadius: "var(--rs)", fontSize: 14, color: "var(--ink)" };
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>{label}{required ? " *" : ""}</label>}
      {options ? (
        <select value={value || ""} onChange={e => onChange(e.target.value)} style={{ ...base, appearance: "none" }}>
          {(options || []).map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize: "vertical" }} />
      ) : (
        <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      )}
      {error && <div style={{ marginTop: 4, fontSize: 11, color: "var(--er)" }}>{error}</div>}
    </div>
  );
}

export { Fld };
