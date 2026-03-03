import { useState } from "react";
import { mkid } from "../lib/utils";
import { dbSync } from "../lib/db-sync";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

function Onboarding() {
  const { dispatch, weddingId, setWeddingId, showToast } = useData();
  const { user } = useAuth();
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

  const finish = async () => {
    const budgetValue = Number(budget) || 15000;
    const guestTarget = Math.max(1, Number(guestCount) || 1);
    const tablesCount = Math.ceil(guestTarget / 8);
    const tables = Array.from({ length: tablesCount }, (_, i) => ({ id: mkid(), name: i === 0 ? "Masa Mirilor" : `Masa ${i}`, seats: i === 0 ? 6 : 8, shape: i === 0 ? "rectangular" : "round", notes: "" }));
    const budgetItems = [
      { id: mkid(), cat: "Locație", planned: Math.round(budgetValue * 0.2), spent: 0, vendor: venue, status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Catering", planned: Math.round(budgetValue * 0.35), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Fotograf/Video", planned: Math.round(budgetValue * 0.1), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Muzică", planned: Math.round(budgetValue * 0.08), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Floristică", planned: Math.round(budgetValue * 0.07), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Rochie & Costum", planned: Math.round(budgetValue * 0.1), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Altele", planned: Math.round(budgetValue * 0.1), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
    ];
    const tasks = [
      { id: mkid(), title: "Rezervă locația", due: "", status: "pending", prio: "high", cat: "Locație" },
      { id: mkid(), title: "Alege fotograful", due: "", status: "pending", prio: "medium", cat: "Fotograf" },
      { id: mkid(), title: "Trimite invitațiile", due: "", status: "pending", prio: "high", cat: "Invitații" },
      { id: mkid(), title: "Degustare meniu", due: "", status: "pending", prio: "medium", cat: "Catering" },
      { id: mkid(), title: "Probă rochie", due: "", status: "pending", prio: "medium", cat: "Rochie" },
      { id: mkid(), title: "Alege muzica/DJ", due: "", status: "pending", prio: "low", cat: "Muzică" },
    ];

    try {
      let currentWeddingId = weddingId;
      const userId = user?.id;

      if (!currentWeddingId) {
        const wedding = await dbSync.createWedding(userId, {
          couple,
          date,
          venue,
          budget: budgetValue,
          guestTarget,
          groups: ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"],
          tags: ["Copil", "Cazare", "Parcare", "Din alt oraș", "Martor", "Naș/Nașă"],
          program: [],
          theme: "",
        });
        if (!wedding) {
          showToast?.("Eroare la salvare. Încearcă din nou.", "error");
          return;
        }
        currentWeddingId = wedding.id;
        if (typeof setWeddingId === "function") setWeddingId(currentWeddingId);
      } else {
        await dbSync.updateWedding(currentWeddingId, {
          couple,
          date,
          venue,
          budget: budgetValue,
          guestTarget,
          onboarded: true,
          groups: ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"],
        });
      }

      let dbTables = [];
      let dbBudget = [];
      let dbTasks = [];
      if (currentWeddingId) {
        [dbTables, dbBudget, dbTasks] = await Promise.all([
          dbSync.bulkInsertTables(currentWeddingId, tables),
          dbSync.bulkInsertBudget(currentWeddingId, budgetItems),
          dbSync.bulkInsertTasks(currentWeddingId, tasks),
        ]);
      }

      dispatch({
        type: "SET",
        p: {
          wedding: { couple, date, venue, budget: budgetValue, guestTarget, program: [], theme: "" },
          groups: ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"],
          guests: [],
          tables: dbTables.length > 0 ? dbTables : tables,
          budget: dbBudget.length > 0 ? dbBudget : budgetItems,
          tasks: dbTasks.length > 0 ? dbTasks : tasks,
          vendors: [],
          onboarded: true,
          activity: [{ id: mkid(), msg: "Nuntă configurată!", ts: new Date().toISOString() }],
        },
      });
    } catch (error) {
      showToast?.(`Eroare onboarding: ${error.message}`, "error");
    }
  };

  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(155deg,#1A1A1A,#28221C,#1A1A1A)", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, background: "radial-gradient(circle,rgba(184,149,106,.12),transparent 70%)", borderRadius: "50%" }} />
      <div style={{ flex: "0 0 auto", padding: "48px 28px 0", textAlign: "center", position: "relative", zIndex: 1 }}>
        <img src="/wedify-logo.png" alt="Wedify" style={{ width: 80, height: "auto", borderRadius: 0, marginBottom: 8 }} onError={(e)=>{e.currentTarget.style.display="none";e.currentTarget.nextElementSibling?.classList.remove("hidden");}} /><div className="hidden" style={{fontFamily:"var(--fd)",fontSize:28,color:"var(--gl)",marginBottom:8}}>Wedify</div>
        <h1 style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 400, color: "var(--gl)", marginBottom: 4 }}>Bine ai venit!</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>Hai să configurăm nunta ta în 3 pași simpli</p>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "20px 0 10px" }}>{[0, 1, 2].map(index => <div key={index} style={{ width: index === step ? 24 : 8, height: 8, borderRadius: 4, background: index <= step ? "var(--g)" : "rgba(255,255,255,.15)", transition: "all .3s" }} />)}</div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 22px", position: "relative", zIndex: 1 }}>
        <div style={{ background: "rgba(255,255,255,.035)", backdropFilter: "blur(16px)", borderRadius: 18, padding: "28px 20px", border: "1px solid rgba(255,255,255,.05)" }}>
          <h2 style={{ fontFamily: "var(--fd)", fontSize: 20, color: "#fff", textAlign: "center", marginBottom: 4 }}>{steps[step].title}</h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", textAlign: "center", marginBottom: 22 }}>{steps[step].sub}</p>
          {step === 0 && <input value={couple} onChange={e => setCouple(e.target.value)} placeholder="Alexandra & Mihai" style={{ width: "100%", padding: "14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 16, textAlign: "center", fontFamily: "var(--fd)" }} />}
          {step === 1 && <><input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", padding: "13px 14px", marginBottom: 10, borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 15 }} /><input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Locul nunții (opțional)" style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 15 }} /></>}
          {step === 2 && <><div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>Buget estimat (€)</label><input type="number" value={budget} onChange={e => setBudget(e.target.value)} style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 18, fontFamily: "var(--fd)", textAlign: "center" }} /></div><div><label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>Câți invitați aștepți (aproximativ)?</label><input type="number" value={guestCount} onChange={e => setGuestCount(e.target.value)} style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 18, fontFamily: "var(--fd)", textAlign: "center" }} /><div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", textAlign: "center", marginTop: 6 }}>Vom genera automat {Math.ceil(guestCount / 8)} mese + categorii buget + task-uri inițiale</div></div></>}
          <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
            {step > 0 && <button onClick={() => setStep(step - 1)} style={{ flex: 1, padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.6)", fontSize: 14 }}>Înapoi</button>}
            <button onClick={() => step < 2 ? setStep(step + 1) : finish()} disabled={!canNext} style={{ flex: 1, padding: 14, borderRadius: 12, background: canNext ? "linear-gradient(135deg,var(--g),var(--gd))" : "rgba(255,255,255,.1)", color: canNext ? "#fff" : "rgba(255,255,255,.3)", fontSize: 14, fontWeight: 600, opacity: canNext ? 1 : .5 }}>{step < 2 ? "Continuă" : "Începe planificarea →"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
