export function StatCard({
  label,
  value,
  sublabel,
  trend,
}: {
  label: string;
  value: string;
  sublabel?: string;
  trend?: { changeBp: number; goodDirection: "up" | "down"; label: string };
}) {
  let trendEl = null;
  if (trend) {
    const isPositiveMove = trend.goodDirection === "up" ? trend.changeBp > 0 : trend.changeBp < 0;
    const isFlat = trend.changeBp === 0;
    const arrow = trend.changeBp > 0 ? "▲" : trend.changeBp < 0 ? "▼" : "–";
    const colorClass = isFlat ? "text-slate-500" : isPositiveMove ? "text-emerald-600" : "text-red-600";
    trendEl = (
      <p className={`mt-1 text-sm font-medium ${colorClass}`}>
        {arrow} {Math.abs(trend.changeBp / 100).toFixed(1)}% {trend.label}
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {sublabel && <p className="mt-1 text-sm text-slate-500">{sublabel}</p>}
      {trendEl}
    </div>
  );
}
