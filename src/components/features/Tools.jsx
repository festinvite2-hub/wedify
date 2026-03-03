import { useState } from "react";
import { useData } from "../context/DataContext";
import { ic } from "../lib/icons";
import { Card } from "../ui/Card";
import { Btn } from "../ui/Btn";

function Tools() {
  const [active, setActive] = useState(null);
  const { state, dispatch } = useData();
  const tools = [
    { k: "tips", l: "Wedding Tips", icon: "💡", desc: "Sfaturi rapide de organizare" },
    { k: "check", l: "Smart Checklist", icon: "✅", desc: "Sugestii automate de task-uri" },
    { k: "day", l: "Ziua Nunții", icon: "📋", desc: "Rezumat pentru ziua evenimentului" },
  ];

  const addSmartTasks = () => {
    const next = [
      { title: "Confirmă transportul", due: "", status: "pending", prio: "medium", cat: "Logistică" },
      { title: "Verifică seating-ul final", due: "", status: "pending", prio: "high", cat: "Invitați" },
      { title: "Trimite reminder furnizori", due: "", status: "pending", prio: "medium", cat: "Furnizori" },
    ];
    next.forEach(t => dispatch({ type: "ADD_TASK", p: { id: "x" + Math.random().toString(36).slice(2, 10), ...t } }));
  };

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      {!active && tools.map(t => (
        <Card key={t.k} onClick={() => setActive(t.k)} style={{ marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--cr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{t.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t.l}</div>
            <div style={{ fontSize: 11, color: "var(--mt)" }}>{t.desc}</div>
          </div>
          <span style={{ color: "var(--ft)" }}>{ic.chevD}</span>
        </Card>
      ))}

      {active && (
        <>
          <button onClick={() => setActive(null)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--gd)", fontWeight: 600, marginBottom: 12, padding: "4px 0" }}>← Înapoi la Unelte</button>
          {active === "tips" && <Card><div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Wedding Tips</div><div style={{ fontSize: 12, color: "var(--mt)", lineHeight: 1.6 }}>Rezervă furnizorii critici cât mai devreme, urmărește RSVP-urile săptămânal și validează timeline-ul cu locația și fotograful.</div></Card>}
          {active === "check" && <Card><div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Smart Checklist</div><div style={{ fontSize: 12, color: "var(--mt)", marginBottom: 10 }}>Task-uri sugerate în funcție de starea curentă.</div><Btn onClick={addSmartTasks}>Adaugă sugestii în Tasks</Btn></Card>}
          {active === "day" && <Card><div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Ziua Nunții</div><div style={{ fontSize: 12, color: "var(--mt)", lineHeight: 1.6 }}>Invitați confirmați: {state.guests.filter(g => g.rsvp === "confirmed").length}. Buget cheltuit: {state.budget.reduce((a,b)=>a+(b.spent||0),0)}€.</div></Card>}
        </>
      )}
    </div>
  );
}

export default Tools;
