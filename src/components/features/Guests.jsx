import { useEffect, useMemo, useRef, useState } from "react";
import { useData } from "../context/DataContext";
import { mkid, gCount, sumGuests, gTypeIcon, gTypeLabel, generateGuestsPDF, openPDF } from "../lib/utils";
import { dbSync } from "../lib/db-sync";
import { ic } from "../lib/icons";
import { Btn } from "../ui/Btn";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Fld } from "../ui/Fld";
import { Badge } from "../ui/Badge";
import { SearchBar } from "../ui/SearchBar";

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

function Guests() {
  const { state, dispatch } = useData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [qn, setQn] = useState("");
  const [qg, setQg] = useState(state.groups?.[0] || "Prieteni");
  const [qType, setQType] = useState("single");
  const [qFamilySize, setQFamilySize] = useState(3);
  const [confirmDel, setConfirmDel] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const ref = useRef(null);
  const groups = state.groups || ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"];

  const list = useMemo(() => {
    let l = state.guests;
    if (filter !== "all") l = l.filter(g => g.rsvp === filter);
    if (tagFilter) l = l.filter(g => (g.tags || []).includes(tagFilter));
    if (search) l = l.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    return l;
  }, [state.guests, filter, search, tagFilter]);

  const grouped = useMemo(() => { const g = {}; list.forEach(x => { const k = x.group || "Altele"; if (!g[k]) g[k] = []; g[k].push(x) }); return g }, [list]);
  const st = { total: state.guests.length, conf: state.guests.filter(g => g.rsvp === "confirmed").length, pend: state.guests.filter(g => g.rsvp === "pending").length, totalPpl: sumGuests(state.guests), confPpl: sumGuests(state.guests.filter(g => g.rsvp === "confirmed")), pendPpl: sumGuests(state.guests.filter(g => g.rsvp === "pending")) };
  const groupStats = useMemo(() => { const gs = {}; state.guests.forEach(g => { const k = g.group || "Altele"; gs[k] = (gs[k] || 0) + 1 }); return Object.entries(gs).map(([name, count]) => ({ name, count, pct: Math.round((count / Math.max(state.guests.length, 1)) * 100) })); }, [state.guests]);
  const allTags = useMemo(() => { const t = new Set(state.tags || []); state.guests.forEach(g => (g.tags || []).forEach(tag => t.add(tag))); return [...t]; }, [state.guests, state.tags]);
  const gCl = ["#B8956A","#8BA888","#D4A0A0","#5A82B4","#C9A032","#9A9A9A","#A088B8","#B85C5C"];

  const quickCount = qType === "couple" ? 2 : qType === "family" ? Math.max(3, Number(qFamilySize) || 3) : 1;
  const quickAdd = () => { const n = qn.trim(); if (!n) return; dispatch({ type: "ADD_GUEST", p: { id: mkid(), name: n, group: qg, rsvp: "pending", dietary: "", tid: null, notes: "", tags: [], count: quickCount } }); setQn(""); ref.current?.focus() };
  const cycleRsvp = g => { const nx = { pending: "confirmed", confirmed: "declined", declined: "pending" }; dispatch({ type: "UPD_GUEST", p: { id: g.id, rsvp: nx[g.rsvp] } }) };

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {[{ l: "Total", v: st.total, ppl: st.totalPpl, f: "all" }, { l: "Conf.", v: st.conf, ppl: st.confPpl, f: "confirmed" }, { l: "Aștept.", v: st.pend, ppl: st.pendPpl, f: "pending" }].map(x => (
          <button key={x.f} onClick={() => setFilter(f => f === x.f ? "all" : x.f)} style={{ padding: "6px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600, background: filter === x.f ? "var(--ink)" : "var(--cd)", color: filter === x.f ? "var(--bg)" : "var(--mt)", border: `1px solid ${filter === x.f ? "var(--ink)" : "var(--bd)"}` }}>
            {x.l} <span style={{ fontFamily: "var(--fd)", fontSize: 14, marginLeft: 3 }}>{x.v}</span>{x.ppl !== x.v && <span style={{ fontSize: 9, opacity: .6, marginLeft: 2 }}>({x.ppl}p)</span>}
          </button>))}
        <button onClick={() => setShowStats(!showStats)} style={{ padding: "6px 10px", borderRadius: 16, fontSize: 11, fontWeight: 600, background: showStats ? "rgba(184,149,106,.1)" : "var(--cd)", color: showStats ? "var(--gd)" : "var(--mt)", border: `1px solid ${showStats ? "var(--g)" : "var(--bd)"}`, marginLeft: "auto" }}>📊</button>
      </div>

      {showStats && <Card style={{ marginBottom: 12, padding: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Distribuție pe grupuri</div>
        {groupStats.map((g, i) => (
          <div key={g.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: gCl[i % gCl.length], flexShrink: 0 }} />
            <span style={{ fontSize: 12, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
            <div style={{ width: 80, height: 6, background: "var(--cr2)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 3, width: `${g.pct}%`, background: gCl[i % gCl.length] }} /></div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gd)", minWidth: 24, textAlign: "right" }}>{g.count}</span>
            <span style={{ fontSize: 10, color: "var(--mt)", minWidth: 26 }}>{g.pct}%</span>
          </div>
        ))}
      </Card>}

      {allTags.length > 0 && <div style={{ display: "flex", gap: 4, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
        <span style={{ fontSize: 10, color: "var(--mt)", alignSelf: "center", marginRight: 2, flexShrink: 0 }}>{ic.tag}</span>
        {allTags.map(t => { const cnt = state.guests.filter(g => (g.tags || []).includes(t)).length; return (
          <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)} style={{ padding: "3px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, background: tagFilter === t ? "var(--gd)" : "var(--cr)", color: tagFilter === t ? "#fff" : "var(--gr)", border: `1px solid ${tagFilter === t ? "var(--gd)" : "var(--bd)"}` }}>{t} <span style={{ opacity: .6 }}>{cnt}</span></button>
        ); })}
      </div>}

      {/* Quick add with configurable groups */}
      <Card style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(184,149,106,.03)", border: "1.5px dashed var(--gl)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gd)" }}>⚡ Adaugă rapid</div>
          <button onClick={() => setShowImport(true)} style={{ fontSize: 10, fontWeight: 600, color: "var(--g)", padding: "3px 8px", borderRadius: 8, background: "rgba(184,149,106,.08)" }}>📥 Import CSV</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 7 }}>
          <input ref={ref} value={qn} onChange={e => setQn(e.target.value)} onKeyDown={e => e.key === "Enter" && quickAdd()} placeholder="Nume invitat/familie..." style={{ flex: 1, padding: "9px 11px", borderRadius: "var(--rs)", background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 13 }} />
          <select value={qg} onChange={e => setQg(e.target.value)} style={{ padding: "9px 6px", borderRadius: "var(--rs)", background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 11, color: "var(--gr)", maxWidth: 110 }}>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={quickAdd} style={{ width: 38, height: 38, borderRadius: "var(--rs)", background: "var(--g)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic.plus}</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {[{k:"single",l:"👤 Single"},{k:"couple",l:"👫 Cuplu"},{k:"family",l:"👨‍👩‍👧 Familie"}].map(t => (
            <button key={t.k} onClick={() => setQType(t.k)} style={{ padding: "5px 9px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: qType === t.k ? "var(--gd)" : "var(--cd)", color: qType === t.k ? "#fff" : "var(--gr)", border: `1px solid ${qType === t.k ? "var(--gd)" : "var(--bd)"}` }}>{t.l}</button>
          ))}
          {qType === "family" && <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 2 }}>
            <span style={{ fontSize: 10, color: "var(--mt)", fontWeight: 700 }}>Persoane</span>
            <button onClick={() => setQFamilySize(v => Math.max(3, v - 1))} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--bd)", background: "var(--cd)", fontWeight: 700, color: "var(--gr)" }}>−</button>
            <span style={{ minWidth: 14, textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--gd)" }}>{qFamilySize}</span>
            <button onClick={() => setQFamilySize(v => Math.min(12, v + 1))} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--bd)", background: "var(--cd)", fontWeight: 700, color: "var(--gr)" }}>+</button>
          </div>}
          <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--mt)", fontWeight: 600 }}>Se adaugă: {quickCount} pers.</span>
        </div>
      </Card>

      <SearchBar value={search} onChange={setSearch} placeholder="Caută..." style={{ marginBottom: 12 }} />

      {Object.entries(grouped).map(([gn, gl]) => (
        <div key={gn} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5, paddingLeft: 2 }}>{gn} ({gl.length})</div>
          {gl.map(g => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "var(--cd)", borderRadius: "var(--rs)", border: "1px solid var(--bd)", marginBottom: 5 }}>
              <button onClick={() => cycleRsvp(g)} title="Apasă pentru a schimba statusul" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: g.rsvp === "confirmed" ? "var(--ok)" : g.rsvp === "declined" ? "var(--er)" : "var(--cr2)", color: g.rsvp === "pending" ? "var(--mt)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, border: g.rsvp === "pending" ? "2px dashed var(--ft)" : "none", transition: "all .2s" }}>
                  {g.rsvp === "confirmed" ? "✓" : g.rsvp === "declined" ? "✕" : "?"}
                </div>
                <span style={{ fontSize: 8, fontWeight: 600, color: g.rsvp === "confirmed" ? "var(--ok)" : g.rsvp === "declined" ? "var(--er)" : "var(--mt)", textTransform: "uppercase", letterSpacing: ".04em", lineHeight: 1 }}>
                  {g.rsvp === "confirmed" ? "Da" : g.rsvp === "declined" ? "Nu" : "Apasă"}
                </span>
              </button>
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => { setEditing(g); setShowForm(true) }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
                <div style={{ display: "flex", gap: 3, marginTop: 1, flexWrap: "wrap" }}>{g.dietary && <Badge c="rose">{g.dietary}</Badge>}{g.tid && <Badge c="green">Așezat</Badge>}{g.notes && <span style={{ fontSize: 10, color: "var(--mt)" }} title={g.notes}>📝</span>}{(g.tags||[]).map(t=><Badge key={t} c="blue">{t}</Badge>)}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setConfirmDel(g.id) }} style={{ padding: 4, color: "var(--ft)" }}>{ic.trash}</button>
            </div>
          ))}
        </div>
      ))}

      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => dispatch({ type: "DEL_GUEST", p: confirmDel })} title="Șterge invitatul?" message="Invitatul va fi eliminat din listă și de la masă. Acțiunea nu poate fi anulată." />

      <ImportCSV open={showImport} onClose={() => setShowImport(false)} />

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare" : "Invitat nou"}>
        {showForm && <GuestFormInner guest={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
      </Modal>
    </div>
  );
}

