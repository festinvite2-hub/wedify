import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { generateGuestsPDF, generateProgramPDF, generateTablesPDF, mkid, openPDF } from "../lib/utils";
import { Card } from "../ui/Card";
import { Btn } from "../ui/Btn";
import { Modal } from "../ui/Modal";
import { Fld } from "../ui/Fld";
import { Badge } from "../ui/Badge";

const CATEGORY_META = {
  "pregătiri": { icon: "💄", label: "Pregătiri", color: "rose" },
  ceremonie: { icon: "⛪", label: "Ceremonie", color: "gold" },
  foto: { icon: "📸", label: "Foto", color: "blue" },
  transport: { icon: "🚗", label: "Transport", color: "gray" },
  petrecere: { icon: "🎉", label: "Petrecere", color: "green" },
  altele: { icon: "📌", label: "Altele", color: "pending" },
};

const emptyProgramMoment = () => ({
  id: mkid(),
  time: "",
  endTime: "",
  title: "",
  location: "",
  contact: "",
  phone: "",
  notes: "",
  category: "altele",
  checklist: [],
});

function sortProgram(program = []) {
  return [...program].sort((a, b) => `${a.time || "99:99"}`.localeCompare(`${b.time || "99:99"}`));
}

function Tools() {
  const { state, dispatch } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingMoment, setEditingMoment] = useState(null);
  const [formData, setFormData] = useState(emptyProgramMoment());

  const weddingDate = state.wedding?.date;
  const program = state.wedding?.program || [];

  const sortedProgram = useMemo(() => sortProgram(program), [program]);

  const weddingCountdown = useMemo(() => {
    if (!weddingDate) return "Adaugă data nunții pentru countdown";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(weddingDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (Number.isNaN(diff)) return "Data nunții nu este validă";
    if (diff > 0) return `${diff} zile rămase`;
    if (diff === 0) return "Astăzi este ziua nunții!";
    return `Au trecut ${Math.abs(diff)} zile`;
  }, [weddingDate]);

  const dayContacts = useMemo(() => {
    const byName = new Map();

    state.vendors
      .filter((vendor) => vendor.status === "contracted")
      .forEach((vendor) => {
        const name = (vendor.name || "").trim();
        if (!name) return;
        const key = name.toLowerCase();
        if (byName.has(key)) return;
        byName.set(key, {
          id: vendor.id || mkid(),
          name,
          category: vendor.cat || "Altele",
          phone: vendor.phone || "",
          email: vendor.email || "",
          source: "vendors",
        });
      });

    state.budget
      .filter((item) => item.vendor && `${item.vendor}`.trim())
      .forEach((item) => {
        const name = `${item.vendor}`.trim();
        const key = name.toLowerCase();
        if (byName.has(key)) return;
        byName.set(key, {
          id: item.id || mkid(),
          name,
          category: item.cat || "Buget",
          phone: "",
          email: "",
          source: "budget",
        });
      });

    return [...byName.values()];
  }, [state.vendors, state.budget]);

  const saveProgram = (updatedProgram) => {
    dispatch({ type: "SET", p: { wedding: { ...state.wedding, program: updatedProgram } } });
  };

  const openAddMoment = () => {
    setEditingMoment(null);
    setFormData(emptyProgramMoment());
    setShowForm(true);
  };

  const openEditMoment = (moment) => {
    setEditingMoment(moment);
    setFormData({ ...moment, checklist: [...(moment.checklist || [])] });
    setShowForm(true);
  };

  const removeMoment = (id) => {
    if (!window.confirm("Sigur vrei să ștergi acest moment din program?")) return;
    saveProgram(program.filter((moment) => moment.id !== id));
  };

  const toggleChecklist = (momentId, itemId) => {
    const updated = program.map((moment) => {
      if (moment.id !== momentId) return moment;
      return {
        ...moment,
        checklist: (moment.checklist || []).map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
      };
    });
    saveProgram(updated);
  };

  const saveMoment = () => {
    if (!formData.time || !formData.title) return;
    const payload = {
      ...formData,
      title: formData.title.trim(),
      location: (formData.location || "").trim(),
      contact: (formData.contact || "").trim(),
      phone: (formData.phone || "").trim(),
      notes: (formData.notes || "").trim(),
      checklist: (formData.checklist || []).filter((item) => item.text.trim()).map((item) => ({ ...item, text: item.text.trim() })),
    };

    if (editingMoment) {
      saveProgram(program.map((moment) => (moment.id === editingMoment.id ? payload : moment)));
    } else {
      saveProgram([...program, payload]);
    }
    setShowForm(false);
    setEditingMoment(null);
  };

  const generateDefaultProgram = () => {
    const defaults = [
      ["10:00", "Pregătiri mireasă", "pregătiri"],
      ["11:00", "Pregătiri mire", "pregătiri"],
      ["13:00", "Ședință foto", "foto"],
      ["15:00", "Ceremonia religioasă", "ceremonie"],
      ["16:00", "Ceremonia civilă", "ceremonie"],
      ["17:00", "Transport la restaurant", "transport"],
      ["17:30", "Cocktail & aperitive", "petrecere"],
      ["19:00", "Intrarea mirilor", "petrecere"],
      ["19:30", "Cina", "petrecere"],
      ["21:00", "Primul dans", "petrecere"],
      ["21:30", "Tortul", "petrecere"],
      ["22:00", "Petrecere & dans", "petrecere"],
      ["01:00", "Sfârșitul petrecerii", "petrecere"],
    ];
    saveProgram(defaults.map(([time, title, category]) => ({ ...emptyProgramMoment(), time, title, category })));
  };

  return (
    <div className="fu" style={{ padding: "0 14px 20px", maxWidth: 460, margin: "0 auto" }}>
      <Card style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Export</div>
        <div style={{ fontSize: 12, color: "var(--gr)", marginBottom: 10 }}>Descarcă rapid listele pentru invitați și planul de mese.</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" onClick={() => openPDF(generateGuestsPDF(state.guests, state.wedding, state.tables))} style={{ flex: 1, fontSize: 11, padding: "9px 12px" }}>📄 Lista invitați</Btn>
          <Btn variant="secondary" onClick={() => openPDF(generateTablesPDF(state.tables, state.guests, state.wedding))} style={{ flex: 1, fontSize: 11, padding: "9px 12px" }}>📄 Plan mese</Btn>
        </div>
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Planificator Ziua Nunții</div>
            <div style={{ fontSize: 12, color: "var(--gr)", marginTop: 4 }}>
              {(state.wedding?.date ? new Date(state.wedding.date).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" }) : "Fără dată setată")} · {weddingCountdown}
            </div>
          </div>
          <Btn size="sm" onClick={openAddMoment}>+ Adaugă moment</Btn>
        </div>

        {sortedProgram.length === 0 ? (
          <div style={{ border: "1px dashed var(--bd)", borderRadius: 10, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>🗓️</div>
            <div style={{ fontSize: 12, color: "var(--gr)", marginBottom: 10 }}>Programul este gol. Poți începe cu un template implicit.</div>
            <Btn variant="secondary" size="sm" onClick={generateDefaultProgram}>Generează program implicit</Btn>
          </div>
        ) : (
          <>
            <div style={{ borderLeft: "2px solid var(--bd)", marginLeft: 12, paddingLeft: 12 }}>
              {sortedProgram.map((moment) => {
                const meta = CATEGORY_META[moment.category] || CATEGORY_META.altele;
                return (
                  <div key={moment.id} style={{ position: "relative", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--bd)" }}>
                    <div style={{ position: "absolute", left: -19, top: 7, width: 10, height: 10, borderRadius: 999, background: "var(--g)" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ fontSize: 24, lineHeight: 1, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--fd)" }}>{moment.time}{moment.endTime ? ` - ${moment.endTime}` : ""}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn variant="secondary" size="sm" onClick={() => openEditMoment(moment)} style={{ padding: "5px 9px", fontSize: 10 }}>Editează</Btn>
                        <Btn variant="danger" size="sm" onClick={() => removeMoment(moment.id)} style={{ padding: "5px 9px", fontSize: 10 }}>Șterge</Btn>
                      </div>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700 }}>{moment.title}</div>
                    <div style={{ marginTop: 5 }}><Badge c={meta.color}>{meta.icon} {meta.label}</Badge></div>
                    {!!moment.location && <div style={{ fontSize: 12, color: "var(--gr)", marginTop: 6 }}>📍 {moment.location}</div>}
                    {!!moment.contact && <div style={{ fontSize: 12, color: "var(--gr)", marginTop: 4 }}>👤 {moment.contact} {moment.phone ? <>· <a href={`tel:${moment.phone}`} style={{ color: "var(--gd)", fontWeight: 700 }}>{moment.phone}</a></> : null}</div>}
                    {!!moment.notes && <div style={{ marginTop: 7, fontSize: 11, color: "var(--gr)", background: "var(--cr)", borderRadius: 8, padding: "7px 9px" }}>📝 {moment.notes}</div>}
                    {moment.checklist?.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                        {moment.checklist.map((item) => (
                          <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                            <input type="checkbox" checked={!!item.done} onChange={() => toggleChecklist(moment.id, item.id)} />
                            <span style={{ textDecoration: item.done ? "line-through" : "none", color: item.done ? "var(--mt)" : "var(--ink)" }}>{item.text}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Btn variant="secondary" fullWidth style={{ marginTop: 6 }} onClick={() => openPDF(generateProgramPDF(state.wedding, sortedProgram, dayContacts))}>📄 Exportă programul</Btn>
          </>
        )}
      </Card>

      <Card>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 10 }}>Contacte Ziua Nunții</div>
        {dayContacts.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--gr)", textAlign: "center", padding: "8px 0" }}>Nu există contacte contractate încă.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {dayContacts.map((contact) => (
              <div key={contact.id} style={{ border: "1px solid var(--bd)", borderRadius: 10, padding: 10, background: "var(--cr)" }}>
                <div style={{ fontSize: 10, color: "var(--mt)", marginBottom: 4 }}>{contact.category}</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5, color: "var(--ink)" }}>📞 {contact.name}</div>
                {contact.phone ? <a href={`tel:${contact.phone}`} style={{ display: "block", fontSize: 14, color: "var(--gd)", fontWeight: 800 }}>{contact.phone}</a> : <div style={{ fontSize: 11, color: "var(--mt)" }}>Telefon necompletat</div>}
                {contact.email ? <a href={`mailto:${contact.email}`} style={{ display: "block", marginTop: 4, fontSize: 11, color: "var(--gr)", wordBreak: "break-word" }}>{contact.email}</a> : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingMoment(null); }}
        title={editingMoment ? "Editează moment" : "Adaugă moment"}
        footer={<div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" fullWidth onClick={() => { setShowForm(false); setEditingMoment(null); }}>Renunță</Btn>
          <Btn fullWidth onClick={saveMoment} disabled={!formData.time || !formData.title.trim()}>Salvează</Btn>
        </div>}
      >
        <div>
          <Fld label="Ora" type="time" value={formData.time} onChange={(v) => setFormData((x) => ({ ...x, time: v }))} required />
          <Fld label="Ora final" type="time" value={formData.endTime} onChange={(v) => setFormData((x) => ({ ...x, endTime: v }))} />
          <Fld label="Titlu" value={formData.title} onChange={(v) => setFormData((x) => ({ ...x, title: v }))} required placeholder="Ceremonia religioasă" />
          <Fld label="Categorie" value={formData.category} onChange={(v) => setFormData((x) => ({ ...x, category: v }))} options={[
            { value: "pregătiri", label: "💄 Pregătiri" },
            { value: "ceremonie", label: "⛪ Ceremonie" },
            { value: "foto", label: "📸 Foto" },
            { value: "transport", label: "🚗 Transport" },
            { value: "petrecere", label: "🎉 Petrecere" },
            { value: "altele", label: "📌 Altele" },
          ]} />
          <Fld label="Locație" value={formData.location} onChange={(v) => setFormData((x) => ({ ...x, location: v }))} />
          <Fld label="Persoană responsabilă" value={formData.contact} onChange={(v) => setFormData((x) => ({ ...x, contact: v }))} />
          <Fld label="Telefon" value={formData.phone} onChange={(v) => setFormData((x) => ({ ...x, phone: v }))} placeholder="+40..." />
          <Fld label="Note" type="textarea" value={formData.notes} onChange={(v) => setFormData((x) => ({ ...x, notes: v }))} placeholder="Detalii utile pentru acest interval" />

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Checklist</div>
            {(formData.checklist || []).map((item, idx) => (
              <div key={item.id} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input
                  value={item.text}
                  onChange={(e) => setFormData((x) => ({
                    ...x,
                    checklist: (x.checklist || []).map((entry) => (entry.id === item.id ? { ...entry, text: e.target.value } : entry)),
                  }))}
                  placeholder={`Sub-task ${idx + 1}`}
                  style={{ flex: 1, border: "1px solid var(--bd)", borderRadius: 8, padding: "8px 10px", fontSize: 12, background: "var(--cr)" }}
                />
                <Btn variant="danger" size="sm" onClick={() => setFormData((x) => ({ ...x, checklist: (x.checklist || []).filter((entry) => entry.id !== item.id) }))}>Șterge</Btn>
              </div>
            ))}
            <Btn variant="secondary" size="sm" onClick={() => setFormData((x) => ({ ...x, checklist: [...(x.checklist || []), { id: mkid(), text: "", done: false }] }))}>+ Adaugă sub-task</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Tools;
