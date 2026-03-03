import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import { saveTheme } from "../lib/utils";
import { getSupabase } from "../lib/supabase-client";
import { Btn } from "../ui/Btn";
import { Modal } from "../ui/Modal";
import { Fld } from "../ui/Fld";
import { ic } from "../lib/icons";

function Settings({ open, onClose }) {
  const { state, dispatch } = useData();
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({});
  const updater = key => value => setFormData(current => ({ ...current, [key]: value }));

  useEffect(() => {
    if (open) setFormData({ ...state.wedding });
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

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--bd)" }}>
        <button onClick={async () => { if (confirm("Sigur vrei să te deconectezi?")) { const supabase = getSupabase(); if (supabase) await supabase.auth.signOut(); window.location.reload(); } }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: "var(--rs)", background: "rgba(184,92,92,.06)", border: "1.5px solid rgba(184,92,92,.15)", color: "var(--er)", fontSize: 13, fontWeight: 600, transition: "all .15s" }}>
          {ic.logout} Deconectare
        </button>
      </div>
    </Modal>
  );
}

export default Settings;
