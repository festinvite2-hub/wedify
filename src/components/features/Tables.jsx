import { useCallback, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { mkid, gCount, sumGuests, generateTablesPDF, openPDF } from "../lib/utils";
import { dbSync } from "../lib/db-sync";
import { ic } from "../lib/icons";
import { Btn } from "../ui/Btn";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Fld } from "../ui/Fld";
import { Badge } from "../ui/Badge";
import { SearchBar } from "../ui/SearchBar";

function SeatedGuestRow({ g, table, isMoving, setMovingGuest, moveGuest, unseat, gAt, allTables }) {
  const [showInfo, setShowInfo] = useState(false);
  const hasInfo = g.dietary || (g.tags||[]).length > 0 || g.notes;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 14, fontSize: 12, fontWeight: 500, background: isMoving ? "rgba(184,149,106,.08)" : "var(--cr)", border: `1px solid ${isMoving ? "var(--g)" : "var(--bd)"}` }}>
        <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
          {g.name}{gCount(g)>1&&<span style={{fontSize:8,padding:"1px 4px",borderRadius:6,background:"rgba(184,149,106,.12)",color:"var(--gd)",fontWeight:700}}>×{gCount(g)}</span>}
          {g.dietary && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--er)", flexShrink: 0 }} title={g.dietary} />}
          {(g.tags||[]).includes("Copil") && <span style={{ fontSize: 10 }} title="Vine cu copil">👶</span>}
          {(g.tags||[]).includes("Vegetarian") && <span style={{ fontSize: 10 }} title="Vegetarian">🌱</span>}
        </span>
        {hasInfo && <button onClick={() => setShowInfo(!showInfo)} style={{ padding: "2px 6px", borderRadius: 6, fontSize: 9, fontWeight: 700, color: showInfo ? "var(--g)" : "var(--mt)", background: showInfo ? "rgba(184,149,106,.1)" : "transparent" }}>ℹ</button>}
        <button onClick={() => setMovingGuest(isMoving ? null : { gid: g.id, fromTid: table.id })} style={{ padding: "1px 4px", color: isMoving ? "var(--g)" : "var(--mt)", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>↗</button>
        <button onClick={() => unseat(g.id)} style={{ padding: 1, color: "var(--mt)", display: "flex" }}>{ic.x}</button>
      </div>
      {showInfo && <div style={{ padding: "6px 12px", marginTop: 2, marginBottom: 2, borderRadius: 8, background: "rgba(184,149,106,.04)", border: "1px solid var(--bd)", fontSize: 11 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {g.dietary && <Badge c="rose">{g.dietary}</Badge>}
          {(g.tags||[]).map(t => <Badge key={t} c="blue">{t}</Badge>)}
          {g.rsvp === "confirmed" && <Badge c="green">Confirmat</Badge>}
        </div>
        {g.notes && <div style={{ marginTop: 4, color: "var(--mt)", fontStyle: "italic" }}>📝 {g.notes}</div>}
      </div>}
      {isMoving && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 4px", marginTop: 2 }}>
          <span style={{ fontSize: 10, color: "var(--mt)", alignSelf: "center", marginRight: 2 }}>Mută la:</span>
          {allTables.filter(t => t.id !== table.id).map(t => {
            const cnt = gAt(t.id).reduce((a, g) => a + gCount(g), 0);
            const full = cnt >= t.seats;
            return (
              <button key={t.id} disabled={full} onClick={() => moveGuest(g.id, t.id)} style={{
                padding: "4px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                background: full ? "var(--cr2)" : "rgba(184,149,106,.08)", border: `1px solid ${full ? "var(--bd)" : "var(--gl)"}`,
                color: full ? "var(--ft)" : "var(--gd)", opacity: full ? .5 : 1,
              }}>
                {t.name} <span style={{ fontSize: 9, color: "var(--mt)" }}>{cnt}/{t.seats}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🔥 TABLES — List cards, edit seats, FIXED add bug
// ═══════════════════════════════════════════════════════════════

function Tables() {
  const { state, dispatch } = useData();
  const [expanded, setExpanded] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [pickingFor, setPickingFor] = useState(null);
  const [searchG, setSearchG] = useState("");
  const [editingTable, setEditingTable] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [movingGuest, setMovingGuest] = useState(null); // {gid, fromTid}
  const [tableFilter, setTableFilter] = useState("all");
  const [tableSort, setTableSort] = useState("default");
  const [viewMode, setViewMode] = useState("list");
  const [dragTid, setDragTid] = useState(null);

  const unassigned = useMemo(() => state.guests.filter(g => !g.tid && g.rsvp === "confirmed"), [state.guests]);
  const gAt = useCallback(tid => state.guests.filter(g => g.tid === tid), [state.guests]);
  const totalSeats = state.tables.reduce((a, t) => a + t.seats, 0); // seats = person capacity
  const totalSeated = sumGuests(state.guests.filter(g => g.tid));

  const toggle = tid => setExpanded(e => ({ ...e, [tid]: !e[tid] }));
  const seat = (gid, tid) => dispatch({ type: "SEAT", p: { gid, tid } });
  const unseat = gid => dispatch({ type: "UNSEAT", p: gid });
  const moveGuest = (gid, newTid) => { dispatch({ type: "MOVE_SEAT", p: { gid, tid: newTid } }); setMovingGuest(null); };

  const avail = useMemo(() => {
    let l = unassigned;
    if (searchG) l = l.filter(g => g.name.toLowerCase().includes(searchG.toLowerCase()));
    return l;
  }, [unassigned, searchG]);

  const tableStats = useMemo(() => state.tables.map(t => {
    const seated = gAt(t.id);
    const seatedPersons = seated.reduce((a, g) => a + gCount(g), 0);
    const free = t.seats - seatedPersons;
    return { ...t, seated, seatedPersons, free, isFull: free <= 0 };
  }), [state.tables, gAt]);

  const displayedTables = useMemo(() => {
    let list = [...tableStats];
    if (tableFilter === "free") list = list.filter(t => t.free > 0);
    if (tableFilter === "full") list = list.filter(t => t.free <= 0);
    if (tableSort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "ro"));
    if (tableSort === "free_desc") list.sort((a, b) => b.free - a.free);
    if (tableSort === "free_asc") list.sort((a, b) => a.free - b.free);
    return list;
  }, [tableStats, tableFilter, tableSort]);

  const moveTableOrder = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    const arr = [...state.tables];
    const from = arr.findIndex(t => t.id === fromId);
    const to = arr.findIndex(t => t.id === toId);
    if (from < 0 || to < 0) return;
    const [it] = arr.splice(from, 1);
    arr.splice(to, 0, it);
    dispatch({ type: "REORDER_TABLES", p: arr });
  };

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      <Card style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Locuri ocupate</div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 500, color: "var(--g)" }}>{totalSeated}<span style={{ fontSize: 13, color: "var(--mt)", fontFamily: "var(--f)" }}> / {totalSeats}</span></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Nealocați</div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 500, color: unassigned.length > 0 ? "var(--wn)" : "var(--ok)" }}>{unassigned.length}</div>
        </div>
      </Card>

      <Card style={{ marginBottom: 12, padding: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "var(--mt)", fontWeight: 700 }}>Filtru</span>
          {[{k:"all",l:"Toate"},{k:"free",l:"Cu locuri libere"},{k:"full",l:"Complete"}].map(f => <button key={f.k} onClick={() => setTableFilter(f.k)} style={{ padding: "4px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: tableFilter===f.k ? "var(--gd)" : "var(--cr)", color: tableFilter===f.k ? "#fff" : "var(--gr)", border: `1px solid ${tableFilter===f.k ? "var(--gd)" : "var(--bd)"}` }}>{f.l}</button>)}
          <span style={{ fontSize: 10, color: "var(--mt)", fontWeight: 700, marginLeft: 6 }}>Sortare</span>
          <select value={tableSort} onChange={e => setTableSort(e.target.value)} style={{ padding: "5px 8px", borderRadius: 10, background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 10, color: "var(--gr)" }}>
            <option value="default">Implicit</option>
            <option value="name">Nume A-Z</option>
            <option value="free_desc">Locuri libere desc</option>
            <option value="free_asc">Locuri libere asc</option>
          </select>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            <button onClick={() => setViewMode("list")} style={{ padding: "4px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: viewMode === "list" ? "var(--ink)" : "var(--cr)", color: viewMode === "list" ? "var(--bg)" : "var(--mt)", border: `1px solid ${viewMode === "list" ? "var(--ink)" : "var(--bd)"}` }}>Listă</button>
            <button onClick={() => setViewMode("grid")} style={{ padding: "4px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: viewMode === "grid" ? "var(--ink)" : "var(--cr)", color: viewMode === "grid" ? "var(--bg)" : "var(--mt)", border: `1px solid ${viewMode === "grid" ? "var(--ink)" : "var(--bd)"}` }}>Grid</button>
          </div>
        </div>
      </Card>

      {viewMode === "grid" && <Card style={{ marginBottom: 12, padding: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Sumar vizual mese</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
          {displayedTables.map(t => <button key={t.id} onClick={() => { setExpanded(e => ({ ...e, [t.id]: true })); setViewMode("list"); }} style={{ textAlign: "left", padding: "8px", borderRadius: 10, border: "1px solid var(--bd)", background: t.free > 0 ? "var(--cr)" : "rgba(107,158,104,.08)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>{t.name}</div>
            <div style={{ fontSize: 10, color: "var(--mt)" }}>{t.seatedPersons}/{t.seats} pers · {t.free > 0 ? `${t.free} libere` : "Completă"}</div>
          </button>)}
        </div>
      </Card>}

      {/* Unassigned chips — just names, no instruction text */}
      {unassigned.length > 0 && <Card style={{ marginBottom: 12, padding: "10px 12px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gd)", marginBottom: 6 }}>Nealocați ({unassigned.length})</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {unassigned.slice(0, 30).map(g => (
            <span key={g.id} style={{ padding: "4px 9px", borderRadius: 12, fontSize: 11, fontWeight: 500, background: "var(--cr)", border: "1px solid var(--bd)", display: "inline-flex", alignItems: "center", gap: 3 }}>
              {g.name.split(" ")[0]}
              {g.dietary && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--er)" }} />}
            </span>
          ))}
          {unassigned.length > 30 && <span style={{ padding: "4px 9px", fontSize: 11, color: "var(--mt)" }}>+{unassigned.length - 30}</span>}
        </div>
      </Card>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>{state.tables.length} mese</span>
        <Btn variant="secondary" onClick={() => setShowAdd(true)} style={{ fontSize: 11, padding: "5px 12px" }}>{ic.plus} Masă nouă</Btn>
      </div>

      {(viewMode === "list" ? displayedTables : []).map(table => {
        const seated = gAt(table.id);
        const seatedPersons = seated.reduce((a, g) => a + gCount(g), 0);
        const free = table.seats - seatedPersons;
        const isFull = free <= 0;
        const isOpen = expanded[table.id];
        const isPicking = pickingFor === table.id;

        return (
          <Card key={table.id} draggable={tableSort === "default" && tableFilter === "all"} onDragStart={() => setDragTid(table.id)} onDragOver={e => { if (dragTid) e.preventDefault(); }} onDrop={() => { moveTableOrder(dragTid, table.id); setDragTid(null); }} onDragEnd={() => setDragTid(null)} style={{ marginBottom: 8, padding: 0, overflow: "hidden", opacity: dragTid && dragTid !== table.id ? .96 : 1 }}>
            <div onClick={() => toggle(table.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}>
              <div style={{ width: 36, height: 36, borderRadius: table.shape === "round" ? "50%" : 8, background: isFull ? "rgba(107,158,104,.1)" : "var(--cr)", border: `1.5px solid ${isFull ? "var(--ok)" : "var(--bd)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isFull ? "var(--ok)" : "var(--gd)" }}>{seated.length}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>{tableSort === "default" && tableFilter === "all" && <span style={{ color: "var(--ft)", fontSize: 12 }}>↕</span>}{table.name}</div>
                <div style={{ fontSize: 11, color: "var(--mt)" }}>
                  {table.shape === "round" ? "Rotundă" : "Dreptunghiulară"} · {table.seats} locuri · <span style={{ color: isFull ? "var(--ok)" : "var(--gd)", fontWeight: 600 }}>{free} libere</span>
                </div>
              </div>
              <span style={{ color: "var(--ft)", transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>{ic.chevD}</span>
            </div>

            {isOpen && <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--bd)" }}>
              {/* Table notes */}
              {table.notes && <div style={{ fontSize: 11, color: "var(--mt)", fontStyle: "italic", padding: "6px 0", borderBottom: "1px solid var(--bd)" }}>📝 {table.notes}</div>}
              {seated.length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 0" }}>
                {seated.map(g => {
                  const isMoving = movingGuest?.gid === g.id;
                  return (
                    <SeatedGuestRow key={g.id} g={g} table={table} isMoving={isMoving} setMovingGuest={setMovingGuest} moveGuest={moveGuest} unseat={unseat} gAt={gAt} allTables={state.tables} />
                  );
                })}
              </div> : <div style={{ padding: "10px 0", fontSize: 12, color: "var(--mt)", fontStyle: "italic" }}>Niciun invitat</div>}

              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {!isFull && <Btn variant="secondary" onClick={() => { setPickingFor(isPicking ? null : table.id); setSearchG("") }} style={{ fontSize: 11, padding: "7px 12px", flex: 1, border: isPicking ? "2px solid var(--g)" : "1px solid var(--bd)", background: isPicking ? "rgba(184,149,106,.06)" : "var(--cr)" }}>
                  {isPicking ? "Anulează" : "+ Adaugă invitați"}
                </Btn>}
                <Btn variant="ghost" onClick={() => setEditingTable(table)} style={{ fontSize: 11, padding: "7px 10px" }}>{ic.edit}</Btn>
                <Btn variant="danger" onClick={() => setConfirmDel(table.id)} style={{ fontSize: 11, padding: "7px 10px" }}>{ic.trash}</Btn>
              </div>

              {isPicking && <div style={{ marginTop: 10, padding: 10, borderRadius: "var(--rs)", background: "rgba(184,149,106,.04)", border: "1px solid var(--gl)" }}>
                <SearchBar value={searchG} onChange={setSearchG} placeholder="Caută invitat..." style={{ marginBottom: 8 }} />
                {avail.length === 0 ? <div style={{ fontSize: 11, color: "var(--mt)", textAlign: "center", padding: 8 }}>Toți invitații sunt așezați</div>
                  : <div style={{ maxHeight: 160, overflow: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
                    {avail.map(g => (
                      <button key={g.id} onClick={() => { seat(g.id, table.id); if (seatedPersons + gCount(g) >= table.seats) setPickingFor(null) }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, background: "var(--cd)", border: "1px solid var(--bd)", textAlign: "left" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--cr2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--gd)", flexShrink: 0 }}>{g.name[0]}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{g.name}</div><div style={{ fontSize: 10, color: "var(--mt)" }}>{g.group}{g.dietary ? ` · ${g.dietary}` : ""}</div></div>
                        <span style={{ color: "var(--g)", fontSize: 11, fontWeight: 600 }}>+ Adaugă</span>
                      </button>
                    ))}
                  </div>}
              </div>}
            </div>}
          </Card>
        );
      })}

      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => { dispatch({ type: "DEL_TABLE", p: confirmDel }); setExpanded(e => { const n = { ...e }; delete n[confirmDel]; return n }); }} title="Șterge masa?" message="Toți invitații de la această masă vor deveni nealocați." />

      {/* Add table modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Masă nouă">
        <AddTableForm onClose={() => setShowAdd(false)} />
      </Modal>

      {/* Edit table modal */}
      <Modal open={!!editingTable} onClose={() => setEditingTable(null)} title="Editare masă">
        {editingTable && <EditTableForm table={editingTable} onClose={() => setEditingTable(null)} />}
      </Modal>
    </div>
  );
}

function AddTableForm({ onClose }) {
  const { state, dispatch } = useData();
  const [name, setName] = useState("Masa " + (state.tables.length + 1));
  const [shape, setShape] = useState("round");
  const [seats, setSeats] = useState(8);

  const handleAdd = () => {
    if (!name.trim()) return;
    dispatch({ type: "ADD_TABLE", p: { id: mkid(), name: name.trim(), shape, seats: Number(seats) || 8 } });
    onClose();
  };

  return <>
    <Fld label="Nume" value={name} onChange={setName} placeholder="Masa 5" />
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5 }}>Formă</label>
      <div style={{ display: "flex", gap: 8 }}>
        {[{ v: "round", l: "Rotundă", i: "●" }, { v: "rectangular", l: "Dreptunghi", i: "▬" }].map(sh => (
          <button key={sh.v} onClick={() => setShape(sh.v)} style={{ flex: 1, padding: "12px 8px", borderRadius: "var(--rs)", textAlign: "center", border: `2px solid ${shape === sh.v ? "var(--g)" : "var(--bd)"}`, background: shape === sh.v ? "rgba(184,149,106,.05)" : "var(--cr)" }}>
            <div style={{ fontSize: 20, opacity: .4, marginBottom: 3 }}>{sh.i}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: shape === sh.v ? "var(--gd)" : "var(--mt)" }}>{sh.l}</div>
          </button>
        ))}
      </div>
    </div>
    <Fld label="Număr locuri" value={seats} onChange={v => setSeats(v)} type="number" />
    <Btn fullWidth onClick={handleAdd} disabled={!name.trim()}>Adaugă masa</Btn>
  </>;
}

function EditTableForm({ table, onClose }) {
  const { dispatch } = useData();
  const [name, setName] = useState(table.name);
  const [shape, setShape] = useState(table.shape);
  const [seats, setSeats] = useState(table.seats);
  const [notes, setNotes] = useState(table.notes || "");

  return <>
    <Fld label="Nume" value={name} onChange={setName} />
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5 }}>Formă</label>
      <div style={{ display: "flex", gap: 8 }}>
        {[{ v: "round", l: "Rotundă", i: "●" }, { v: "rectangular", l: "Dreptunghi", i: "▬" }].map(sh => (
          <button key={sh.v} onClick={() => setShape(sh.v)} style={{ flex: 1, padding: "12px 8px", borderRadius: "var(--rs)", textAlign: "center", border: `2px solid ${shape === sh.v ? "var(--g)" : "var(--bd)"}`, background: shape === sh.v ? "rgba(184,149,106,.05)" : "var(--cr)" }}>
            <div style={{ fontSize: 20, opacity: .4, marginBottom: 3 }}>{sh.i}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: shape === sh.v ? "var(--gd)" : "var(--mt)" }}>{sh.l}</div>
          </button>
        ))}
      </div>
    </div>
    <Fld label="Număr locuri" value={seats} onChange={v => setSeats(v)} type="number" />
    <Fld label="Note" value={notes} onChange={setNotes} type="textarea" placeholder="Lângă ringul de dans, masă rotundă mare..." />
    <Btn fullWidth onClick={() => { dispatch({ type: "UPD_TABLE", p: { id: table.id, name, shape, seats: Number(seats) || 8, notes } }); onClose() }} disabled={!name}>Salvează</Btn>
  </>;
}

export default Tables;
