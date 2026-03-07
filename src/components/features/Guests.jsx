import { useEffect, useMemo, useRef, useState } from "react";
import { useData } from "../context/DataContext";
import { mkid, gCount, sumGuests, gTypeIcon, gTypeLabel } from "../lib/utils";
import { dbSync } from "../lib/db-sync";
import { ic } from "../lib/icons";
import { Btn } from "../ui/Btn";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Fld } from "../ui/Fld";
import { Badge } from "../ui/Badge";
import { SearchBar } from "../ui/SearchBar";

const DEFAULT_GROUPS = ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"];

function Guests() {
  const { state, dispatch, setTab, weddingId, showToast } = useData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [qn, setQn] = useState("");
  const [qg, setQg] = useState("");
  const [qType, setQType] = useState("single");
  const [personsCount, setPersonsCount] = useState(1);
  const [confirmDel, setConfirmDel] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showManageGroups, setShowManageGroups] = useState(false);
  const ref = useRef(null);

  const groups = state.groups || DEFAULT_GROUPS;
  const guestGroups = useMemo(() => {
    if (Array.isArray(state.guestGroups) && state.guestGroups.length > 0) return state.guestGroups;
    return groups.map((name, i) => ({ id: `legacy-${name}`, name, sort_order: i }));
  }, [state.guestGroups, groups]);

  const groupNameById = useMemo(() => new Map(guestGroups.map(group => [group.id, group.name])), [guestGroups]);
  const getGuestGroupName = (guest) => {
    if (guest.groupId && groupNameById.has(guest.groupId)) return groupNameById.get(guest.groupId);
    if (guest.group) return guest.group;
    return "Altele";
  };

  useEffect(() => {
    if (!qg && guestGroups[0]?.id) setQg(guestGroups[0].id);
    if (qg && !guestGroups.some(group => group.id === qg)) setQg(guestGroups[0]?.id || "");
  }, [guestGroups, qg]);

  const list = useMemo(() => {
    let l = state.guests;
    if (filter !== "all") l = l.filter(g => g.rsvp === filter);
    if (search) l = l.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    return l;
  }, [state.guests, filter, search]);

  const grouped = useMemo(() => {
    const groupedGuests = {};
    list.forEach(guest => {
      const key = getGuestGroupName(guest);
      if (!groupedGuests[key]) groupedGuests[key] = [];
      groupedGuests[key].push(guest);
    });
    return groupedGuests;
  }, [list, groupNameById]);

  const st = { total: state.guests.length, conf: state.guests.filter(g => g.rsvp === "confirmed").length, pend: state.guests.filter(g => g.rsvp === "pending").length, totalPpl: sumGuests(state.guests), confPpl: sumGuests(state.guests.filter(g => g.rsvp === "confirmed")), pendPpl: sumGuests(state.guests.filter(g => g.rsvp === "pending")) };
  const groupStats = useMemo(() => {
    const gs = {};
    state.guests.forEach(guest => { const k = getGuestGroupName(guest); gs[k] = (gs[k] || 0) + 1; });
    return Object.entries(gs).map(([name, count]) => ({ name, count, pct: Math.round((count / Math.max(state.guests.length, 1)) * 100) }));
  }, [state.guests, groupNameById]);
  const gCl = ["#B8956A", "#8BA888", "#D4A0A0", "#5A82B4", "#C9A032", "#9A9A9A", "#A088B8", "#B85C5C"];

  const quickCount = personsCount;
  const setQuickType = (type) => {
    setQType(type);
    if (type === "single") setPersonsCount(1);
    else if (type === "family") setPersonsCount(2);
    else setPersonsCount(current => Math.min(20, Math.max(3, current < 3 ? 4 : current)));
  };
  const selectedQuickGroup = guestGroups.find(group => group.id === qg) || guestGroups[0];
  const quickAdd = () => {
    const n = qn.trim();
    if (!n || !selectedQuickGroup) return;
    dispatch({ type: "ADD_GUEST", p: { id: mkid(), name: n, group: selectedQuickGroup.name, groupId: selectedQuickGroup.id, rsvp: "pending", dietary: "", tid: null, notes: "", tags: [], count: quickCount } });
    setQn("");
    ref.current?.focus();
  };
  const cycleRsvp = g => { const nx = { pending: "confirmed", confirmed: "declined", declined: "pending" }; dispatch({ type: "UPD_GUEST", p: { id: g.id, rsvp: nx[g.rsvp] } }); };

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

      <Card style={{ marginBottom: 12, padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 12, color: "var(--gr)" }}>Exportul listelor este disponibil în secțiunea <b>Unelte</b>.</div>
          <button onClick={() => setTab("tools")} style={{ padding: "6px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, color: "var(--gd)", border: "1px solid var(--bd)", background: "var(--cd)", whiteSpace: "nowrap" }}>Vezi Unelte →</button>
        </div>
      </Card>

      <Card style={{ marginBottom: 12, padding: "12px", background: "rgba(184,149,106,.04)", border: "1.5px solid var(--gl)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gd)", marginBottom: 10 }}>Adăugare invitat</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            ref={ref}
            value={qn}
            onChange={e => setQn(e.target.value)}
            onKeyDown={e => e.key === "Enter" && qn.trim() && quickAdd()}
            placeholder="Nume invitat/familie..."
            style={{ width: "100%", padding: "11px 12px", borderRadius: "var(--rs)", background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 14 }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
            <select value={qg} onChange={e => setQg(e.target.value)} style={{ width: "100%", padding: "11px 10px", borderRadius: "var(--rs)", background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 13, color: "var(--gr)", minHeight: 44 }}>
              {guestGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
            <button onClick={() => setShowManageGroups(true)} aria-label="Gestionează categorii" title="Gestionează categorii" style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid var(--bd)", background: "var(--cd)", fontSize: 18, color: "var(--gd)", fontWeight: 700, lineHeight: 1 }}>
              +
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 }}>
            {[{ k: "single", l: "Single" }, { k: "family", l: "Familie" }, { k: "extendedFamily", l: "Familie extinsă" }].map(t => (
              <button key={t.k} onClick={() => setQuickType(t.k)} style={{ minHeight: 42, padding: "8px 6px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: qType === t.k ? "var(--gd)" : "var(--cd)", color: qType === t.k ? "#fff" : "var(--gr)", border: `1px solid ${qType === t.k ? "var(--gd)" : "var(--bd)"}` }}>{t.l}</button>
            ))}
          </div>

          {qType === "extendedFamily" && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 2 }}>
              <button onClick={() => setPersonsCount(current => Math.max(3, current - 1))} style={{ width: 42, height: 42, borderRadius: 12, border: "1px solid var(--bd)", background: "var(--cd)", fontSize: 20, fontWeight: 700, color: "var(--gr)", lineHeight: 1 }}>−</button>
              <div style={{ minWidth: 50, textAlign: "center", fontSize: 18, fontWeight: 700, color: "var(--gd)" }}>{personsCount}</div>
              <button onClick={() => setPersonsCount(current => Math.min(20, current + 1))} style={{ width: 42, height: 42, borderRadius: 12, border: "1px solid var(--bd)", background: "var(--cd)", fontSize: 20, fontWeight: 700, color: "var(--gr)", lineHeight: 1 }}>+</button>
            </div>
          )}

          <div style={{ fontSize: 11, color: "var(--mt)", textAlign: "center", marginTop: 2 }}>
            Se vor adăuga <b style={{ color: "var(--gd)" }}>{quickCount}</b> persoane
          </div>

          <button
            onClick={quickAdd}
            disabled={!qn.trim()}
            style={{ width: "100%", minHeight: 46, borderRadius: "var(--rs)", background: qn.trim() ? "var(--g)" : "var(--cr2)", color: qn.trim() ? "#fff" : "var(--mt)", border: "1px solid transparent", fontSize: 14, fontWeight: 700, marginTop: 2 }}
          >
            Adaugă
          </button>
        </div>
      </Card>

      <SearchBar value={search} onChange={setSearch} placeholder="Caută invitat..." />

      <div style={{ marginTop: 10 }}>
        {Object.keys(grouped).length === 0 && <Card style={{ textAlign: "center", color: "var(--mt)" }}>Niciun invitat.</Card>}
        {Object.entries(grouped).map(([grp, arr]) => (
          <div key={grp} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Badge c="gold">{grp}</Badge><span style={{ fontSize: 10, color: "var(--mt)" }}>{arr.length} invitați · {sumGuests(arr)} pers.</span>
            </div>
            {arr.map(g => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "var(--cd)", borderRadius: "var(--rs)", border: "1px solid var(--bd)", marginBottom: 5 }}>
                <button onClick={() => cycleRsvp(g)} title="Apasă pentru a schimba statusul" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: g.rsvp === "confirmed" ? "var(--ok)" : g.rsvp === "declined" ? "var(--er)" : "var(--cr2)", color: g.rsvp === "pending" ? "var(--mt)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, border: g.rsvp === "pending" ? "2px dashed var(--ft)" : "none", transition: "all .2s" }}>
                    {g.rsvp === "confirmed" ? "✓" : g.rsvp === "declined" ? "✕" : "?"}
                  </div>
                  <span style={{ fontSize: 8, fontWeight: 600, color: g.rsvp === "confirmed" ? "var(--ok)" : g.rsvp === "declined" ? "var(--er)" : "var(--mt)", textTransform: "uppercase", letterSpacing: ".04em", lineHeight: 1 }}>
                    {g.rsvp === "confirmed" ? "Da" : g.rsvp === "declined" ? "Nu" : "Apasă"}
                  </span>
                </button>
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => { setEditing(g); setShowForm(true); }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gTypeIcon(g)} {g.name}</div>
                  <div style={{ display: "flex", gap: 3, marginTop: 1, flexWrap: "wrap" }}><Badge c="gold">{gCount(g)}p · {gTypeLabel(g)}</Badge>{g.dietary && <Badge c="rose">{g.dietary}</Badge>}{g.tid && <Badge c="green">Așezat</Badge>}{g.notes && <span style={{ fontSize: 10, color: "var(--mt)" }} title={g.notes}>📝</span>}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDel(g.id); }} style={{ padding: 4, color: "var(--ft)" }}>{ic.trash}</button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => dispatch({ type: "DEL_GUEST", p: confirmDel })} title="Șterge invitatul?" message="Invitatul va fi eliminat din listă și de la masă. Acțiunea nu poate fi anulată." />


      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? "Editare" : "Invitat nou"}>
        {showForm && <GuestFormInner guest={editing} onClose={() => { setShowForm(false); setEditing(null); }} guestGroups={guestGroups} />}
      </Modal>

      <ManageGuestGroupsModal
        open={showManageGroups}
        onClose={() => setShowManageGroups(false)}
        guestGroups={guestGroups}
        guests={state.guests}
        weddingId={weddingId}
        dispatch={dispatch}
        showToast={showToast}
      />
    </div>
  );
}

