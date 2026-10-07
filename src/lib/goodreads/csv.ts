/**
 * Minimal RFC 4180 CSV parser. Handles quoted fields, escaped quotes ("")
 * and line breaks inside quotes, which Goodreads reviews often contain.
 */
export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop blank lines
  return rows.filter((r) => r.some((value) => value.trim() !== ""));
}

/** Turns parsed rows into objects keyed by the header row. */
export function csvToRecords(input: string): {
  headers: string[];
  records: Record<string, string>[];
} {
  const [headerRow, ...dataRows] = parseCsv(input);
  if (!headerRow) return { headers: [], records: [] };

  const headers = headerRow.map((h) => h.trim());
  const records = dataRows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
  return { headers, records };
}
