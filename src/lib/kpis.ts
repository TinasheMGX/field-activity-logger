import type { ActivityLog } from "./types";
import { todayYmd, weekKey } from "./dates";

export interface WeeklyKpis {
  weekKey: string;
  totalLogs: number;
  terminalsDeployed: number;
  idleRecalls: number;
  pendingIssues: number;
}

function sumTerminals(logs: ActivityLog[]): number {
  return logs.reduce((acc, l) => acc + (Number(l.terminal_count) || 0), 0);
}

/**
 * Running KPIs for the ISO week that contains `refDate` (default: today).
 * All four metrics are scoped to the current ISO week per the spec header.
 */
export function weeklyKpis(
  logs: ActivityLog[],
  refDate: string = todayYmd(),
): WeeklyKpis {
  const wk = weekKey(refDate);
  const week = logs.filter((l) => weekKey(l.activity_date) === wk);
  return {
    weekKey: wk,
    totalLogs: week.length,
    terminalsDeployed: sumTerminals(
      week.filter((l) => l.activity_type === "Deployment"),
    ),
    idleRecalls: sumTerminals(
      week.filter((l) => l.activity_type === "Idle Recall"),
    ),
    pendingIssues: week.filter((l) => l.status === "Pending").length,
  };
}
