import { createPortal } from "react-dom";
import { ic } from "../lib/icons";

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Function} props.onClose
 * @param {string} [props.title]
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.footer]
 * @param {string} [props.maxWidth="480px"]
 */
function Modal({ open, onClose, title, children, footer, maxWidth = "480px" }) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth, maxHeight: "90vh", overflow: "auto", background: "var(--cd)", color: "var(--ink)", borderRadius: "var(--r)", border: "1px solid var(--bd)", boxShadow: "0 12px 40px rgba(0,0,0,.2)", animation: "slideUp .28s ease-out both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--bd)" }}>
          <h3 style={{ fontFamily: "var(--fd)", fontSize: 19, fontWeight: 500 }}>{title}</h3>
          <button onClick={onClose} style={{ padding: 5, color: "var(--mt)" }}>{ic.x}</button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
        {footer && <div style={{ padding: 16, borderTop: "1px solid var(--bd)" }}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export { Modal };
