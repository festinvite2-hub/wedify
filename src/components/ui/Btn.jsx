/**
 * @param {Object} props
 * @param {"gold"|"outline"|"ghost"|"danger"} [props.variant="gold"]
 * @param {"sm"|"md"|"lg"} [props.size="md"]
 * @param {boolean} [props.fullWidth=false]
 * @param {boolean} [props.disabled=false]
 * @param {Function} props.onClick
 * @param {React.ReactNode} props.children
 * @param {Object} [props.style]
 */
function Btn({ variant = "gold", size = "md", fullWidth = false, disabled, onClick, children, style, v, full, ...props }) {
  const resolvedVariant = v ? ({ primary: "gold", secondary: "outline", ghost: "ghost", danger: "danger" }[v] || variant) : variant;
  const resolvedFull = full !== undefined ? full : fullWidth;
  const variants = {
    gold: { background: "var(--g)", color: "#fff", border: "1px solid var(--g)" },
    outline: { background: "transparent", color: "var(--ink)", border: "1px solid var(--bd)" },
    ghost: { background: "transparent", color: "var(--gd)", border: "1px solid transparent" },
    danger: { background: "var(--er)", color: "#fff", border: "1px solid var(--er)" },
  };
  const sizes = {
    sm: { padding: "7px 12px", fontSize: 12 },
    md: { padding: "11px 18px", fontSize: 13 },
    lg: { padding: "13px 20px", fontSize: 14 },
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        borderRadius: "var(--rs)",
        letterSpacing: ".02em",
        transition: "all .2s",
        fontWeight: 600,
        opacity: disabled ? 0.4 : 1,
        width: resolvedFull ? "100%" : "auto",
        ...sizes[size],
        ...variants[resolvedVariant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export { Btn };
