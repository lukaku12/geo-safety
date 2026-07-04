/** Leading chars Excel/Sheets interpret as a formula (CSV injection). */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

/** A plain numeric literal — safe even though it may start with +/-. */
const PLAIN_NUMBER = /^[+-]?\d+(\.\d+)?$/;

/** Quote a CSV cell only when it contains a comma, quote, or line break. */
function escapeCell(value: string | number | null | undefined): string {
  let str = String(value ?? "");
  // Guard text cells (sender names, purposes) against spreadsheet formula
  // injection. Callers format amounts with `.toFixed()` before handing them
  // to `toCsv`, so those arrive as strings like "-1500.00", not JS numbers —
  // a `typeof` check alone would falsely flag every negative amount. Only
  // strings that both start with a trigger char *and* aren't themselves a
  // plain number get the guard (a real payload like "-2+cmd|..." still needs
  // non-numeric content after the sign to do anything, so it's still caught).
  if (
    typeof value === "string" &&
    FORMULA_TRIGGER.test(str) &&
    !PLAIN_NUMBER.test(str)
  ) {
    str = `'${str}`;
  }
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
