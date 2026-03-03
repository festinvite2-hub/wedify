function EmptyState({ icon = "📭", title, subtitle, action }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 20px" }}>
      <div style={{ fontSize: 45, marginBottom: 7 }}>{icon}</div>
      <div style={{ fontFamily: "var(--fd)", fontSize: 19, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--mt)", marginBottom: action ? 10 : 0 }}>{subtitle}</div>
      {action || null}
    </div>
  );
}

export { EmptyState };
