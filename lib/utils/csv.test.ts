import { describe, expect, it } from "vitest";

import { toCsv } from "@/lib/utils/csv";

describe("toCsv", () => {
  it("joins header and rows with commas and newlines", () => {
    expect(
      toCsv(["a", "b"], [["1", "2"], ["3", "4"]]),
    ).toBe("a,b\n1,2\n3,4");
  });

  it("quotes cells containing commas, quotes, or line breaks", () => {
    expect(toCsv(["v"], [["with, comma"]])).toBe('v\n"with, comma"');
    expect(toCsv(["v"], [['say "hi"']])).toBe('v\n"say ""hi"""');
    expect(toCsv(["v"], [["line\nbreak"]])).toBe('v\n"line\nbreak"');
    expect(toCsv(["v"], [["carriage\rreturn"]])).toBe('v\n"carriage\rreturn"');
  });

  it("renders null and undefined as empty cells", () => {
    expect(toCsv(["a", "b"], [[null, undefined]])).toBe("a,b\n,");
  });

  it("guards text cells against spreadsheet formula injection", () => {
    expect(toCsv(["v"], [["=SUM(A1:A9)"]])).toBe("v\n'=SUM(A1:A9)");
    expect(toCsv(["v"], [["@import"]])).toBe("v\n'@import");
    expect(toCsv(["v"], [["+123"]])).toBe("v\n'+123");
    expect(toCsv(["v"], [["-fake"]])).toBe("v\n'-fake");
  });

  it("leaves numbers numeric — negative amounts are not escaped", () => {
    expect(toCsv(["amount"], [[-500.25]])).toBe("amount\n-500.25");
    expect(toCsv(["amount"], [[1200]])).toBe("amount\n1200");
  });
});
