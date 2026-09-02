function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Money and percentages are written as plain decimals (no $/% signs) so spreadsheet
 * apps import them as numbers, not text. */
export function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map((cell) => csvEscape(String(cell))).join(",")).join("\r\n");
}
