import { describe, expect, it } from "vitest";

import {
  ALL_PERIODS,
  DATASET_MONTHS,
  DEFAULT_PERIOD,
  getPeriodOptions,
  getPeriodRange,
  isMonthPeriod,
} from "@/lib/utils/periods";

describe("isMonthPeriod", () => {
  it("accepts YYYY-MM only", () => {
    expect(isMonthPeriod("2026-04")).toBe(true);
    expect(isMonthPeriod(ALL_PERIODS)).toBe(false);
    expect(isMonthPeriod("2026-4")).toBe(false);
    expect(isMonthPeriod("2026-04-01")).toBe(false);
    expect(isMonthPeriod("")).toBe(false);
  });
});

describe("getPeriodRange", () => {
  it("spans the full month, inclusive", () => {
    expect(getPeriodRange("2026-04")).toEqual({
      start: "2026-04-01",
      end: "2026-04-30",
    });
    expect(getPeriodRange("2026-12")).toEqual({
      start: "2026-12-01",
      end: "2026-12-31",
    });
  });

  it("handles February and leap years", () => {
    expect(getPeriodRange("2026-02").end).toBe("2026-02-28");
    expect(getPeriodRange("2024-02").end).toBe("2024-02-29");
  });

  it("returns nulls for 'all' (no date filter)", () => {
    expect(getPeriodRange(ALL_PERIODS)).toEqual({ start: null, end: null });
  });
});

describe("period options", () => {
  it("defaults to the most recent month with data", () => {
    expect(DEFAULT_PERIOD).toBe(DATASET_MONTHS[DATASET_MONTHS.length - 1]);
  });

  it("lists 'All periods' first, then human-readable months", () => {
    const options = getPeriodOptions();
    expect(options[0]).toEqual({ key: ALL_PERIODS, label: "All periods" });
    expect(options[1]).toEqual({ key: "2026-04", label: "April 2026" });
    expect(options).toHaveLength(1 + DATASET_MONTHS.length);
  });
});
