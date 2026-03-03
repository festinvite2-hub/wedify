/**
 * @param {Object} props
 * @param {React.ReactNode} props.icon
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} [props.action]
 */
function EmptyState({ icon = "📭", title, subtitle, action }) {
  return (
    <div className="px-5 py-9 text-center">
      <div className="mb-2 text-[45px]">{icon}</div>
      <div className="mb-1 font-display text-[19px]">{title}</div>
      <div className={`text-sm text-mute ${action ? "mb-2.5" : "mb-0"}`}>{subtitle}</div>
      {action || null}
    </div>
  );
}

export { EmptyState };
