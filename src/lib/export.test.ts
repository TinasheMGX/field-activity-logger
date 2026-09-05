import { describe, expect, it } from "vitest";
import { EXPORT_HEADERS, toRow, toTsv } from "./export";
import type { ActivityLog, Settings } from "./types";

const settings: Settings = {
  officer_name: "Tinashe Mariridza",
  branch_name: "Digital",
};

function log(overrides: Partial<ActivityLog> = {}): ActivityLog {
  return {
    id: "1",
    activity_date: "2026-08-31",
    activity_type: "Deployment",
    terminal_count: 3,
    merchant_name: "Steers",
    merchant_location: "Harare - Samora Machel",
    customer_issues: "",
    action_taken: "Installed and tested POS",
    status: "Completed",
    deleted: false,
    created_at: "2026-08-31T08:00:00.000Z",
    updated_at: "2026-08-31T08:00:00.000Z",
    ...overrides,
  };
}

describe("export column contract", () => {
  it("has exactly 12 headers in A..L order", () => {
    expect(EXPORT_HEADERS).toHaveLength(12);
    expect(EXPORT_HEADERS[0]).toBe("Date");
    expect(EXPORT_HEADERS[11]).toBe("Terminal Count");
  });

  it("maps a log to the 12 columns in order", () => {
    expect(toRow(log(), settings)).toEqual([
      "31-Aug-2026",
      "2026-W36",
      "Aug-2026",
      "Tinashe Mariridza",
      "Digital",
      "Deployment",
      "Steers",
      "Harare - Samora Machel",
      "",
      "Installed and tested POS",
      "Completed",
      3,
    ]);
  });

  it("keeps terminal_count as a real number, not a string", () => {
    expect(toRow(log(), settings)[11]).toBe(3);
  });
});

describe("TSV clipboard output", () => {
  it("emits data rows only (no header) for pasting at A2", () => {
    const tsv = toTsv([log()], settings);
    expect(tsv.split("\n")).toHaveLength(1);
    expect(tsv.startsWith("31-Aug-2026\t")).toBe(true);
  });

  it("flattens newlines/tabs inside cells so rows stay aligned", () => {
    const tsv = toTsv(
      [log({ action_taken: "line one\nline two\twith tab" })],
      settings,
    );
    expect(tsv.split("\n")).toHaveLength(1);
    expect(tsv).toContain("line one line two with tab");
  });

  it("separates every row with a newline", () => {
    const tsv = toTsv([log({ id: "1" }), log({ id: "2" })], settings);
    expect(tsv.split("\n")).toHaveLength(2);
  });
});
