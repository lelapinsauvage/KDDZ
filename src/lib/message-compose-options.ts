export interface MessageNatureOption {
  value: string;
  label: string;
  legacyId?: number | null;
}

export const FALLBACK_LEGACY_MESSAGE_NATURES: MessageNatureOption[] = [
  { value: "Outside Activities", label: "Outside Activities" },
  { value: "Inside Activities", label: "Inside Activities" },
  { value: "Day off", label: "Day off" },
  { value: "Strike", label: "Strike" },
  { value: "Holiday", label: "Holiday" },
  { value: "Birthday", label: "Birthday" },
  { value: "Payment", label: "Payment" },
  { value: "Show", label: "Show" },
  { value: "Request", label: "Request" },
  { value: "Celebration", label: "Celebration" },
  { value: "Red day", label: "Red day" },
];

export function legacyNatureRowsToMessageOptions(
  rows:
    | Array<{
        legacyId: number;
        name: string;
        isActive: boolean;
      }>
    | undefined,
): MessageNatureOption[] {
  const seen = new Set<string>();
  const options =
    rows
      ?.filter((row) => row.isActive && row.name.trim())
      .map((row) => ({
        value: row.name.trim(),
        label: row.name.trim(),
        legacyId: row.legacyId,
      }))
      .filter((option) => {
        const key = option.label.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }) ?? [];

  return options.length > 0 ? options : FALLBACK_LEGACY_MESSAGE_NATURES;
}
