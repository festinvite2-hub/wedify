import { useState } from "react";
import { LOGO_SM } from "../lib/constants";
import { mkid } from "../lib/utils";

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [couple, setCouple] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [budget, setBudget] = useState(15000);
  const [guestCount, setGuestCount] = useState(100);

  const steps = [
    { title: "Cine se căsătorește?", sub: "Spune-ne numele mirilor" },
    { title: "Când și unde?", sub: "Data și locul nunții" },
    { title: "Planificarea", sub: "Buget estimat și număr de invitați" },
  ];

  const canNext = step === 0 ? couple.length > 2 : step === 1 ? date : true;

  const finish = () => {
    const tablesCount = Math.ceil(guestCount / 8);
    const tables = Array.from({ length: tablesCount }, (_, i) => ({
      id: mkid(), name: i === 0 ? "Masa Mirilor" : `Masa ${i}`, seats: i === 0 ? 6 : 8, shape: i === 0 ? "rectangular" : "round", notes: "",
    }));
    const defaultBudget = [
      { id: mkid(), cat: "Locație", planned: Math.round(budget * 0.2), spent: 0, vendor: venue, status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Catering", planned: Math.round(budget * 0.35), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Fotograf/Video", planned: Math.round(budget * 0.1), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Muzică", planned: Math.round(budget * 0.08), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Floristică", planned: Math.round(budget * 0.07), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Rochie & Costum", planned: Math.round(budget * 0.1), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Altele", planned: Math.round(budget * 0.1), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
    ];
    const defaultTasks = [
      { id: mkid(), title: "Rezervă locația", due: "", status: "pending", prio: "high", cat: "Locație" },
      { id: mkid(), title: "Alege fotograful", due: "", status: "pending", prio: "medium", cat: "Fotograf" },
      { id: mkid(), title: "Trimite invitațiile", due: "", status: "pending", prio: "high", cat: "Invitații" },
      { id: mkid(), title: "Degustare meniu", due: "", status: "pending", prio: "medium", cat: "Catering" },
      { id: mkid(), title: "Probă rochie", due: "", status: "pending", prio: "medium", cat: "Rochie" },
      { id: mkid(), title: "Alege muzica/DJ", due: "", status: "pending", prio: "low", cat: "Muzică" },
    ];
    onComplete({
      wedding: { couple, date, venue, budget: Number(budget), guestTarget: Math.max(1, Number(guestCount) || 1), program: [], theme: "" },
      groups: ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"],
      guests: [], tables, budget: defaultBudget, tasks: defaultTasks, vendors: [],
      onboarded: true, activity: [{ id: mkid(), msg: "Nuntă configurată!", ts: new Date().toISOString() }],
    });
  };

  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(155deg,#1A1A1A,#28221C,#1A1A1A)", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, background: "radial-gradient(circle,rgba(184,149,106,.12),transparent 70%)", borderRadius: "50%" }} />
      <div style={{ flex: "0 0 auto", padding: "48px 28px 0", textAlign: "center", position: "relative", zIndex: 1 }}>
        <img src={LOGO_SM} alt="Wedify" style={{ width: 80, height: 80, objectFit: "contain", marginBottom: 8 }} />
        <h1 style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 400, color: "var(--gl)", marginBottom: 4 }}>Bine ai venit!</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>Hai să configurăm nunta ta în 3 pași simpli</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "20px 0 10px" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i <= step ? "var(--g)" : "rgba(255,255,255,.15)", transition: "all .3s" }} />
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 22px", position: "relative", zIndex: 1 }}>
        <div style={{ background: "rgba(255,255,255,.035)", backdropFilter: "blur(16px)", borderRadius: 18, padding: "28px 20px", border: "1px solid rgba(255,255,255,.05)" }}>
          <h2 style={{ fontFamily: "var(--fd)", fontSize: 20, color: "#fff", textAlign: "center", marginBottom: 4 }}>{steps[step].title}</h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", textAlign: "center", marginBottom: 22 }}>{steps[step].sub}</p>

          {step === 0 && (
            <input value={couple} onChange={e => setCouple(e.target.value)} placeholder="Alexandra & Mihai" style={{ width: "100%", padding: "14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 16, textAlign: "center", fontFamily: "var(--fd)" }} />
          )}

          {step === 1 && <>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", padding: "13px 14px", marginBottom: 10, borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 15 }} />
            <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Locul nunții (opțional)" style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 15 }} />
          </>}

          {step === 2 && <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>Buget estimat (€)</label>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)} style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 18, fontFamily: "var(--fd)", textAlign: "center" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>Câți invitați aștepți (aproximativ)?</label>
              <input type="number" value={guestCount} onChange={e => setGuestCount(e.target.value)} style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 18, fontFamily: "var(--fd)", textAlign: "center" }} />
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", textAlign: "center", marginTop: 6 }}>
                Vom genera automat {Math.ceil(guestCount / 8)} mese + categorii buget + task-uri inițiale
              </div>
            </div>
          </>}

          <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
            {step > 0 && <button onClick={() => setStep(step - 1)} style={{ flex: 1, padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.6)", fontSize: 14 }}>Înapoi</button>}
            <button onClick={() => step < 2 ? setStep(step + 1) : finish()} disabled={!canNext} style={{ flex: 1, padding: 14, borderRadius: 12, background: canNext ? "linear-gradient(135deg,var(--g),var(--gd))" : "rgba(255,255,255,.1)", color: canNext ? "#fff" : "rgba(255,255,255,.3)", fontSize: 14, fontWeight: 600, opacity: canNext ? 1 : .5 }}>
              {step < 2 ? "Continuă" : "Începe planificarea →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🧰 TOOLS MODULE — Unelte utile
// ═══════════════════════════════════════════════════════════════

export default Onboarding;
