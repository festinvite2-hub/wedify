import { useData } from "../context/DataContext";
import { Card } from "../ui/Card";
import { Btn } from "../ui/Btn";
import { fmtD, fmtC, sumGuests, openPDF, generateGuestsPDF, generateTablesPDF } from "../lib/utils";
import { ic } from "../lib/icons";

function Home() {
  const { state, setShowSettings, setTab } = useData();
  const days = Math.max(0, Math.ceil((new Date(state.wedding.date) - new Date()) / 864e5));
  const conf = state.guests.filter(g => g.rsvp === "confirmed").length;
  const pend = state.guests.filter(g => g.rsvp === "pending").length;
  const decl = state.guests.filter(g => g.rsvp === "declined").length;
  const confPpl = sumGuests(state.guests.filter(g => g.rsvp === "confirmed"));
  const tP = state.budget.reduce((a, b) => a + b.planned, 0);
  const tS = state.budget.reduce((a, b) => a + b.spent, 0);
  const bP = tP > 0 ? Math.round((tS / tP) * 100) : 0;
  const doneT = state.tasks.filter(t => t.status === "done").length;
  const seated = state.guests.filter(g => g.tid).length;
  const seatedConfPpl = sumGuests(state.guests.filter(g => g.tid && g.rsvp === "confirmed"));
  const urgent = state.tasks.filter(t => t.prio === "high" && t.status !== "done");
  const overdue = state.tasks.filter(t => new Date(t.due) < new Date() && t.status !== "done").length;
  const paidC = state.budget.filter(b => b.status === "paid").length;
  const partC = state.budget.filter(b => b.status === "partial").length;
  const unpC = state.budget.filter(b => b.status === "unpaid").length;
  const costPerGuest = confPpl > 0 ? Math.round(tP / confPpl) : 0;
  const unseatedConfPpl = Math.max(confPpl - seatedConfPpl, 0);
  const todaysActions = [
    overdue > 0 && { id: "overdue", title: `Rezolvă ${overdue} task-uri depășite`, hint: "Deschide timeline-ul", tab: "tasks", c: "var(--er)" },
    unseatedConfPpl > 0 && { id: "seating", title: `Alocă ${unseatedConfPpl} persoane la mese`, hint: "Finalizează planul de mese", tab: "tables", c: "var(--g)" },
    pend > 0 && { id: "rsvp", title: `Urmărește ${pend} RSVP în așteptare`, hint: "Sună / trimite reminder", tab: "guests", c: "#5A82B4" },
    unpC > 0 && { id: "budget", title: `${unpC} categorii sunt neplătite`, hint: "Verifică bugetul", tab: "budget", c: "var(--wn)" },
  ].filter(Boolean).slice(0, 3);

  return (
    <div className="fu" style={{ padding: "4px 14px 24px" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(145deg,var(--cd),var(--cr))", borderRadius: "var(--r)", padding: "18px 16px", marginBottom: 12, position: "relative", overflow: "hidden", border: "1px solid var(--bd)", boxShadow: "var(--sh)" }}>
        <div style={{ position: "absolute", top: -45, right: -35, width: 150, height: 150, background: "radial-gradient(circle,rgba(184,149,106,.2),transparent 70%)", borderRadius: "50%" }} />
        <button onClick={() => setShowSettings(true)} style={{ position: "absolute", top: 10, right: 10, padding: 5, color: "var(--mt)", zIndex: 2 }}>{ic.edit}</button>
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}><span style={{ color: "var(--g)" }}>{ic.heart}</span><span style={{ fontSize: 9, color: "var(--gd)", textTransform: "uppercase", letterSpacing: ".15em", fontWeight: 700 }}>Countdown</span></div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 44, fontWeight: 500, color: "var(--gd)", lineHeight: 1 }}>{days}</div>
          <div style={{ fontSize: 12, color: "var(--mt)", marginBottom: 10 }}>zile rămase</div>
          <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 600 }}>{state.wedding.couple}</div>
          <div style={{ fontSize: 11, color: "var(--gr)", marginTop: 2 }}>{fmtD(state.wedding.date)} · {state.wedding.venue}</div>
          <div style={{ fontSize: 10, color: "var(--mt)", marginTop: 4 }}>Țintă invitați: {Math.max(1, Number(state.wedding.guestTarget) || 100)}</div>
        </div>
      </div>

      {/* Stats */}
      {/* Overdue warning banner */}
      {overdue > 0 && <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: "var(--r)", background: "rgba(184,92,92,.08)", border: "1.5px solid rgba(184,92,92,.2)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(184,92,92,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>⚠</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--er)" }}>{overdue} task-uri depășite</div>
          <div style={{ fontSize: 11, color: "var(--gr)" }}>Verifică secțiunea Tasks pentru detalii</div>
        </div>
      </div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { l: "Confirmați", v: conf, sub: `${pend} așteptare · ${decl} refuz`, cl: "var(--ok)", tab: "guests" },
          { l: "Așezați", v: `${seatedConfPpl}/${confPpl}`, sub: `${Math.max(confPpl - seatedConfPpl, 0)} rămași`, cl: "var(--g)", tab: "tables" },
          { l: "Tasks", v: `${Math.round((doneT / Math.max(state.tasks.length, 1)) * 100)}%`, sub: `${doneT}/${state.tasks.length} gata`, cl: overdue > 0 ? "var(--er)" : "var(--ok)", tab: "tasks" },
          { l: "Total invitați", v: state.guests.length, sub: `${sumGuests(state.guests)} persoane · ${state.guests.filter(g => g.dietary).length} cu restricții`, cl: "var(--g)", tab: "guests" },
          { l: "Cost/persoană", v: fmtC(costPerGuest), sub: `buget ${fmtC(tP)} / ${confPpl} pers. confirmate`, cl: "var(--gd)", tab: "budget" },
        ].map((x, i) => (
          <Card key={i} onClick={() => setTab(x.tab)} style={{ padding: "12px 10px", cursor: "pointer" }}>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 5 }}>{x.l}</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 500, color: x.cl, lineHeight: 1.1 }}>{x.v}</div>
            <div style={{ fontSize: 10, color: "var(--mt)", marginTop: 1 }}>{x.sub}</div>
          </Card>
        ))}
      </div>

      {todaysActions.length > 0 && <Card style={{ marginBottom: 12, padding: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Ce să faci azi</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {todaysActions.map(a => <button key={a.id} onClick={() => setTab(a.tab)} style={{ textAlign: "left", padding: "9px 10px", borderRadius: 10, border: "1px solid var(--bd)", background: "var(--cr)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: a.c, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{a.title}</div>
              <div style={{ fontSize: 10, color: "var(--mt)" }}>{a.hint}</div>
            </div>
            <span style={{ fontSize: 11, color: "var(--gd)", fontWeight: 700 }}>→</span>
          </button>)}
        </div>
      </Card>}

      {/* Budget dashboard — ENHANCED */}
      <Card style={{ marginBottom: 12, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Buget</span>
          <span style={{ fontFamily: "var(--fd)", fontSize: 20, color: bP > 90 ? "var(--er)" : "var(--g)" }}>{bP}%</span>
        </div>
        <div style={{ height: 8, background: "var(--cr2)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", borderRadius: 4, width: `${Math.min(bP, 100)}%`, background: bP > 90 ? "linear-gradient(90deg,var(--wn),var(--er))" : "linear-gradient(90deg,var(--gl),var(--g))", transition: "width 1s" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Cheltuit</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 17, fontWeight: 500, color: "var(--g)" }}>{fmtC(tS)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Planificat</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 17, fontWeight: 500, color: "var(--ink)" }}>{fmtC(tP)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Rămas</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 17, fontWeight: 500, color: tP - tS >= 0 ? "var(--ok)" : "var(--er)" }}>{fmtC(tP - tS)}</div>
          </div>
        </div>
        {/* Status chips */}
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: "rgba(107,158,104,.08)", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ok)" }}>{paidC}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>plătite</div>
          </div>
          <div style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: "rgba(90,130,180,.08)", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#5A82B4" }}>{partC}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>parțial</div>
          </div>
          <div style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: "rgba(160,160,160,.06)", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mt)" }}>{unpC}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>neplătite</div>
          </div>
        </div>
        {/* Top categories */}
        <div style={{ marginTop: 10 }}>
          {state.budget.slice(0, 3).map(b => {
            const payload = Math.round((b.spent / Math.max(b.planned, 1)) * 100);
            return (<div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <span style={{ fontSize: 11, flex: 1, fontWeight: 500 }}>{b.cat}</span>
              <div style={{ width: 60, height: 4, background: "var(--cr2)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 2, width: `${Math.min(payload, 100)}%`, background: payload > 100 ? "var(--er)" : "var(--g)" }} /></div>
              <span style={{ fontSize: 10, color: "var(--mt)", minWidth: 32, textAlign: "right" }}>{payload}%</span>
            </div>);
          })}
        </div>
      </Card>

      {/* Urgent */}
      {urgent.length > 0 && <Card>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Urgente</div>
        {urgent.slice(0, 4).map((t, i) => <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: i ? "1px solid var(--bd)" : "none" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--er)", flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div><div style={{ fontSize: 10, color: "var(--mt)" }}>{fmtD(t.due)}</div></div></div>)}
      </Card>}

      {/* Export buttons */}
      <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 10 }}>Export</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="secondary" onClick={() => openPDF(generateGuestsPDF(state.guests, state.wedding))} style={{ flex: 1, fontSize: 11, padding: "9px 12px" }}>📄 Lista invitați</Btn>
          <Btn v="secondary" onClick={() => openPDF(generateTablesPDF(state.tables, state.guests, state.wedding))} style={{ flex: 1, fontSize: 11, padding: "9px 12px" }}>📄 Plan mese</Btn>
        </div>
      </Card>

      {/* Activity log */}
      {(state.activity || []).length > 0 && <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Activitate recentă</div>
        {(state.activity || []).slice(0, 8).map((a, i) => {
          const ago = Math.round((Date.now() - new Date(a.ts).getTime()) / 60000);
          const agoText = ago < 1 ? "acum" : ago < 60 ? `${ago}m` : ago < 1440 ? `${Math.round(ago / 60)}h` : `${Math.round(ago / 1440)}z`;
          return (<div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: i ? "1px solid var(--bd)" : "none" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--g)", flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, color: "var(--gr)" }}>{a.msg}</div>
            <div style={{ fontSize: 10, color: "var(--ft)", flexShrink: 0 }}>{agoText}</div>
          </div>);
        })}
      </Card>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GUESTS — with configurable groups
// ═══════════════════════════════════════════════════════════════

export default Home;