function GuestFormInner({ guest, onClose, guestGroups }) {
  const { dispatch } = useData();
  const [formData, setFormData] = useState(guest
    ? { ...guest, count: guest.count || 1, groupId: guest.groupId || guestGroups[0]?.id || null, group: guest.group || guestGroups[0]?.name || "Prieteni" }
    : { name: "", group: guestGroups[0]?.name || "Prieteni", groupId: guestGroups[0]?.id || null, rsvp: "pending", dietary: "", notes: "", count: 1 });
  const updater = k => v => setFormData(x => ({ ...x, [k]: v }));

  const changeGroup = (groupId) => {
    const selected = guestGroups.find(group => group.id === groupId);
    setFormData(x => ({ ...x, groupId, group: selected?.name || x.group }));
  };

  return <>
    <Fld label="Nume" value={formData.name} onChange={updater("name")} />
    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      <div style={{ flex: 1 }}>
        <Fld label="Grup" value={formData.groupId || ""} onChange={changeGroup} options={guestGroups.map(group => ({ value: group.id, label: group.name }))} />
      </div>
      <div style={{ width: 100 }}>
        <Fld label="Persoane" value={formData.count} onChange={v => updater("count")(Number(v) || 1)} options={[{ value: 1, label: "👤 1" }, { value: 2, label: "👫 2" }, { value: 3, label: "👨‍👩‍👧 3" }, { value: 4, label: "👨‍👩‍👧‍👦 4" }, { value: 5, label: "5" }, { value: 6, label: "6" }]} />
      </div>
    </div>
    <Fld label="RSVP" value={formData.rsvp} onChange={updater("rsvp")} options={[{ value: "pending", label: "Așteptare" }, { value: "confirmed", label: "Confirmat" }, { value: "declined", label: "Refuzat" }]} />
    <Fld label="Restricții alimentare" value={formData.dietary} onChange={updater("dietary")} placeholder="vegetarian, vegan..." />
    <Fld label="Note" value={formData.notes} onChange={updater("notes")} type="textarea" placeholder="Vine cu copil, necesită cazare..." />
    <Btn full onClick={() => { dispatch({ type: guest ? "UPD_GUEST" : "ADD_GUEST", p: { ...formData, id: guest?.id || mkid(), tid: formData.tid || null } }); onClose(); }} disabled={!formData.name}>{guest ? "Salvează" : "Adaugă"}</Btn>
  </>;
}

