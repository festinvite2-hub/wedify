import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { mkid, fmtD } from "../lib/utils";
import { dbSync } from "../lib/db-sync";
import { ic } from "../lib/icons";
import { Btn } from "../ui/Btn";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Fld } from "../ui/Fld";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";

function Tasks() {
  const { state, dispatch } = useData();
  const [filter, setFilter] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const list = useMemo(() => { let l = [...state.tasks].sort((a, b) => new Date(a.due) - new Date(b.due)); if (filter === "active") l = l.filter(t => t.status !== "done"); if (filter === "done") l = l.filter(t => t.status === "done"); if (filter === "urgent") l = l.filter(t => t.prio === "high" && t.status !== "done"); return l }, [state.tasks, filter]);
  const done = state.tasks.filter(t => t.status === "done").length;
  const pct = Math.round((done / Math.max(state.tasks.length, 1)) * 100);
  const overdue = state.tasks.filter(t => new Date(t.due) < new Date() && t.status !== "done").length;

  const wDate = new Date(state.wedding.date);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((wDate - now) / 864e5));

  const dueLabel = (due) => {
    if (!due) return "Fără termen";
    const d = new Date(due);
    const diff = Math.ceil((d - now) / 864e5);
    if (diff < 0) return `Depășit cu ${Math.abs(diff)} zile`;
    if (diff === 0) return "Astăzi!";
    if (diff === 1) return "Mâine";
    if (diff <= 7) return `Până în ${diff} zile`;
    if (diff <= 30) return `Până la ${fmtD(due)}`;
    return `Până la ${fmtD(due)}`;
  };

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      {/* Progress + Stats */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Progres total</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: "var(--fd)", fontSize: 28, fontWeight: 500, color: "var(--g)" }}>{pct}%</span>
              <span style={{ fontSize: 11, color: "var(--mt)" }}>{done}/{state.tasks.length} gata</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--gd)" }}>{daysLeft}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>zile rămase</div>
          </div>
        </div>
        <div style={{ height: 8, background: "var(--cr2)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: "linear-gradient(90deg,var(--g),var(--ok))", transition: "width .6s" }} />
        </div>
        {overdue > 0 && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "6px 10px", borderRadius: 8, background: "rgba(184,92,92,.06)" }}>
          <span style={{ fontSize: 11 }}>⚠</span>
          <span style={{ fontSize: 11, color: "var(--er)", fontWeight: 600 }}>{overdue} task-uri depășite</span>
        </div>}
      </Card>

      {/* Filters + Add */}
      <div style={{ display: "flex", gap: 5, marginBottom: 10, alignItems: "center" }}>
        {[{ k: "active", l: "Active", cnt: state.tasks.filter(t => t.status !== "done").length }, { k: "urgent", l: "Urgente", cnt: state.tasks.filter(t => t.prio === "high" && t.status !== "done").length }, { k: "done", l: "Finalizate", cnt: done }].map(f =>
          <button key={f.k} onClick={() => setFilter(f.k)} style={{ padding: "5px 11px", borderRadius: 14, fontSize: 10, fontWeight: 600, background: filter === f.k ? "var(--g)" : "var(--cr)", color: filter === f.k ? "#fff" : "var(--mt)", border: `1px solid ${filter === f.k ? "var(--g)" : "var(--bd)"}` }}>
            {f.l} <span style={{ opacity: .7 }}>{f.cnt}</span>
          </button>
        )}
        <button onClick={() => { setEditing(null); setShowForm(true) }} style={{ marginLeft: "auto", width: 32, height: 32, borderRadius: "50%", background: "var(--g)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic.plus}</button>
      </div>

      {/* Task list */}
      {list.length === 0 && <EmptyState icon={filter === "done" ? "📋" : "🎉"} title={filter === "done" ? "Nicio sarcină" : "Excelent!"} subtitle={filter === "done" ? "Niciun task finalizat încă" : "Totul e la zi!"} />}

      {list.map((t) => {
        const over = new Date(t.due) < new Date() && t.status !== "done";
        const dn = t.status === "done";
        return (
          <Card key={t.id} style={{ marginBottom: 6, padding: 0, overflow: "hidden", opacity: dn ? .5 : 1 }}>
            <div style={{ display: "flex", alignItems: "stretch" }}>
              {/* Checkbox area */}
              <button onClick={() => dispatch({ type: "UPD_TASK", p: { id: t.id, status: dn ? "pending" : "done" } })} style={{ width: 48, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: dn ? "rgba(107,158,104,.08)" : over ? "rgba(184,92,92,.04)" : "transparent", borderRight: "1px solid var(--bd)" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${dn ? "var(--ok)" : over ? "var(--er)" : "var(--ft)"}`, background: dn ? "var(--ok)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
                  {dn && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
              </button>
              {/* Content */}
              <div onClick={() => { setEditing(t); setShowForm(true) }} style={{ flex: 1, padding: "10px 12px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, textDecoration: dn ? "line-through" : "none", flex: 1, color: "var(--ink)" }}>{t.title}</span>
                  {t.prio === "high" && !dn && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--er)", flexShrink: 0 }} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: over ? "var(--er)" : "var(--mt)", fontWeight: over ? 600 : 400 }}>
                    {dn ? "Finalizat ✓" : dueLabel(t.due)}
                  </span>
                  {t.cat && <Badge c="gold">{t.cat}</Badge>}
                  {t.prio === "high" && !dn && <Badge c="red">Urgent</Badge>}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare task" : "Task nou"}>
        {showForm && <TaskFormInner task={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
      </Modal>
    </div>
  );
}

function TaskFormInner({ task, onClose }) {
  const { dispatch } = useData(); const [formData, setFormData] = useState(task ? { ...task } : { title: "", due: "", status: "pending", prio: "medium", cat: "" }); const [showConfirm, setShowConfirm] = useState(false); const updater = k => v => setFormData(x => ({ ...x, [k]: v }));
  return <>
    <Fld label="Titlu" value={formData.title} onChange={updater("title")} placeholder="Ce trebuie făcut?" />
    <Fld label="Până la data" value={formData.due} onChange={updater("due")} type="date" />
    <Fld label="Categorie" value={formData.cat} onChange={updater("cat")} placeholder="Catering, Rochie, General..." />
    <Fld label="Prioritate" value={formData.prio} onChange={updater("prio")} options={[{ value: "low", label: "Scăzută" }, { value: "medium", label: "Medie" }, { value: "high", label: "Urgentă" }]} />
    <div style={{ display: "flex", gap: 8 }}>
      <Btn fullWidth onClick={() => { dispatch({ type: task ? "UPD_TASK" : "ADD_TASK", p: { ...formData, id: task?.id || mkid() } }); onClose() }} disabled={!formData.title}>Salvează</Btn>
      {task && <Btn variant="danger" onClick={() => setShowConfirm(true)}>{ic.trash}</Btn>}
    </div>
    <ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={() => { dispatch({ type: "DEL_TASK", p: task.id }); onClose() }} title="Șterge task-ul?" message={`"${task?.title}" va fi eliminat.`} />
  </>;
}

export default Tasks;
