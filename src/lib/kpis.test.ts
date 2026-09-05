import { describe, expect, it } from "vitest";
import { weeklyKpis } from "./kpis";
import type { ActivityLog } from "./types";

function log(overrides: Partial<ActivityLog> = {}): ActivityLog {
  return {
    id: Math.random().toString(),
    activity_date: "2026-08-31", // 2026-W36
    activity_type: "Deployment",
    terminal_count: 0,
    merchant_name: "M",
    merchant_location: "L",
    customer_issues: "",
    action_taken: "",
    status: "Completed",
    deleted: false,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("weeklyKpis (scoped to the ISO week of refDate)", () => {
  const ref = "2026-09-02"; // also 2026-W36

  it("counts only logs in the current ISO week", () => {
    const logs = [
      log({ activity_date: "2026-08-31" }), // W36 in
      log({ activity_date: "2026-09-06" }), // Sun, still W36 in
      log({ activity_date: "2026-09-07" }), // Mon, W37 out
    ];
    expect(weeklyKpis(logs, ref).totalLogs).toBe(2);
  });

  it("sums terminal_count only for Deployment / Idle Recall", () => {
    const logs = [
      log({ activity_type: "Deployment", terminal_count: 3 }),
      log({ activity_type: "Deployment", terminal_count: 2 }),
      log({ activity_type: "Idle Recall", terminal_count: 4 }),
      log({ activity_type: "Merchant Visit", terminal_count: 9 }), // ignored
    ];
    const k = weeklyKpis(logs, ref);
    expect(k.terminalsDeployed).toBe(5);
    expect(k.idleRecalls).toBe(4);
  });

  it("counts pending issues in the week", () => {
    const logs = [
      log({ status: "Pending" }),
      log({ status: "Pending" }),
      log({ status: "Completed" }),
      log({ status: "Pending", activity_date: "2026-09-14" }), // W38 out
    ];
    expect(weeklyKpis(logs, ref).pendingIssues).toBe(2);
  });

  it("reports the ISO week key", () => {
    expect(weeklyKpis([], ref).weekKey).toBe("2026-W36");
  });
});
