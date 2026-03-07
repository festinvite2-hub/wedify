import { useData } from "../context/DataContext";
import { generateGuestsPDF, generateTablesPDF, openPDF } from "../lib/utils";
import { Card } from "../ui/Card";
import { Btn } from "../ui/Btn";

function Tools() {
  const { state } = useData();

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      <Card style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Export</div>
        <div style={{ fontSize: 12, color: "var(--gr)", marginBottom: 10 }}>Descarcă rapid listele pentru invitați și planul de mese.</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="secondary" onClick={() => openPDF(generateGuestsPDF(state.guests, state.wedding))} style={{ flex: 1, fontSize: 11, padding: "9px 12px" }}>📄 Lista invitați</Btn>
          <Btn v="secondary" onClick={() => openPDF(generateTablesPDF(state.tables, state.guests, state.wedding))} style={{ flex: 1, fontSize: 11, padding: "9px 12px" }}>📄 Plan mese</Btn>
        </div>
      </Card>
    </div>
  );
}

export default Tools;