function GuestFormInner({ guest, onClose }) {
  const { state, dispatch } = useData();
  const groups = state.groups || ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"];
  const allTags = state.tags || ["Copil","Cazare","Parcare","Din alt oraș","Martor","Naș/Nașă"];
  const [formData, setFormData] = useState(guest ? { ...guest, tags: guest.tags || [], count: guest.count || 1 } : { name: "", group: groups[0], rsvp: "pending", dietary: "", notes: "", tags: [], count: 1 });
  const updater = k => v => setFormData(x => ({ ...x, [k]: v }));
  const toggleTag = t => setFormData(x => ({ ...x, tags: x.tags.includes(t) ? x.tags.filter(v => v !== t) : [...x.tags, t] }));
  return <>
    <Fld label="Nume" value={formData.name} onChange={updater("name")} />
    <div style={{display:"flex",gap:8,marginBottom:12}}>
      <div style={{flex:1}}>
        <Fld label="Grup" value={formData.group} onChange={updater("group")} options={groups} />
      </div>
      <div style={{width:100}}>
        <Fld label="Persoane" value={formData.count} onChange={v=>updater("count")(Number(v)||1)} options={[{value:1,label:"👤 1"},{value:2,label:"👫 2"},{value:3,label:"👨‍👩‍👧 3"},{value:4,label:"👨‍👩‍👧‍👦 4"},{value:5,label:"5"},{value:6,label:"6"}]} />
      </div>
    </div>
    <Fld label="RSVP" value={formData.rsvp} onChange={updater("rsvp")} options={[{ value: "pending", label: "Așteptare" }, { value: "confirmed", label: "Confirmat" }, { value: "declined", label: "Refuzat" }]} />
    <Fld label="Restricții alimentare" value={formData.dietary} onChange={updater("dietary")} placeholder="vegetarian, vegan..." />
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5 }}>Tag-uri</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {allTags.map(t => (
          <button key={t} onClick={() => toggleTag(t)} style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: formData.tags.includes(t) ? "var(--gd)" : "var(--cr)", color: formData.tags.includes(t) ? "#fff" : "var(--gr)", border: `1px solid ${formData.tags.includes(t) ? "var(--gd)" : "var(--bd)"}` }}>{t}</button>
        ))}
      </div>
    </div>
    <Fld label="Note" value={formData.notes} onChange={updater("notes")} type="textarea" placeholder="Vine cu copil, necesită cazare..." />
    <Btn full onClick={() => { dispatch({ type: guest ? "UPD_GUEST" : "ADD_GUEST", p: { ...formData, id: guest?.id || mkid(), tid: formData.tid || null } }); onClose() }} disabled={!formData.name}>{guest ? "Salvează" : "Adaugă"}</Btn>
  </>;
}

