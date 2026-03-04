import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import { saveTheme } from "../lib/utils";
import { getSupabase } from "../lib/supabase-client";
import { Btn } from "../ui/Btn";
import { Modal } from "../ui/Modal";
import { Fld } from "../ui/Fld";
import { ic } from "../lib/icons";

// TODO: Înlocuiește cu link-ul tău real Revolut.me
const DONATE_URL = "https://revolut.me/wedify";

function Settings({ open, onClose }) {
  const { state, dispatch, weddingId, showToast } = useData();
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const updater = key => value => setFormData(current => ({ ...current, [key]: value }));

  useEffect(() => {
    if (open) {
      setFormData({ ...state.wedding });
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      setDeleting(false);
    }
  }, [open, state.wedding]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wedify-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "STERGE") return;
    setDeleting(true);

    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("No Supabase client");

      // Obtine sesiunea curenta pentru token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      // Apeleaza Edge Function
      const response = await window.fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Delete failed");
      }

      // Stergere reusita - sign out local si redirect
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err) {
      console.error("Delete account error:", err);
      showToast?.("Eroare la stergerea contului. Incearca din nou.", "error");
      setDeleting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Setări">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 12, borderBottom: "1px solid var(--bd)" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Mod întunecat</div>
          <div style={{ fontSize: 11, color: "var(--mt)" }}>Schimbă tema aplicației</div>
        </div>
        <button onClick={() => { const next = theme === "dark" ? "light" : "dark"; setTheme(next); saveTheme(next); }} style={{ width: 48, height: 28, borderRadius: 14, background: theme === "dark" ? "var(--g)" : "var(--cr2)", border: "1px solid var(--bd)", position: "relative", transition: "all .2s" }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--cd)", position: "absolute", top: 2, left: theme === "dark" ? 23 : 2, transition: "left .2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {theme === "dark" ? ic.moon : ic.sun}
          </div>
        </button>
      </div>

      <Fld label="Numele mirilor" value={formData.couple} onChange={updater("couple")} placeholder="Alexandra & Mihai" />
      <Fld label="Data nunții" value={formData.date} onChange={updater("date")} type="date" />
      <Fld label="Locația" value={formData.venue} onChange={updater("venue")} placeholder="Palatul Mogoșoaia" />

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Btn fullWidth onClick={() => { dispatch({ type: "SET", p: { wedding: formData } }); onClose(); }}>Salvează</Btn>
        <Btn variant="outline" onClick={exportJson}>Export JSON</Btn>
      </div>

      <div style={{
        background: "var(--cr)",
        border: "1px solid var(--gl)",
        borderRadius: "var(--r)",
        padding: "24px",
        textAlign: "center",
        marginTop: "24px",
        marginBottom: "24px",
      }}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>☕</div>
        <h3 style={{ fontFamily: "var(--fd)", fontSize: "18px", fontWeight: 500, marginBottom: "6px" }}>Wedify te-a ajutat?</h3>
        <p style={{ color: "var(--gr)", fontSize: "13px", marginBottom: "16px", lineHeight: 1.5 }}>
          Dacă aplicația ți-a ușurat organizarea nunții, poți să ne oferi o cafea.
        </p>
        <a
          href={DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            background: "var(--g)",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "none",
            transition: "opacity 0.2s",
          }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          Oferă o cafea ☕
        </a>
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--bd)" }}>
        <button onClick={async () => { if (confirm("Sigur vrei să te deconectezi?")) { const supabase = getSupabase(); if (supabase) await supabase.auth.signOut(); window.location.reload(); } }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: "var(--rs)", background: "rgba(184,92,92,.06)", border: "1.5px solid rgba(184,92,92,.15)", color: "var(--er)", fontSize: 13, fontWeight: 600, transition: "all .15s" }}>
          {ic.logout} Deconectare
        </button>
      </div>

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--bd)" }}>
        <div style={{ fontSize: 10, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8 }}>
          Zona periculoasă
        </div>
        <Btn variant="danger" fullWidth onClick={() => { setDeleteConfirmText(""); setShowDeleteModal(true); }}>
          Șterge contul
        </Btn>
      </div>

      <Modal open={showDeleteModal} onClose={() => { if (!deleting) setShowDeleteModal(false); }} title="Ești sigur?" maxWidth="520px">
        <p style={{ fontSize: 13, color: "var(--gr)", marginBottom: 12, lineHeight: 1.6 }}>
          Această acțiune este permanentă. Toate datele nunții tale (invitați, mese, buget, task-uri, furnizori)
          vor fi șterse definitiv și nu pot fi recuperate.
        </p>
        <input
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder="Scrie STERGE pentru a confirma"
          style={{ width: "100%", padding: "11px 13px", borderRadius: "var(--rs)", border: "1.5px solid var(--er)", background: "var(--cr)", marginBottom: 12 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" fullWidth onClick={() => setShowDeleteModal(false)} disabled={deleting}>Anulează</Btn>
          <Btn variant="danger" fullWidth onClick={handleDeleteAccount} disabled={deleteConfirmText !== "STERGE" || deleting}>
            {deleting ? "Se șterge..." : "Șterge definitiv"}
          </Btn>
        </div>
      </Modal>
    </Modal>
  );
}

export default Settings;
