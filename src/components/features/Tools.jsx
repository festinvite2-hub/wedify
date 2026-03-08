import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { generateGuestsPDF, generateProgramPDF, generateTablesPDF, mkid, openPDF, sumGuests } from "../lib/utils";
import { ic } from "../lib/icons";
import { Card } from "../ui/Card";
import { Btn } from "../ui/Btn";
import { Modal } from "../ui/Modal";
import { Fld } from "../ui/Fld";
import { Badge } from "../ui/Badge";

const catConfig = {
  "pregătiri": { icon: "💄", color: "#A088B8", label: "Pregătiri", badge: "rose" },
  ceremonie: { icon: "⛪", color: "#B8956A", label: "Ceremonie", badge: "gold" },
  foto: { icon: "📸", color: "#5A82B4", label: "Foto", badge: "blue" },
  transport: { icon: "🚗", color: "#9A9A9A", label: "Transport", badge: "gray" },
  petrecere: { icon: "🎉", color: "#6B9E68", label: "Petrecere", badge: "green" },
  altele: { icon: "📌", color: "#B8956A", label: "Altele", badge: "pending" },
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

const sortTime = (t = "") => {
  const [h, m] = `${t}`.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 9999;
  return h < 6 ? (h + 24) * 60 + m : h * 60 + m;
};

function Tools() {
  const { state, dispatch } = useData();
  const [view, setView] = useState("menu");
  const [showForm, setShowForm] = useState(false);
  const [editingMoment, setEditingMoment] = useState(null);
  const [formData, setFormData] = useState(emptyProgramMoment());

  const weddingDate = state.wedding?.date;
  const program = state.wedding?.program || [];

  const sortedProgram = useMemo(() => [...program].sort((a, b) => sortTime(a.time) - sortTime(b.time)), [program]);

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

  const exportStats = useMemo(() => {
    const confirmed = state.guests.filter((guest) => guest.rsvp === "confirmed");
    const seated = state.guests.filter((guest) => guest.tid);
    const tableSeats = state.tables.reduce((acc, table) => acc + (Number(table.seats) || 0), 0);
    return {
      guests: state.guests.length,
      guestPeople: sumGuests(state.guests),
      confirmedPeople: sumGuests(confirmed),
      tables: state.tables.length,
      seats: tableSeats,
      seatedPeople: sumGuests(seated),
    };
  }, [state.guests, state.tables]);

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
    if (!formData.time || !formData.title.trim()) return;
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

  const renderSubHeader = (title) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "0 14px" }}>
      <button
        onClick={() => setView("menu")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 13,
          color: "var(--gd)",
          fontWeight: 600,
          padding: "10px 12px",
          minHeight: 44,
          borderRadius: "var(--rs)",
          border: "1px solid var(--bd)",
          background: "var(--cd)",
        }}
      >
        ← Înapoi
      </button>
      <h2 style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 500, flex: 1 }}>{title}</h2>
    </div>
  );

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", paddingBottom: 20 }}>
      <div className="fu" key={view}>
        {view === "menu" && (
          <div style={{ padding: "0 14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              <button
                onClick={() => setView("exports")}
                style={{
                  background: "var(--cd)",
                  border: "1px solid var(--bd)",
                  borderRadius: "var(--r)",
                  padding: 20,
                  textAlign: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(0,0,0,.03)",
                  minHeight: 170,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginBottom: 6 }}>Export Liste</div>
                <div style={{ fontSize: 12, color: "var(--gr)", lineHeight: 1.45 }}>Descarcă lista invitaților și planul de mese în format PDF</div>
              </button>

              <button
                onClick={() => setView("planner")}
                style={{
                  background: "var(--cd)",
                  border: "1px solid var(--bd)",
                  borderRadius: "var(--r)",
                  padding: 20,
                  textAlign: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(0,0,0,.03)",
                  minHeight: 170,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginBottom: 6 }}>Planificator</div>
                <div style={{ fontSize: 12, color: "var(--gr)", lineHeight: 1.45 }}>Organizează programul zilei nunții, contacte și checklist-uri</div>
              </button>
            </div>
            <div style={{ fontSize: 11, color: "var(--mt)", marginTop: 16, textAlign: "center" }}>Alege o unealtă pentru a continua</div>
          </div>
        )}

        {view === "exports" && (
          <>
            {renderSubHeader("Export Liste")}
            <div style={{ padding: "0 14px" }}>
              <Card style={{ marginBottom: 10, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>📋</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Lista Invitați</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--gr)", marginBottom: 8 }}>Export complet cu toți invitații, statusul RSVP, persoane, masa alocată și restricții alimentare</div>
                <div style={{ fontSize: 11, color: "var(--mt)", marginBottom: 12 }}>{exportStats.guests} invitați · {exportStats.guestPeople} persoane · {exportStats.confirmedPeople} confirmați</div>
                <Btn fullWidth onClick={() => openPDF(generateGuestsPDF(state.guests, state.wedding, state.tables))} style={{ minHeight: 44 }}>📄 Descarcă PDF</Btn>
              </Card>

              <Card style={{ marginBottom: 10, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>🪑</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Plan Mese</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--gr)", marginBottom: 8 }}>Planul complet de aranjare cu invitații la fiecare masă, locuri libere și restricții alimentare</div>
                <div style={{ fontSize: 11, color: "var(--mt)", marginBottom: 12 }}>{exportStats.tables} mese · {exportStats.seats} locuri · {exportStats.seatedPeople} așezați</div>
                <Btn fullWidth onClick={() => openPDF(generateTablesPDF(state.tables, state.guests, state.wedding))} style={{ minHeight: 44 }}>📄 Descarcă PDF</Btn>
              </Card>
            </div>
          </>
        )}

        {view === "planner" && (
          <>
            {renderSubHeader("Planificator Ziua Nunții")}
            <div style={{ padding: "0 14px" }}>
              <Card style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Programul zilei</div>
                    <div style={{ fontSize: 12, color: "var(--gr)", marginTop: 4 }}>
                      {(state.wedding?.date ? new Date(state.wedding.date).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" }) : "Fără dată setată")} · {weddingCountdown}
                    </div>
                  </div>
                  <Btn size="sm" onClick={openAddMoment} style={{ minHeight: 44 }}>+ Adaugă moment</Btn>
                </div>

                {sortedProgram.length === 0 ? (
                  <div style={{ border: "1px dashed var(--bd)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>🗓️</div>
                    <div style={{ fontSize: 12, color: "var(--gr)", marginBottom: 10 }}>Programul este gol. Poți începe cu un template implicit.</div>
                    <Btn variant="secondary" size="sm" onClick={generateDefaultProgram} style={{ minHeight: 44 }}>Generează program implicit</Btn>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sortedProgram.map((moment, idx) => {
                      const conf = catConfig[moment.category] || catConfig.altele;
                      const isLast = idx === sortedProgram.length - 1;
                      return (
                        <Card key={moment.id} style={{ padding: 12 }}>
                          <div style={{ display: "flex", gap: 10 }}>
                            <div style={{ width: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <span style={{ width: 8, height: 8, borderRadius: 999, marginTop: 8, background: conf.color }} />
                              {!isLast && <span style={{ width: 2, flex: 1, background: "var(--bd)", marginTop: 4 }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 600, color: "var(--gd)" }}>{moment.time}{moment.endTime ? ` - ${moment.endTime}` : ""}</div>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginTop: 2 }}>{moment.title}</div>
                                  <div style={{ marginTop: 5 }}><Badge c={conf.badge}>{conf.icon} {conf.label}</Badge></div>
                                </div>
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button onClick={() => openEditMoment(moment)} style={{ border: "none", background: "transparent", padding: 4, color: "var(--mt)", cursor: "pointer" }} aria-label="Editează moment">{ic.edit}</button>
                                  <button onClick={() => removeMoment(moment.id)} style={{ border: "none", background: "transparent", padding: 4, color: "var(--mt)", cursor: "pointer" }} aria-label="Șterge moment">{ic.trash}</button>
                                </div>
                              </div>
                              {!!moment.location && <div style={{ fontSize: 11, color: "var(--mt)", marginTop: 6 }}>📍 {moment.location}</div>}
                              {!!moment.contact && (
                                <div style={{ fontSize: 11, color: "var(--mt)", marginTop: 4 }}>
                                  📞 {moment.contact}{moment.phone ? <>: <a href={`tel:${moment.phone}`} style={{ color: "var(--gd)", fontWeight: 600 }}>{moment.phone}</a></> : ""}
                                </div>
                              )}
                              {!!moment.notes && <div style={{ marginTop: 6, fontSize: 11, color: "var(--gr)", fontStyle: "italic" }}>📝 {moment.notes}</div>}
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
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Contacte Ziua Nunții</div>
                  <Badge c="blue">{dayContacts.length} contacte</Badge>
                </div>
                {dayContacts.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--gr)", textAlign: "center", padding: "8px 0" }}>Nu există contacte contractate încă.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                    {dayContacts.map((contact) => {
                      const key = `${contact.category || ""}`.toLowerCase();
                      const conf = key.includes("foto") ? catConfig.foto
                        : key.includes("transport") ? catConfig.transport
                        : key.includes("muz") ? catConfig.petrecere
                        : key.includes("catering") ? catConfig.petrecere
                        : key.includes("loca") ? catConfig.ceremonie
                        : catConfig.altele;
                      return (
                        <div key={contact.id} style={{ border: "1px solid var(--bd)", borderRadius: 10, padding: 10, background: "var(--cr)" }}>
                          <div style={{ fontSize: 18, marginBottom: 2 }}>{conf.icon}</div>
                          <div style={{ fontSize: 10, color: "var(--mt)", marginBottom: 4 }}>{contact.category}</div>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5, color: "var(--ink)" }}>{contact.name}</div>
                          {contact.phone ? <a href={`tel:${contact.phone}`} style={{ display: "block", fontSize: 14, color: "var(--gd)", fontWeight: 600 }}>{contact.phone}</a> : <div style={{ fontSize: 11, color: "var(--mt)" }}>Telefon necompletat</div>}
                          {contact.email ? <a href={`mailto:${contact.email}`} style={{ display: "block", marginTop: 4, fontSize: 11, color: "var(--gr)", wordBreak: "break-word" }}>{contact.email}</a> : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card style={{ marginBottom: 10 }}>
                <Btn fullWidth onClick={() => openPDF(generateProgramPDF(state.wedding, sortedProgram, dayContacts))} style={{ minHeight: 44 }}>📄 Exportă Programul PDF</Btn>
              </Card>
            </div>
          </>
        )}
      </div>

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingMoment(null);
        }}
        title={editingMoment ? "Editează moment" : "Adaugă moment"}
        footer={(
          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowForm(false);
                setEditingMoment(null);
              }}
            >
              Renunță
            </Btn>
            <Btn fullWidth onClick={saveMoment} disabled={!formData.time || !formData.title.trim()}>
              Salvează
            </Btn>
          </div>
        )}
      >
        <div>
          <Fld label="Ora" type="time" value={formData.time} onChange={(v) => setFormData((x) => ({ ...x, time: v }))} required />
          <Fld label="Ora final" type="time" value={formData.endTime} onChange={(v) => setFormData((x) => ({ ...x, endTime: v }))} />
          <Fld label="Titlu" value={formData.title} onChange={(v) => setFormData((x) => ({ ...x, title: v }))} required placeholder="Ceremonia religioasă" />
          <Fld
            label="Categorie"
            value={formData.category}
            onChange={(v) => setFormData((x) => ({ ...x, category: v }))}
            options={[
              { value: "pregătiri", label: "💄 Pregătiri" },
              { value: "ceremonie", label: "⛪ Ceremonie" },
              { value: "foto", label: "📸 Foto" },
              { value: "transport", label: "🚗 Transport" },
              { value: "petrecere", label: "🎉 Petrecere" },
              { value: "altele", label: "📌 Altele" },
            ]}
          />
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
                <Btn
                  variant="danger"
                  size="sm"
                  onClick={() => setFormData((x) => ({ ...x, checklist: (x.checklist || []).filter((entry) => entry.id !== item.id) }))}
                >
                  Șterge
                </Btn>
              </div>
            ))}
            <Btn variant="secondary" size="sm" onClick={() => setFormData((x) => ({ ...x, checklist: [...(x.checklist || []), { id: mkid(), text: "", done: false }] }))}>
              + Adaugă sub-task
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Tools;
