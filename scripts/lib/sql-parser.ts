/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from "fs";

export interface TableData {
  columns: string[];
  rows: any[][];
}

/**
 * Parse a MySQL dump file and return a map of table name → { columns, rows }.
 * Handles:
 * - CREATE TABLE for column order (used when INSERT has no column list)
 * - INSERT INTO with or without explicit column names
 * - Double-quoted and single-quoted strings with escaped quotes
 * - Bare numbers and NULL
 * - Multi-row INSERT statements
 */
export function parseSqlDump(filePath: string): Map<string, TableData> {
  const content = fs.readFileSync(filePath, "utf-8");
  const result = new Map<string, TableData>();
  const columnOrders = new Map<string, string[]>();

  // Pass 1: Extract column orders from CREATE TABLE statements
  const lines = content.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const createMatch = line.match(
      /^\s*CREATE\s+TABLE\s+`?(\w+)`?\s*\(/i
    );
    if (createMatch) {
      const tableName = createMatch[1];
      const columns: string[] = [];
      i++;
      while (i < lines.length) {
        const colLine = lines[i].trim();
        if (colLine.startsWith(")")) break;
        const colMatch = colLine.match(/^`(\w+)`/);
        if (colMatch) columns.push(colMatch[1]);
        i++;
      }
      columnOrders.set(tableName, columns);
    }
    i++;
  }

  // Pass 2: Extract INSERT INTO data
  i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const insertMatch = line.match(
      /^\s*INSERT\s+INTO\s+`?(\w+)`?\s*(?:\(([^)]+)\))?\s*VALUES\s*/i
    );
    if (!insertMatch) {
      i++;
      continue;
    }

    const tableName = insertMatch[1];
    const explicitCols = insertMatch[2]
      ? insertMatch[2].split(",").map((c) => c.trim().replace(/`/g, ""))
      : null;

    // Collect all the values text (from VALUES keyword to closing semicolon)
    const valuesIdx = line.toUpperCase().indexOf("VALUES");
    let valuesText = line.substring(valuesIdx + 6);

    // Keep collecting lines until we find one ending with semicolon
    while (!valuesText.trimEnd().endsWith(";")) {
      i++;
      if (i >= lines.length) break;
      valuesText += "\n" + lines[i];
    }

    // Remove trailing semicolon
    valuesText = valuesText.trim();
    if (valuesText.endsWith(";")) valuesText = valuesText.slice(0, -1);

    // Parse value rows
    const rows = parseValueRows(valuesText);

    const columns = explicitCols || columnOrders.get(tableName) || [];

    // Merge with existing data for this table (multiple INSERT statements)
    if (result.has(tableName)) {
      result.get(tableName)!.rows.push(...rows);
    } else {
      result.set(tableName, { columns, rows });
    }

    i++;
  }

  return result;
}

function parseValueRows(text: string): any[][] {
  const rows: any[][] = [];
  let pos = 0;
  const len = text.length;

  while (pos < len) {
    // Skip whitespace and commas between rows
    while (pos < len && " \n\r\t,".includes(text[pos])) pos++;
    if (pos >= len) break;

    // Expect opening paren
    if (text[pos] !== "(") {
      pos++;
      continue;
    }
    pos++; // skip (

    const row: any[] = [];

    while (pos < len) {
      // Skip whitespace
      while (pos < len && " \t\n\r".includes(text[pos])) pos++;

      if (pos >= len || text[pos] === ")") {
        pos++; // skip )
        break;
      }

      // Skip comma separator
      if (text[pos] === ",") {
        pos++;
        // Skip whitespace after comma
        while (pos < len && " \t\n\r".includes(text[pos])) pos++;
        if (pos >= len || text[pos] === ")") {
          pos++;
          break;
        }
      }

      // Parse value
      if (text[pos] === '"') {
        // Double-quoted string
        pos++;
        let value = "";
        while (pos < len) {
          if (text[pos] === "\\" && pos + 1 < len) {
            // Escaped character
            const next = text[pos + 1];
            if (next === "n") {
              value += "\n";
            } else if (next === "r") {
              value += "\r";
            } else if (next === "t") {
              value += "\t";
            } else {
              value += next;
            }
            pos += 2;
          } else if (text[pos] === '"') {
            pos++;
            break;
          } else {
            value += text[pos];
            pos++;
          }
        }
        row.push(value);
      } else if (text[pos] === "'") {
        // Single-quoted string
        pos++;
        let value = "";
        while (pos < len) {
          if (text[pos] === "\\" && pos + 1 < len) {
            const next = text[pos + 1];
            if (next === "n") {
              value += "\n";
            } else if (next === "r") {
              value += "\r";
            } else if (next === "t") {
              value += "\t";
            } else {
              value += next;
            }
            pos += 2;
          } else if (text[pos] === "'" && pos + 1 < len && text[pos + 1] === "'") {
            // Doubled single quote escape
            value += "'";
            pos += 2;
          } else if (text[pos] === "'") {
            pos++;
            break;
          } else {
            value += text[pos];
            pos++;
          }
        }
        row.push(value);
      } else {
        // Bare value: NULL, number, or unquoted identifier
        let value = "";
        while (
          pos < len &&
          text[pos] !== "," &&
          text[pos] !== ")" &&
          text[pos] !== " " &&
          text[pos] !== "\n" &&
          text[pos] !== "\r" &&
          text[pos] !== "\t"
        ) {
          value += text[pos];
          pos++;
        }
        if (value.toUpperCase() === "NULL") {
          row.push(null);
        } else if (value !== "" && !isNaN(Number(value))) {
          row.push(Number(value));
        } else {
          row.push(value);
        }
      }
    }

    if (row.length > 0) {
      rows.push(row);
    }
  }

  return rows;
}
