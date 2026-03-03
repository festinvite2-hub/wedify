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
    gold: "bg-gold text-white border border-gold",
    outline: "bg-transparent text-ink border border-border",
    ghost: "bg-transparent text-gold-dark border border-transparent",
    danger: "bg-err text-white border border-err",
  };
  const sizes = {
    sm: "px-3 py-[7px] text-xs",
    md: "px-[18px] py-[11px] text-sm",
    lg: "px-5 py-[13px] text-[14px]",
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-[7px] rounded-sm font-semibold tracking-[.02em] transition-all ${sizes[size]} ${variants[resolvedVariant]} ${resolvedFull ? "w-full" : "w-auto"}`}
      style={{ opacity: disabled ? 0.4 : 1, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

export { Btn };
