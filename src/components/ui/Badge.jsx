/**
 * @param {Object} props
 * @param {"confirmed"|"pending"|"declined"|"paid"|"partial"|"unpaid"|"contracted"|"negotiating"|"potential"|"rejected"} [props.type]
 * @param {React.ReactNode} props.children
 */
function Badge({ type = "pending", children, c }) {
  const t = c || type;
  const map = {
    confirmed: { b: "rgba(107,158,104,.12)", c: "var(--ok)" },
    paid: { b: "rgba(107,158,104,.12)", c: "var(--ok)" },
    pending: { b: "rgba(90,130,180,.12)", c: "#5A82B4" },
    declined: { b: "rgba(184,92,92,.12)", c: "var(--er)" },
    unpaid: { b: "rgba(184,92,92,.12)", c: "var(--er)" },
    partial: { b: "rgba(201,160,50,.15)", c: "var(--wn)" },
    negotiating: { b: "rgba(201,160,50,.15)", c: "var(--wn)" },
    gold: { b: "rgba(184,149,106,.1)", c: "var(--gd)" },
    green: { b: "rgba(107,158,104,.12)", c: "var(--ok)" },
    red: { b: "rgba(184,92,92,.12)", c: "var(--er)" },
    blue: { b: "rgba(90,130,180,.12)", c: "#5A82B4" },
    gray: { b: "rgba(160,160,160,.08)", c: "var(--mt)" },
    rose: { b: "rgba(212,160,160,.12)", c: "#B07070" },
  };
  const state = map[t] || map.pending;
  return <span className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.06em]" style={{ background: state.b, color: state.c }}>{children}</span>;
}

export { Badge };
