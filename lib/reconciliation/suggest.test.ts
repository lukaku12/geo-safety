import { describe, expect, it } from "vitest";

import {
  normalizeCompanyName,
  suggestCompany,
} from "@/lib/reconciliation/suggest";
import type { Company } from "@/lib/types/domain";

const company = (id: string, name: string, taxId: string): Company => ({
  id,
  name,
  taxId,
});

const COMPANIES: readonly Company[] = [
  company("c1", "შპს გეოტრანსი", "201234567"),
  company("c2", "სს თბილავიამშენი", "202345678"),
  company("c3", "ი/მ ლევან წიკლაური", "01034567890"),
];

describe("normalizeCompanyName", () => {
  it("strips Georgian legal forms", () => {
    expect(normalizeCompanyName("შპს გეოტრანსი")).toBe("გეოტრანსი");
    expect(normalizeCompanyName("სს თბილავიამშენი")).toBe("თბილავიამშენი");
    expect(normalizeCompanyName("ი/მ ლევან წიკლაური")).toBe("ლევან წიკლაური");
  });

  it("drops parentheticals like branch suffixes", () => {
    expect(normalizeCompanyName("გეოტრანსი (ფილიალი)")).toBe("გეოტრანსი");
  });

  it("collapses punctuation and case", () => {
    expect(normalizeCompanyName("GEO-Trans,  LLC.")).toBe("geo trans llc");
  });
});

describe("suggestCompany", () => {
  it("prefers an exact INN → tax ID match", () => {
    const result = suggestCompany(
      { senderInn: "201234567", senderName: "სრულიად სხვა სახელი" },
      COMPANIES,
    );
    expect(result).toMatchObject({ reason: "inn", company: { id: "c1" } });
  });

  it("falls back to fuzzy name matching when the INN is unknown", () => {
    const result = suggestCompany(
      { senderInn: "999999999", senderName: "გეოტრანსი (ფილიალი)" },
      COMPANIES,
    );
    expect(result).toMatchObject({ reason: "name", company: { id: "c1" } });
  });

  it("matches when the sender name contains the company name", () => {
    const result = suggestCompany(
      { senderInn: null, senderName: "შპს თბილავიამშენი ჯგუფი" },
      COMPANIES,
    );
    expect(result).toMatchObject({ reason: "name", company: { id: "c2" } });
  });

  it("returns null rather than guessing from a too-short name", () => {
    expect(
      suggestCompany({ senderInn: null, senderName: "შპ" }, COMPANIES),
    ).toBeNull();
  });

  it("returns null when nothing is convincing", () => {
    expect(
      suggestCompany(
        { senderInn: "999999999", senderName: "უცნობი კომპანია" },
        COMPANIES,
      ),
    ).toBeNull();
    expect(suggestCompany({ senderInn: null, senderName: null }, COMPANIES)).toBeNull();
  });
});