function ManageGuestGroupsModal({ open, onClose, guestGroups, guests, weddingId, dispatch, showToast }) {
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const customGroups = guestGroups.filter(group => !DEFAULT_GROUPS.includes(group.name) && group.name !== "Altele");
  const fallback = guestGroups.find(group => group.name === "Altele") || guestGroups.find(group => !customGroups.some(custom => custom.id === group.id));

  const addGroup = async () => {
    const name = newName.trim();
    if (!name || !weddingId) return;
    if (guestGroups.some(group => group.name.toLowerCase() === name.toLowerCase())) {
      showToast?.("Categoria există deja.", "warning");
      return;
    }
    setSaving(true);
    try {
      const created = await dbSync.addGuestGroup(weddingId, { name, sortOrder: guestGroups.length + 1 });
      if (created) dispatch({ type: "SET", p: { guestGroups: [...guestGroups, created] } });
      setNewName("");
    } finally {
      setSaving(false);
    }
  };

  const renameGroup = async (groupId, name) => {
    const next = name.trim();
    if (!next) return;
    await dbSync.updateGuestGroup(groupId, { name: next });
    dispatch({ type: "SET", p: { guestGroups: guestGroups.map(group => group.id === groupId ? { ...group, name: next } : group), guests: guests.map(guest => guest.groupId === groupId ? { ...guest, group: next } : guest) } });
  };

  const deleteGroup = async (groupId) => {
    if (!weddingId || !fallback || fallback.id === groupId) return;
    await dbSync.reassignGuestsGroup(weddingId, groupId, fallback.id, fallback.name);
    await dbSync.deleteGuestGroup(groupId);
    dispatch({
      type: "SET",
      p: {
        guestGroups: guestGroups.filter(group => group.id !== groupId),
        guests: guests.map(guest => guest.groupId === groupId ? { ...guest, groupId: fallback.id, group: fallback.name } : guest),
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Categorii invitați">
      <div style={{ fontSize: 12, color: "var(--mt)", marginBottom: 10 }}>Adaugă categorii noi și gestionează doar categoriile personalizate.</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nume categorie nouă" style={{ flex: 1, padding: "10px 12px", borderRadius: "var(--rs)", border: "1px solid var(--bd)", background: "var(--cd)", fontSize: 13 }} />
        <Btn onClick={addGroup} disabled={saving || !newName.trim()}>Adaugă</Btn>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {guestGroups.map(group => {
          const isCustom = customGroups.some(custom => custom.id === group.id);
          return (
            <div key={group.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid var(--bd)", borderRadius: "var(--rs)" }}>
              <input
                defaultValue={group.name}
                disabled={!isCustom}
                onBlur={e => isCustom && e.target.value !== group.name && renameGroup(group.id, e.target.value)}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--bd)", background: isCustom ? "var(--cd)" : "var(--cr)", fontSize: 12 }}
              />
              {!isCustom && <Badge c="gray">Implicit</Badge>}
              {isCustom && <button onClick={() => deleteGroup(group.id)} style={{ fontSize: 11, color: "var(--er)", padding: "6px 8px" }}>Șterge</button>}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}



export default Guests;
