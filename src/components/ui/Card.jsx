/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.padding="16px"]
 * @param {Object} [props.style]
 * @param {Function} [props.onClick]
 */
function Card({ children, style, padding = "16px", onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      {...props}
      className="rounded-card border border-border bg-card text-ink shadow-card"
      style={{ padding, ...style }}
    >
      {children}
    </div>
  );
}

export { Card };
