export default function StatCard({ title, value, icon: Icon, tone = "blue", subtitle }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={21} />
      </div>
      <div>
        <p className="stat-title">{title}</p>
        <h3>{value}</h3>
        {subtitle && <span className="muted">{subtitle}</span>}
      </div>
    </div>
  );
}