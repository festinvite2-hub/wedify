function Card({ children, style, padding = "16px", onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      {...props}
      style={{
        background: "var(--cd)",
        color: "var(--ink)",
        borderRadius: "var(--r)",
        border: "1px solid var(--bd)",
        boxShadow: "var(--sh)",
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export { Card };
