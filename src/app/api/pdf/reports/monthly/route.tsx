import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { pdfStyles as s, colors } from "@/lib/pdf-styles";

// ─────────────────────────────────────────────
// Monthly Attendance Report PDF
// ─────────────────────────────────────────────

// Legend badge colors matching the old PHP app
const STATUS_COLORS = {
  P: "#27a9e3", // Present - blue
  A: "#ba3e71", // Absent - pink
  W: "#e7505a", // Weekend - red
  H: "#f1c40f", // Holiday - yellow
  N: "#7c3796", // No Report - purple
};

const localStyles = StyleSheet.create({
  legendRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendBadge: {
    width: 14,
    height: 14,
    borderRadius: 2,
    textAlign: "center",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    paddingTop: 2,
  },
  legendText: {
    fontSize: 8,
    color: colors.textMuted,
  },
  dayCell: {
    width: 18,
    height: 18,
    textAlign: "center",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    borderRadius: 2,
    paddingTop: 4,
    margin: 1,
  },
  nameCell: {
    width: 110,
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  headerNameCell: {
    width: 110,
    padding: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  dayHeader: {
    width: 20,
    textAlign: "center",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    padding: 2,
  },
  statsCell: {
    width: 24,
    textAlign: "center",
    fontSize: 7,
    padding: 2,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  statsHeader: {
    width: 24,
    textAlign: "center",
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    padding: 2,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
});

interface AttendanceData {
  childId: string;
  childName: string;
  days: Record<number, "P" | "A" | "W" | "H" | "N">;
}

interface MonthlyReportPdfProps {
  month: number;
  year: number;
  branchName: string;
  className?: string;
  daysInMonth: number;
  weekends: Set<number>;
  holidays: Set<number>;
  attendance: AttendanceData[];
}

function MonthlyReportPdf({
  month,
  year,
  branchName,
  className,
  daysInMonth,
  weekends,
  holidays,
  attendance,
}: MonthlyReportPdfProps) {
  const monthName = new Date(year, month - 1).toLocaleString("en-US", {
    month: "long",
  });

  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={[s.page, { padding: 20 }]}
      >
        {/* Letterhead */}
        <View style={s.letterhead}>
          <View>
            <Text style={s.letterheadTitle}>Garderie</Text>
            <Text style={s.letterheadSubtitle}>
              Monthly Attendance Report
            </Text>
          </View>
          <View>
            <Text style={s.letterheadDate}>
              {monthName} {year}
            </Text>
            <Text style={s.letterheadDate}>Branch: {branchName}</Text>
            {className && (
              <Text style={s.letterheadDate}>Class: {className}</Text>
            )}
          </View>
        </View>

        {/* Legend */}
        <View style={localStyles.legendRow}>
          {Object.entries(STATUS_COLORS).map(([code, color]) => {
            const labels: Record<string, string> = {
              P: "Present",
              A: "Absent",
              W: "Weekend",
              H: "Holiday",
              N: "No Report",
            };
            return (
              <View key={code} style={localStyles.legendItem}>
                <Text
                  style={[
                    localStyles.legendBadge,
                    { backgroundColor: color },
                  ]}
                >
                  {code}
                </Text>
                <Text style={localStyles.legendText}>{labels[code]}</Text>
              </View>
            );
          })}
        </View>

        {/* Table */}
        <View style={s.table}>
          {/* Header Row */}
          <View style={s.tableHeader}>
            <Text style={localStyles.headerNameCell}>Child Name</Text>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
              (day) => (
                <Text key={day} style={localStyles.dayHeader}>
                  {day}
                </Text>
              ),
            )}
            <Text style={localStyles.statsHeader}>P</Text>
            <Text style={localStyles.statsHeader}>A</Text>
          </View>

          {/* Data Rows */}
          {attendance.map((child, idx) => {
            let presentCount = 0;
            let absentCount = 0;

            return (
              <View
                key={child.childId}
                style={idx % 2 === 1 ? s.tableRowAlt : s.tableRow}
              >
                <Text style={localStyles.nameCell}>
                  {child.childName}
                </Text>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                  (day) => {
                    const status = child.days[day] || "N";
                    if (status === "P") presentCount++;
                    if (status === "A") absentCount++;

                    return (
                      <View
                        key={day}
                        style={{
                          width: 20,
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 1,
                        }}
                      >
                        <Text
                          style={[
                            localStyles.dayCell,
                            {
                              backgroundColor:
                                STATUS_COLORS[status] || STATUS_COLORS.N,
                            },
                          ]}
                        >
                          {status}
                        </Text>
                      </View>
                    );
                  },
                )}
                <Text style={localStyles.statsCell}>{presentCount}</Text>
                <Text style={localStyles.statsCell}>{absentCount}</Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <Text style={s.footer}>
          Garderie - Monthly Attendance Report - {monthName} {year} -
          Generated on {new Date().toLocaleDateString("en-GB")}
        </Text>
      </Page>
    </Document>
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get("month") || "") || new Date().getMonth() + 1;
    const year = parseInt(url.searchParams.get("year") || "") || new Date().getFullYear();
    const branchId = url.searchParams.get("branch") || "";
    const classId = url.searchParams.get("class") || "";

    if (!branchId) {
      return NextResponse.json(
        { error: "Branch is required" },
        { status: 400 },
      );
    }

    // Get branch info
    const branch = await db.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 },
      );
    }

    // Get class info if provided
    let className: string | undefined;
    if (classId) {
      const cls = await db.class.findUnique({
        where: { id: classId },
      });
      className = cls?.name;
    }

    // Calculate days in month and weekends
    const daysInMonth = new Date(year, month, 0).getDate();
    const weekends = new Set<number>();
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(year, month - 1, d).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekends.add(d);
      }
    }

    // Get holidays for this month
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const holidayRecords = await db.holiday.findMany({
      where: {
        date: { gte: monthStart, lte: monthEnd },
        OR: [
          { branchId: branchId },
          { branchId: null },
        ],
      },
    });
    const holidays = new Set(
      holidayRecords.map((h) => new Date(h.date).getDate()),
    );

    // Get children for this branch/class
    const childWhere: { branchId: string; isActive: boolean; classId?: string } = {
      branchId,
      isActive: true,
    };
    if (classId) {
      childWhere.classId = classId;
    }

    const children = await db.child.findMany({
      where: childWhere,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    // Get daily reports for this month
    const dailyReports = await db.dailyReport.findMany({
      where: {
        childId: { in: children.map((c) => c.id) },
        reportDate: { gte: monthStart, lte: monthEnd },
        status: "SUBMITTED",
      },
    });

    // Get absence reports for this month
    const absenceReports = await db.absenceReport.findMany({
      where: {
        childId: { in: children.map((c) => c.id) },
        date: { gte: monthStart, lte: monthEnd },
      },
    });

    // Build attendance data
    const dailyReportMap = new Map<string, Set<number>>();
    for (const dr of dailyReports) {
      const key = dr.childId;
      if (!dailyReportMap.has(key)) dailyReportMap.set(key, new Set());
      dailyReportMap.get(key)!.add(new Date(dr.reportDate).getDate());
    }

    const absenceMap = new Map<string, Set<number>>();
    for (const ar of absenceReports) {
      const key = ar.childId;
      if (!absenceMap.has(key)) absenceMap.set(key, new Set());
      absenceMap.get(key)!.add(new Date(ar.date).getDate());
    }

    const attendance: AttendanceData[] = children.map((child) => {
      const presentDays = dailyReportMap.get(child.id) || new Set();
      const absentDays = absenceMap.get(child.id) || new Set();

      const days: Record<number, "P" | "A" | "W" | "H" | "N"> = {};
      for (let d = 1; d <= daysInMonth; d++) {
        if (weekends.has(d)) {
          days[d] = "W";
        } else if (holidays.has(d)) {
          days[d] = "H";
        } else if (absentDays.has(d)) {
          days[d] = "A";
        } else if (presentDays.has(d)) {
          days[d] = "P";
        } else {
          days[d] = "N";
        }
      }

      return {
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        days,
      };
    });

    const buffer = await renderToBuffer(
      <MonthlyReportPdf
        month={month}
        year={year}
        branchName={branch.name}
        className={className}
        daysInMonth={daysInMonth}
        weekends={weekends}
        holidays={holidays}
        attendance={attendance}
      />,
    );

    const monthName = new Date(year, month - 1).toLocaleString("en-US", {
      month: "long",
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="attendance-${monthName}-${year}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Monthly report PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
