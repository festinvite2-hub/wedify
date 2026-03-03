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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-h-[90vh] overflow-auto rounded-card border border-border bg-card text-ink shadow-[0_12px_40px_rgba(0,0,0,.2)] animate-slide-up" style={{ maxWidth }}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
          <h3 className="font-display text-[19px] font-medium">{title}</h3>
          <button onClick={onClose} className="p-1 text-mute">{ic.x}</button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="border-t border-border p-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export { Modal };
