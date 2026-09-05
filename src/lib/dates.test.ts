import { describe, expect, it } from "vitest";
import { formatExcelDate, isoWeek, monthKey, weekKey } from "./dates";

describe("isoWeek — canonical ISO-8601 boundary cases", () => {
  // Well-known reference values from the ISO-8601 week standard.
  it("2005-01-01 (Sat) belongs to 2004-W53", () => {
    expect(isoWeek("2005-01-01")).toEqual({ year: 2004, week: 53 });
  });
  it("2007-01-01 (Mon) is 2007-W01", () => {
    expect(isoWeek("2007-01-01")).toEqual({ year: 2007, week: 1 });
  });
  it("2019-12-30 (Mon) rolls into 2020-W01", () => {
    expect(isoWeek("2019-12-30")).toEqual({ year: 2020, week: 1 });
  });
  it("2021-01-01 (Fri) belongs to 2020-W53", () => {
    expect(isoWeek("2021-01-01")).toEqual({ year: 2020, week: 53 });
  });
});

describe("weekKey", () => {
  it("zero-pads the week and uses the ISO week-year", () => {
    expect(weekKey("2007-01-01")).toBe("2007-W01");
    expect(weekKey("2021-01-01")).toBe("2020-W53");
  });
});

describe("monthKey", () => {
  it("formats as mmm-YYYY on the calendar month/year", () => {
    expect(monthKey("2026-09-05")).toBe("Sep-2026");
    expect(monthKey("2026-08-31")).toBe("Aug-2026");
    expect(monthKey("2026-01-01")).toBe("Jan-2026");
  });
});

describe("formatExcelDate", () => {
  it("formats as DD-mmm-YYYY with a zero-padded day", () => {
    expect(formatExcelDate("2026-08-31")).toBe("31-Aug-2026");
    expect(formatExcelDate("2026-09-05")).toBe("05-Sep-2026");
  });
});
