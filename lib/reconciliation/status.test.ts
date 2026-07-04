import { describe, expect, it } from "vitest";

import { deriveOutcome } from "@/lib/reconciliation/status";

describe("deriveOutcome", () => {
  it("is 'inactive' when nothing was paid and no contract billed", () => {
    expect(
      deriveOutcome({ expected: 0, actual: 0, activeContractCount: 0 }),
    ).toBe("inactive");
  });

  it("is 'unpaid' when a contract billed but nothing arrived", () => {
    expect(
      deriveOutcome({ expected: 1200, actual: 0, activeContractCount: 1 }),
    ).toBe("unpaid");
  });

  it("is 'ok' on an exact payment", () => {
    expect(
      deriveOutcome({ expected: 1200, actual: 1200, activeContractCount: 1 }),
    ).toBe("ok");
  });

  it("absorbs NUMERIC rounding noise within the tolerance", () => {
    expect(
      deriveOutcome({
        expected: 1200,
        actual: 1200.004,
        activeContractCount: 1,
      }),
    ).toBe("ok");
    // Not 1199.995: amounts are NUMERIC(12,2), so a real difference is always
    // a multiple of 0.01 — and 1200 - 1199.995 floats to just over 0.005.
    expect(
      deriveOutcome({
        expected: 1200,
        actual: 1199.996,
        activeContractCount: 1,
      }),
    ).toBe("ok");
  });

  it("is 'underpaid' when less arrived than expected", () => {
    expect(
      deriveOutcome({ expected: 1200, actual: 800, activeContractCount: 1 }),
    ).toBe("underpaid");
  });

  it("is 'overpaid' when more arrived than expected", () => {
    expect(
      deriveOutcome({ expected: 1200, actual: 1500, activeContractCount: 2 }),
    ).toBe("overpaid");
  });

  it("flags a payment just past the tolerance", () => {
    expect(
      deriveOutcome({
        expected: 1200,
        actual: 1200.01,
        activeContractCount: 1,
      }),
    ).toBe("overpaid");
    expect(
      deriveOutcome({
        expected: 1200,
        actual: 1199.99,
        activeContractCount: 1,
      }),
    ).toBe("underpaid");
  });

  it("is 'ok' when a zero-amount contract received nothing", () => {
    // An active contract with monthly_amount 0: nothing was expected and
    // nothing arrived — that reconciles, it is not "unpaid".
    expect(
      deriveOutcome({ expected: 0, actual: 0, activeContractCount: 1 }),
    ).toBe("ok");
  });
});
