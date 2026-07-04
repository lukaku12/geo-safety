/** Leading chars Excel/Sheets interpret as a formula (CSV injection). */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

/** Quote a CSV cell only when it contains a comma, quote, or line break. */
function escapeCell(value: string | number | null | undefined): string {
  let str = String(value ?? "");
  // Guard text cells (sender names, purposes) against spreadsheet formula
  // injection; numbers are exempt so amounts like -500 stay numeric.
  if (typeof value === "string" && FORMULA_TRIGGER.test(str)) str = `'${str}`;
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/**
 * Build a CSV string from a header + rows. Pure (testable) — the browser-only
 * download side effect lives in {@link downloadCsv}.
 */
export function toCsv(
  header: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>,
): string {
  return [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
}

/** Trigger a client-side CSV download. Call only in the browser. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["﻿", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
