import { StyleSheet } from "@react-pdf/renderer";

// ─────────────────────────────────────────────
// Shared PDF styles for the Garderie app
// ─────────────────────────────────────────────

// Register default font (Helvetica is built-in, no registration needed)

export const colors = {
  primary: "#0D9488",
  accent: "#14B8A6",
  textDark: "#1C1917",
  textMuted: "#78716C",
  border: "#E7E5E4",
  headerBg: "#F5F5F4",
  white: "#ffffff",
  lightGray: "#FAFAF9",
};

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: colors.textDark,
  },

  // ── Letterhead ──
  letterhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: `2px solid ${colors.accent}`,
  },
  letterheadTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  letterheadSubtitle: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  letterheadDate: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: "right",
  },

  // ── Section ──
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: `1px solid ${colors.border}`,
  },

  // ── Field Rows ──
  fieldRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingVertical: 2,
  },
  fieldLabel: {
    width: "35%",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.textMuted,
  },
  fieldValue: {
    width: "65%",
    fontSize: 9,
    color: colors.textDark,
  },
  fieldRowHalf: {
    flexDirection: "row",
    width: "50%",
  },

  // ── Two-column layout ──
  twoCol: {
    flexDirection: "row",
    gap: 20,
  },
  col: {
    flex: 1,
  },

  // ── Table styles ──
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 22,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 22,
    backgroundColor: colors.lightGray,
  },
  tableHeaderCell: {
    padding: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  tableCell: {
    padding: 4,
    fontSize: 8,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: colors.textMuted,
    borderTop: `1px solid ${colors.border}`,
    paddingTop: 8,
  },

  // ── Misc ──
  badge: {
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    color: colors.white,
    backgroundColor: colors.accent,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 16,
    textAlign: "center",
  },
});

// ── Helpers ──

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getAge(dob: Date | string | null | undefined): string {
  if (!dob) return "—";
  const d = typeof dob === "string" ? new Date(dob) : dob;
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const years = now.getFullYear() - d.getFullYear();
  const months = now.getMonth() - d.getMonth();
  const totalMonths = years * 12 + months;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0) return `${m}m`;
  return `${y}y ${m}m`;
}

export function val(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}