// ── Seated Guest Row (extracted for hooks) ──────────────────

function ImportCSV({ open, onClose }) {
  const { state, dispatch, showToast } = useData();
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState([]);
  const groups = state.groups || ["Prieteni"];

  const parse = (text) => {
    const lines = text.trim().split("\n").filter(l => l.trim());
    const guests = [];
    for (const line of lines) {
      // Support: "Name, Group, Dietary" or just "Name"
      const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ""));
      if (parts[0] && parts[0].length > 1) {
        guests.push({
          id: mkid(),
          name: parts[0],
          group: parts[1] && groups.includes(parts[1]) ? parts[1] : groups[0],
          rsvp: "pending",
          dietary: parts[2] || "",
          tid: null,
          notes: parts[3] || "",
        });
      }
    }
    return guests;
  };

  useEffect(() => { if (raw) setPreview(parse(raw)); else setPreview([]); }, [raw]);

  const doImport = () => {
    if (preview.length === 0) return;
    dispatch({ type: "IMPORT_GUESTS", p: preview });
    showToast?.(`${preview.length} invitați importați!`, "success");
    setRaw("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Import invitați">
      <div style={{ fontSize: 12, color: "var(--mt)", marginBottom: 10 }}>
        Lipește lista de invitați, câte un rând per invitat. Format: <b>Nume, Grup, Restricții</b> (doar numele e obligatoriu).
      </div>
      <textarea value={raw} onChange={e => setRaw(e.target.value)} placeholder={"Maria Popescu, Familie Mireasă, vegetarian\nIon Ionescu, Familie Mire\nElena Dragomir"} rows={6} style={{ width: "100%", padding: "11px 13px", background: "var(--cr)", border: "1.5px solid var(--bd)", borderRadius: "var(--rs)", fontSize: 13, fontFamily: "monospace", resize: "vertical", marginBottom: 10 }} />
      {preview.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ok)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>
            ✓ {preview.length} invitați detectați
          </div>
          <div style={{ maxHeight: 120, overflow: "auto", borderRadius: "var(--rs)", border: "1px solid var(--bd)" }}>
            {preview.slice(0, 10).map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderTop: i ? "1px solid var(--bd)" : "none", fontSize: 12 }}>
                <span style={{ fontWeight: 600, flex: 1 }}>{g.name}</span>
                <Badge c="gold">{g.group}</Badge>
                {g.dietary && <Badge c="rose">{g.dietary}</Badge>}
              </div>
            ))}
            {preview.length > 10 && <div style={{ padding: "6px 10px", fontSize: 11, color: "var(--mt)" }}>...și încă {preview.length - 10}</div>}
          </div>
        </div>
      )}
      <Btn full onClick={doImport} disabled={preview.length === 0}>Importă {preview.length} invitați</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🎉 ONBOARDING WIZARD
// ═══════════════════════════════════════════════════════════════

export default Guests;
