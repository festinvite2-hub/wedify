/**
 * @param {Object} props
 * @param {string} [props.label]
 * @param {"text"|"email"|"password"|"date"|"number"|"select"|"textarea"} [props.type="text"]
 * @param {string|number} props.value
 * @param {Function} props.onChange
 * @param {string} [props.placeholder]
 * @param {Array<{value:string,label:string}>} [props.options]
 * @param {string} [props.error]
 * @param {boolean} [props.required=false]
 */
function Fld({ label, type = "text", value, onChange, placeholder, options, error, required }) {
  const base = `w-full rounded-sm border bg-cream px-[13px] py-[11px] text-[14px] text-ink ${error ? "border-err" : "border-border"}`;
  return (
    <div className="mb-3">
      {label && <label className="mb-1 block text-[10px] font-bold uppercase tracking-[.1em] text-mute">{label}{required ? " *" : ""}</label>}
      {options ? (
        <select value={value || ""} onChange={e => onChange(e.target.value)} className={`${base} appearance-none`}>
          {(options || []).map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${base} resize-y`} />
      ) : (
        <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={base} />
      )}
      {error && <div className="mt-1 text-[11px] text-err">{error}</div>}
    </div>
  );
}

export { Fld };
