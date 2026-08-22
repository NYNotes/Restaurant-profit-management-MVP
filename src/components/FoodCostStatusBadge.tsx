import type { FoodCostStatus } from "@/lib/calculations/menuItem";

const STATUS_CONFIG: Record<FoodCostStatus, { defaultLabel: string; icon: string; className: string }> = {
  GOOD: { defaultLabel: "Good", icon: "●", className: "bg-emerald-50 text-emerald-700" },
  WARNING: { defaultLabel: "Warning", icon: "▲", className: "bg-amber-50 text-amber-700" },
  HIGH: { defaultLabel: "High", icon: "■", className: "bg-red-50 text-red-700" },
};

/** `label` should come from the "foodCostStatus" i18n namespace; falls back to English when omitted. */
export function FoodCostStatusBadge({ status, label }: { status: FoodCostStatus; label?: string }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      <span aria-hidden="true">{config.icon}</span>
      {label ?? config.defaultLabel}
    </span>
  );
}
