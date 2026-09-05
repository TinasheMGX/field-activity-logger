import * as XLSX from "xlsx";
import type { ActivityLog, Settings } from "./types";
import { formatExcelDate, monthKey, weekKey } from "./dates";

/**
 * Corporate tracker column order (A..L). This order is a contract with the
 * official Excel workbook — do not reorder without updating the workbook.
 */
export const EXPORT_HEADERS = [
  "Date", // A
  "Week Key", // B
  "Month Key", // C
  "Officer Name", // D
  "Branch Name", // E
  "Activity Type", // F
  "Merchant Name", // G
  "Merchant Location", // H
  "Customer Issues / Challenges Noted", // I
  "Action Taken / Resolution", // J
  "Status", // K
  "Terminal Count", // L
] as const;

export type ExportCell = string | number;

/** Map one log to the 12-column row in exact A..L order. */
export function toRow(log: ActivityLog, settings: Settings): ExportCell[] {
  return [
    formatExcelDate(log.activity_date), // A — DD-mmm-YYYY
    weekKey(log.activity_date), // B — YYYY-Www
    monthKey(log.activity_date), // C — mmm-YYYY
    settings.officer_name, // D
    settings.branch_name, // E
    log.activity_type, // F
    log.merchant_name, // G
    log.merchant_location, // H
    log.customer_issues, // I
    log.action_taken, // J
    log.status, // K
    Number.isFinite(log.terminal_count) ? log.terminal_count : 0, // L — integer
  ];
}

/**
 * Tabs and newlines are field/record delimiters when pasting TSV into Excel,
 * so they must be flattened inside a cell or the row alignment breaks.
 */
function sanitizeTsvCell(v: ExportCell): string {
  if (typeof v === "number") return String(v);
  return v.replace(/[\t\r\n]+/g, " ").trim();
}

/**
 * Tab-separated data rows, NO header line — the user clicks A2 in the official
 * workbook (headers already in row 1) and pastes.
 */
export function toTsv(logs: ActivityLog[], settings: Settings): string {
  return logs
    .map((l) => toRow(l, settings).map(sanitizeTsvCell).join("\t"))
    .join("\n");
}

/** Build a workbook with the 12 headers in row 1, then data rows. */
export function buildWorkbook(
  logs: ActivityLog[],
  settings: Settings,
): XLSX.WorkBook {
  const aoa: ExportCell[][] = [
    [...EXPORT_HEADERS],
    ...logs.map((l) => toRow(l, settings)),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 12 },
    { wch: 20 }, { wch: 24 }, { wch: 22 }, { wch: 36 }, { wch: 36 },
    { wch: 11 }, { wch: 8 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Field Activity Log");
  return wb;
}

/** Trigger a browser download of the .xlsx workbook. */
export function downloadXlsx(
  logs: ActivityLog[],
  settings: Settings,
  filename: string,
): void {
  XLSX.writeFile(buildWorkbook(logs, settings), filename);
}

/** Suggested export filename, e.g. 'field-activity-2026-09-05.xlsx'. */
export function exportFilename(ext: "xlsx" | "csv", today: string): string {
  return `field-activity-${today}.${ext}`;
}
