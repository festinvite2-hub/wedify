import { Btn } from "./Btn";

function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 320, background: "var(--cd)", color: "var(--ink)", borderRadius: "var(--r)", padding: "24px 20px", boxShadow: "0 12px 40px rgba(0,0,0,.15)", animation: "fadeUp .25s ease-out both" }}>
        <h4 style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 500, marginBottom: 8 }}>{title || "Confirmare"}</h4>
        <p style={{ fontSize: 13, color: "var(--gr)", marginBottom: 20, lineHeight: 1.5 }}>{message || "Ești sigur? Acțiunea nu poate fi anulată."}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="secondary" onClick={onClose} full>Anulează</Btn>
          <Btn v="danger" onClick={() => { onConfirm(); onClose(); }} full>Șterge</Btn>
        </div>
      </div>
    </div>
  );
}

export { ConfirmDialog };
