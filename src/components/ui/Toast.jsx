import { useEffect } from "react";

/**
 * @param {Object} props
 * @param {string} props.message
 * @param {"success"|"error"|"info"} [props.type="info"]
 * @param {boolean} props.visible
 * @param {Function} [props.onHide]
 */
function Toast({ message, type = "info", visible, onHide }) {
  useEffect(() => {
    if (!visible || !onHide) return;
    const t = setTimeout(() => onHide(), 2500);
    return () => clearTimeout(t);
  }, [visible, onHide]);

  if (!visible) return null;
  const bg = type === "error" ? "var(--er)" : type === "success" ? "var(--ok)" : "var(--g)";
  return (
    <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", zIndex: 3000, padding: "10px 20px", borderRadius: 12, background: bg, color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,.2)", animation: "fadeUp .3s ease-out both", maxWidth: "90%", textAlign: "center" }}>
      {message}
    </div>
  );
}

export { Toast };
