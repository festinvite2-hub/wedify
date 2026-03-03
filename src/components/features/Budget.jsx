import { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { mkid, fmtC, parseBudgetNotes, serializeBudgetNotes } from "../lib/utils";
import { dbSync } from "../lib/db-sync";
import { ic } from "../lib/icons";
import { Btn } from "../ui/Btn";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Fld } from "../ui/Fld";
import { Badge } from "../ui/Badge";

function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 320, background: "var(--cd)", color: "var(--ink)", borderRadius: "var(--r)", padding: "24px 20px", boxShadow: "0 12px 40px rgba(0,0,0,.15)", animation: "fadeUp .25s ease-out both" }}>
        <h4 style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 500, marginBottom: 8 }}>{title || "Confirmare"}</h4>
        <p style={{ fontSize: 13, color: "var(--gr)", marginBottom: 20, lineHeight: 1.5 }}>{message || "Ești sigur? Acțiunea nu poate fi anulată."}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="secondary" onClick={onClose} full>Anulează</Btn>
          <Btn v="danger" onClick={() => { onConfirm(); onClose(); }} full>Șterge</Btn>
        </div>
      </div>
    </div>
  );
}

function Budget() {
  const { state, dispatch } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const tP = state.budget.reduce((a, b) => a + b.planned, 0);
  const tS = state.budget.reduce((a, b) => a + b.spent, 0);
  const pct = tP > 0 ? Math.round((tS / tP) * 100) : 0;
  const cl = ["#B8956A", "#8BA888", "#D4A0A0", "#5A82B4", "#C9A032", "#B85C5C", "#9A9A9A", "#A088B8"];
  const vendorByName = useMemo(() => new Map((state.vendors || []).map(v => [(v.name || "").trim().toLowerCase(), v])), [state.vendors]);

  // SVG donut
  let angle = 0;
  const arcs = state.budget.map((b, i) => {
    const sl = tS > 0 ? (b.spent / tS) * 360 : 0;
    const s2 = angle; angle += sl;
    const sr = ((s2 - 90) * Math.PI) / 180, er = ((s2 + sl - 90) * Math.PI) / 180;
    const x1 = 55 + 42 * Math.cos(sr), y1 = 55 + 42 * Math.sin(sr);
    const x2 = 55 + 42 * Math.cos(er), y2 = 55 + 42 * Math.sin(er);
    return { path: `M55 55 L${x1} ${y1} A42 42 0 ${sl > 180 ? 1 : 0} 1 ${x2} ${y2}Z`, color: cl[i % cl.length], ...b };
  });

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      <Card style={{ marginBottom: 12, display: "flex", gap: 14, alignItems: "center" }}>
        <svg width={110} height={110} viewBox="0 0 110 110">
          {arcs.map((a, i) => <path key={i} d={a.path} fill={a.color} opacity={.85} />)}
          <circle cx={55} cy={55} r={22} fill="var(--cd)" />
          <text x={55} y={52} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)" fontFamily="var(--f)">{pct}%</text>
          <text x={55} y={63} textAnchor="middle" fontSize="7" fill="var(--mt)" fontFamily="var(--f)">consumat</text>
        </svg>
        <div style={{ flex: 1 }}>
          {[{ l: "Planificat", v: fmtC(tP), c: "var(--ink)" }, { l: "Cheltuit", v: fmtC(tS), c: "var(--g)" }, { l: "Rămas", v: fmtC(tP - tS), c: tP - tS >= 0 ? "var(--ok)" : "var(--er)" }].map(x => (
            <div key={x.l} style={{ marginBottom: 5 }}><div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>{x.l}</div><div style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 500, color: x.c }}>{x.v}</div></div>
          ))}
        </div>
      </Card>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {state.budget.map((b, i) => (
          <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cl[i % cl.length] }} /><span style={{ color: "var(--gr)" }}>{b.cat}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Categorii</span>
        <Btn v="secondary" onClick={() => { setEditing(null); setShowForm(true) }} style={{ fontSize: 10, padding: "4px 10px" }}>{ic.plus} Adaugă</Btn>
      </div>
      {state.budget.map((b, i) => { const payload = Math.round((b.spent / Math.max(b.planned, 1)) * 100); const linkedVendor = vendorByName.get((b.vendor || "").trim().toLowerCase()); return (
        <Card key={b.id} onClick={() => { setEditing(b); setShowForm(true) }} style={{ marginBottom: 7, cursor: "pointer", padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: cl[i % cl.length] }} /><span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{b.cat}</span><Badge c={b.status === "paid" ? "green" : b.status === "partial" ? "blue" : "gray"}>{b.status === "paid" ? "Plătit" : b.status === "partial" ? "Parțial" : "Neplătit"}</Badge></div>
          {b.vendor && <div style={{ fontSize: 10, color: "var(--mt)", marginBottom: 3 }}>📍 {b.vendor}</div>}
          {linkedVendor && <div style={{ display: "flex", gap: 5, marginBottom: 4, flexWrap: "wrap" }}><Badge c={linkedVendor.status === "contracted" ? "green" : linkedVendor.status === "negotiating" ? "blue" : "gray"}>{linkedVendor.status === "contracted" ? "Contractat" : linkedVendor.status === "negotiating" ? "Negociere" : linkedVendor.status === "potential" ? "Potențial" : linkedVendor.status}</Badge><Badge c="gold">⭐ {linkedVendor.rating || 0}/5</Badge></div>}
          {b.notes && <div style={{ fontSize: 10, color: "var(--mt)", marginBottom: 3, fontStyle: "italic" }}>📝 {b.notes}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><span>{fmtC(b.spent)}</span><span style={{ color: "var(--mt)" }}>{fmtC(b.planned)}</span></div>
          <div style={{ height: 4, background: "var(--cr2)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 2, width: `${Math.min(payload, 100)}%`, background: payload > 100 ? "var(--er)" : "var(--g)", transition: "width .5s" }} /></div>
          {payload > 100 && <div style={{ fontSize: 9, color: "var(--er)", fontWeight: 600, marginTop: 2 }}>⚠ +{fmtC(b.spent - b.planned)}</div>}
        </Card>
      ) })}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare" : "Categorie nouă"}>
        {showForm && <BudgetFormInner item={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
      </Modal>
    </div>
  );
}

function BudgetFormInner({ item, onClose }) {
  const { state, dispatch } = useData();
  const [formData, setFormData] = useState(item ? { ...item, payments: item.payments || [] } : { cat: "", planned: 0, spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] });
  const [showConfirm, setShowConfirm] = useState(false);
  const [pAmt, setPAmt] = useState(0);
  const [pDate, setPDate] = useState(new Date().toISOString().slice(0, 10));
  const [pNote, setPNote] = useState("");
  const updater = k => v => setFormData(x => ({ ...x, [k]: v }));

  const norm = (v) => (v || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  const sameCat = (vCat, bCat) => norm(vCat).includes(norm(bCat)) || norm(bCat).includes(norm(vCat));

  const vendors = state.vendors || [];
  const linkedByCat = vendors.filter(v => formData.cat && sameCat(v.cat, formData.cat));
  const contractedByCat = linkedByCat.find(v => v.status === "contracted");
  const vendorOptions = [{ value: "", label: "— Selectează furnizor —" }, ...vendors.map(v => ({ value: v.name, label: `${v.name}${v.cat ? ` · ${v.cat}` : ""}${v.status ? ` (${v.status})` : ""}` }))];

  useEffect(() => {
    if (!formData.cat || formData.vendor) return;
    if (contractedByCat?.name) setFormData(x => ({ ...x, vendor: contractedByCat.name }));
  }, [formData.cat, formData.vendor, contractedByCat?.name]);

  const payments = formData.payments || [];
  const spentFromPayments = payments.reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const effectiveSpent = payments.length > 0 ? spentFromPayments : (Number(formData.spent) || 0);

  const addPayment = () => {
    const amt = Number(pAmt) || 0;
    if (amt <= 0) return;
    setFormData(x => ({ ...x, payments: [...(x.payments || []), { id: mkid(), amount: amt, date: pDate || new Date().toISOString().slice(0, 10), note: pNote || "" }], spent: spentFromPayments + amt }));
    setPAmt(0); setPNote("");
  };
  const delPayment = (id) => setFormData(x => {
    const nx = (x.payments || []).filter(p => p.id !== id);
    const spent = nx.reduce((a, p) => a + (Number(p.amount) || 0), 0);
    return { ...x, payments: nx, spent };
  });

  return <>
    <Fld label="Categorie" value={formData.cat} onChange={updater("cat")} />
    <Fld label="Planificat (€)" value={formData.planned} onChange={v => updater("planned")(parseFloat(v) || 0)} type="number" />
    <Fld label="Cheltuit total (€)" value={effectiveSpent} onChange={v => updater("spent")(parseFloat(v) || 0)} type="number" />

    <div style={{ marginBottom: 12, padding: 10, borderRadius: "var(--rs)", border: "1px solid var(--bd)", background: "var(--cr)" }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 6 }}>Istoric plăți</div>
      {(payments || []).length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
        {payments.map(pay => <div key={pay.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--bd)", background: "var(--cd)" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gd)", minWidth: 68 }}>{fmtC(pay.amount)}</span>
          <span style={{ fontSize: 10, color: "var(--mt)", minWidth: 78 }}>{fmtD(pay.date)}</span>
          <span style={{ fontSize: 10, color: "var(--gr)", flex: 1, minWidth: 0 }}>{pay.note || "—"}</span>
          <button onClick={() => delPayment(pay.id)} style={{ padding: 2, color: "var(--mt)" }}>{ic.trash}</button>
        </div>)}
      </div> : <div style={{ fontSize: 11, color: "var(--mt)", marginBottom: 8 }}>Nicio plată înregistrată încă.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
        <input type="number" value={pAmt} onChange={e => setPAmt(e.target.value)} placeholder="Suma (€)" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 12 }} />
        <input type="date" value={pDate} onChange={e => setPDate(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 12 }} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={pNote} onChange={e => setPNote(e.target.value)} placeholder="Notă (avans, rată, rest...)" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 12 }} />
        <Btn v="secondary" onClick={addPayment} style={{ fontSize: 11, padding: "8px 10px" }}>{ic.plus} Plată</Btn>
      </div>
    </div>

    {contractedByCat && <div style={{ marginBottom: 8, fontSize: 10, color: "var(--ok)", fontWeight: 600 }}>🔗 Sugestie automată pentru categorie: {contractedByCat.name} (contractat)</div>}
    <Fld label="Furnizor (din listă)" value={formData.vendor} onChange={updater("vendor")} options={vendorOptions} />
    <Fld label="Sau introdu manual" value={formData.vendor} onChange={updater("vendor")} placeholder="Nume furnizor..." />

    {linkedByCat.length > 0 && <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 5 }}>Furnizori pe această categorie</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {linkedByCat.map(v => <button key={v.id} onClick={() => updater("vendor")(v.name)} style={{ padding: "4px 8px", borderRadius: 10, fontSize: 10, background: formData.vendor === v.name ? "var(--gd)" : "var(--cr)", color: formData.vendor === v.name ? "#fff" : "var(--gr)", border: `1px solid ${formData.vendor === v.name ? "var(--gd)" : "var(--bd)"}` }}>{v.name} {v.status === "contracted" ? "✓" : ""}</button>)}
      </div>
    </div>}

    <Fld label="Status" value={formData.status} onChange={updater("status")} options={[{ value: "unpaid", label: "Neplătit" }, { value: "partial", label: "Parțial" }, { value: "paid", label: "Plătit" }]} />
    <Fld label="Note" value={formData.notes} onChange={updater("notes")} type="textarea" placeholder="Plata în 2 rate, factură trimisă..." />
    <div style={{ display: "flex", gap: 8 }}>
      <Btn full onClick={() => { const cleanNotes = formData.notes || ""; dispatch({ type: item ? "UPD_BUDGET" : "ADD_BUDGET", p: { ...formData, spent: effectiveSpent, notes: cleanNotes, id: item?.id || mkid() } }); onClose() }} disabled={!formData.cat}>Salvează</Btn>
      {item && <Btn v="danger" onClick={() => setShowConfirm(true)}>{ic.trash}</Btn>}
    </div>
    <ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={() => { dispatch({ type: "DEL_BUDGET", p: item.id }); onClose() }} title="Șterge categoria?" message={`"${item?.cat}" va fi eliminată din buget.`} />
  </>;
}

// ═══════════════════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════════════════

export default Budget;
