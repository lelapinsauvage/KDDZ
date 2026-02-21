import { randomUUID } from "crypto";

const maps = new Map<string, Map<string, string>>();

export function getUUID(table: string, oldId: string | number): string {
  if (!maps.has(table)) maps.set(table, new Map());
  const tableMap = maps.get(table)!;
  const key = String(oldId);
  if (!tableMap.has(key)) tableMap.set(key, randomUUID());
  return tableMap.get(key)!;
}

export function hasMapping(table: string, oldId: string | number): boolean {
  return maps.get(table)?.has(String(oldId)) ?? false;
}
