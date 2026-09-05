import { useMemo } from "react";
import { weeklyKpis } from "../lib/kpis";
import type { ActivityLog } from "../lib/types";

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
      <div className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</div>
      <div className="mt-0.5 text-[11px] leading-tight text-teal-50/80">
        {label}
      </div>
    </div>
  );
}

export function KpiHeader({ logs }: { logs: ActivityLog[] }) {
  const k = useMemo(() => weeklyKpis(logs), [logs]);
  return (
    <div className="bg-gradient-to-br from-brand to-brand-dark px-4 pb-4 pt-3 text-white">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-base font-semibold">Field Activity Logger</h1>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium tabular-nums">
          {k.weekKey}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Logs this week" value={k.totalLogs} accent="text-white" />
        <Stat
          label="Terminals deployed"
          value={k.terminalsDeployed}
          accent="text-teal-200"
        />
        <Stat
          label="Idle recalls"
          value={k.idleRecalls}
          accent="text-teal-200"
        />
        <Stat
          label="Pending issues"
          value={k.pendingIssues}
          accent={k.pendingIssues > 0 ? "text-amber-300" : "text-white"}
        />
      </div>
    </div>
  );
}
