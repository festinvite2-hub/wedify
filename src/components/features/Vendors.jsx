import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { mkid } from "../lib/utils";
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

function Stars({v,onChange}){return <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(i=><button key={i} onClick={()=>onChange?.(i)} style={{padding:1,color:i<=v?"var(--g)":"var(--ft)"}}>{i<=v?ic.star:ic.starO}</button>)}</div>}

// ─── AUTH ────────────────────────────────────────────────────
// ─── Auth Screen (Supabase production) ───────────────────────

function Vendors() {
  const { s, d } = useApp(); const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState(null); const [expandedId, setExpandedId] = useState(null);
  const stL = { contracted: "Contractat", negotiating: "Negociere", contacted: "Contactat", potential: "Potențial" };
  const stC = { contracted: "green", negotiating: "blue", contacted: "gold", potential: "gray" };
  const stIcon = { contracted: "✅", negotiating: "🤝", contacted: "📩", potential: "🔍" };
  const catIcon = { "Locație": "📍", "Catering": "🍽️", "Fotograf": "📸", "Muzică": "🎵", "Floristică": "💐", "Transport": "🚗", "Altele": "📦" };
  const ratingLabels = ["", "Slab", "Acceptabil", "Bun", "Foarte bun", "Excelent"];
  const contracted = s.vendors.filter(v => v.status === "contracted").length;
  const negotiating = s.vendors.filter(v => v.status === "negotiating").length;

  return (<div className="fu" style={{ padding: "0 14px 20px" }}>
    {/* Summary */}
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 10, justifyContent: "space-around" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, color: "var(--ok)", fontWeight: 500 }}>{contracted}</div>
          <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Contractați</div>
        </div>
        <div style={{ width: 1, background: "var(--bd)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, color: "#5A82B4", fontWeight: 500 }}>{negotiating}</div>
          <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Negociere</div>
        </div>
        <div style={{ width: 1, background: "var(--bd)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, color: "var(--gd)", fontWeight: 500 }}>{s.vendors.length}</div>
          <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Total</div>
        </div>
      </div>
    </Card>

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Furnizori</span>
      <button onClick={() => { setEditing(null); setShowForm(true) }} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--g)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic.plus}</button>
    </div>

    {s.vendors.length === 0 && <Card style={{ padding: 20, textAlign: "center" }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>📇</div>
      <div style={{ fontSize: 13, color: "var(--mt)" }}>Adaugă primul furnizor</div>
    </Card>}

    {s.vendors.map(v => {
      const isExpanded = expandedId === v.id;
      return (
        <Card key={v.id} style={{ marginBottom: 7, padding: 0, overflow: "hidden" }}>
          <div onClick={() => setExpandedId(isExpanded ? null : v.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--cr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {catIcon[v.cat] || "📦"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{v.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <Badge c={stC[v.status]}>{stIcon[v.status]} {stL[v.status]}</Badge>
                {v.rating > 0 && <span style={{ fontSize: 10, color: "var(--gd)", fontWeight: 600 }}>{"★".repeat(v.rating)} <span style={{ color: "var(--mt)", fontWeight: 400 }}>{ratingLabels[v.rating]}</span></span>}
              </div>
            </div>
            <span style={{ color: "var(--ft)", transition: "transform .2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>{ic.chevD}</span>
          </div>

          {isExpanded && <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--bd)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 0" }}>
              {v.cat && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: "var(--mt)", minWidth: 70 }}>Categorie</span>
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>{v.cat}</span>
              </div>}
              {v.phone && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: "var(--mt)", minWidth: 70 }}>Telefon</span>
                <span style={{ fontWeight: 600, color: "var(--gd)" }}>{v.phone}</span>
              </div>}
              {v.email && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: "var(--mt)", minWidth: 70 }}>Email</span>
                <span style={{ fontWeight: 500, color: "var(--ink)" }}>{v.email}</span>
              </div>}
              {v.notes && <div style={{ fontSize: 11, color: "var(--gr)", fontStyle: "italic", padding: "6px 10px", background: "var(--cr)", borderRadius: 8, marginTop: 2 }}>📝 {v.notes}</div>}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <Btn v="secondary" onClick={() => { setEditing(v); setShowForm(true) }} full style={{ fontSize: 11 }}>{ic.edit} Editează</Btn>
            </div>
          </div>}
        </Card>
      );
    })}
    <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare furnizor" : "Furnizor nou"}>
      {showForm && <VendorFormInner vendor={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
    </Modal>
  </div>);
}

function VendorFormInner({ vendor, onClose }) {
  const { s, d } = useApp(); const [f, setF] = useState(vendor ? { ...vendor } : { name: "", cat: "Locație", phone: "", email: "", status: "potential", rating: 3, notes: "" }); const u = k => v => setF(x => ({ ...x, [k]: v })); const [showConfirm, setShowConfirm] = useState(false);
  const ratingLabels = ["", "Slab", "Acceptabil", "Bun", "Foarte bun", "Excelent"];
  return <>
    <Fld label="Nume furnizor" value={f.name} onChange={u("name")} placeholder="Numele firmei sau persoanei" />
    <Fld label="Categorie" value={f.cat} onChange={u("cat")} options={["Locație", "Catering", "Fotograf", "Muzică", "Floristică", "Transport", "Altele"]} />
    <Fld label="Status" value={f.status} onChange={u("status")} options={[{ value: "potential", label: "🔍 Potențial" }, { value: "contacted", label: "📩 Contactat" }, { value: "negotiating", label: "🤝 Negociere" }, { value: "contracted", label: "✅ Contractat" }]} />
    <Fld label="Telefon" value={f.phone} onChange={u("phone")} placeholder="+40..." />
    <Fld label="Email" value={f.email} onChange={u("email")} type="email" placeholder="email@furnizor.ro" />
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Evaluare: <span style={{ color: "var(--gd)", textTransform: "none" }}>{ratingLabels[f.rating || 0]}</span></label>
      <div style={{ display: "flex", gap: 4 }}>
        {[1,2,3,4,5].map(i => (
          <button key={i} onClick={() => u("rating")(i)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, textAlign: "center", border: `2px solid ${i <= f.rating ? "var(--g)" : "var(--bd)"}`, background: i <= f.rating ? "rgba(184,149,106,.08)" : "var(--cr)", transition: "all .15s" }}>
            <div style={{ fontSize: 14 }}>{i <= f.rating ? "★" : "☆"}</div>
            <div style={{ fontSize: 8, color: i <= f.rating ? "var(--gd)" : "var(--mt)", fontWeight: 600 }}>{ratingLabels[i]}</div>
          </button>
        ))}
      </div>
    </div>
    <Fld label="Note" value={f.notes} onChange={u("notes")} type="textarea" placeholder="Detalii contract, prețuri, observații..." />
    <div style={{ display: "flex", gap: 8 }}>
      <Btn full onClick={() => { if (vendor) d({ type: "SET", p: { vendors: s.vendors.map(v => v.id === vendor.id ? { ...v, ...f } : v) } }); else d({ type: "SET", p: { vendors: [...s.vendors, { ...f, id: mkid() }] } }); onClose() }} disabled={!f.name}>Salvează</Btn>
      {vendor && <Btn v="danger" onClick={() => setShowConfirm(true)}>{ic.trash}</Btn>}
    </div>
    {vendor && <ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={() => { d({ type: "SET", p: { vendors: s.vendors.filter(v => v.id !== vendor.id) } }); onClose() }} title="Șterge furnizorul?" message={`"${vendor?.name}" va fi eliminat.`} />}
  </>;
}

export default Vendors;
