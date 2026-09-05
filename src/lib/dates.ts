// Deterministic date helpers. All operate on 'YYYY-MM-DD' local calendar
// strings so keys never shift with the browser timezone.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Parse 'YYYY-MM-DD' into a local Date at midnight. */
export function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Format a Date as a local 'YYYY-MM-DD' string. */
export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's local date as 'YYYY-MM-DD'. */
export function todayYmd(now: Date = new Date()): string {
  return toYmd(now);
}

/**
 * ISO-8601 week number and its ISO week-year.
 * The ISO week-year can differ from the calendar year near Jan 1 / Dec 31.
 */
export function isoWeek(ymd: string): { year: number; week: number } {
  const d = parseYmd(ymd);
  d.setHours(0, 0, 0, 0);
  // Shift to the Thursday of the current ISO week; that day's year is the ISO year.
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return { year: d.getFullYear(), week };
}

/** e.g. '2026-W36' (ISO week-year + zero-padded ISO week). */
export function weekKey(ymd: string): string {
  const { year, week } = isoWeek(ymd);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** e.g. 'Sep-2026' (calendar month + calendar year). */
export function monthKey(ymd: string): string {
  const d = parseYmd(ymd);
  return `${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
}

/** e.g. '31-Aug-2026' (zero-padded day, 3-letter month, 4-digit year). */
export function formatExcelDate(ymd: string): string {
  const d = parseYmd(ymd);
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
}
