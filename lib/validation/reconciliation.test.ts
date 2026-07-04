import { describe, expect, it } from "vitest";

import { parseCompanyReconciliationQuery } from "@/lib/validation/reconciliation";

describe("parseCompanyReconciliationQuery", () => {
  it("accepts a concrete month", () => {
    expect(parseCompanyReconciliationQuery({ period: "2026-06" }).period).toBe(
      "2026-06",
    );
  });

  it("accepts 'all' — the global period selector is shared with every page, so it must reach this page too", () => {
    expect(() =>
      parseCompanyReconciliationQuery({ period: "all" }),
    ).not.toThrow();
    expect(parseCompanyReconciliationQuery({ period: "all" }).period).toBe(
      "all",
    );
  });

  it("still rejects a genuinely malformed period", () => {
    expect(() =>
      parseCompanyReconciliationQuery({ period: "not-a-period" }),
    ).toThrow();
  });

  it("still requires period to be present", () => {
    expect(() => parseCompanyReconciliationQuery({})).toThrow();
  });
});
