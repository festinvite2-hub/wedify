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
    <div className="fixed bottom-[18px] left-1/2 z-[3000] w-auto max-w-[90%] -translate-x-1/2 animate-fade-up rounded-xl px-5 py-2.5 text-center text-sm font-semibold text-white shadow-[0_4px_20px_rgba(0,0,0,.2)]" style={{ background: bg }}>
      {message}
    </div>
  );
}

export { Toast };
