import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  pdfStyles as s,
  formatDate,
  getAge,
  val,
} from "@/lib/pdf-styles";

// ─────────────────────────────────────────────
// Child Application Form PDF
// ─────────────────────────────────────────────

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value}</Text>
    </View>
  );
}

function ParentSection({
  title,
  parent,
}: {
  title: string;
  parent: {
    firstName?: string | null;
    lastName?: string | null;
    nationality?: string | null;
    phone?: string | null;
    mobile?: string | null;
    email?: string | null;
    profession?: string | null;
    workplace?: string | null;
    workPhone?: string | null;
    maritalStatus?: string | null;
    idNumber?: string | null;
  } | null;
}) {
  if (!parent) return null;
  return (
    <View>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.twoCol}>
        <View style={s.col}>
          <FieldRow label="First Name" value={val(parent.firstName)} />
          <FieldRow label="Last Name" value={val(parent.lastName)} />
          <FieldRow label="Nationality" value={val(parent.nationality)} />
          <FieldRow label="Phone" value={val(parent.phone)} />
          <FieldRow label="Mobile" value={val(parent.mobile)} />
          <FieldRow label="Email" value={val(parent.email)} />
        </View>
        <View style={s.col}>
          <FieldRow label="Profession" value={val(parent.profession)} />
          <FieldRow label="Workplace" value={val(parent.workplace)} />
          <FieldRow label="Work Phone" value={val(parent.workPhone)} />
          <FieldRow label="Marital Status" value={val(parent.maritalStatus)} />
          <FieldRow label="ID Number" value={val(parent.idNumber)} />
        </View>
      </View>
    </View>
  );
}

interface ChildPdfProps {
  child: {
    firstName: string;
    lastName: string;
    firstNameAr?: string | null;
    lastNameAr?: string | null;
    middleName?: string | null;
    dateOfBirth?: Date | null;
    placeOfBirth?: string | null;
    gender?: string | null;
    nationality?: string | null;
    religion?: string | null;
    idNumber?: string | null;
    bloodType?: string | null;
    allergies?: string | null;
    enrollmentDate?: Date | null;
    busAttendance: string | null;
    diaperType?: string | null;
    milkType?: string | null;
    milkPortions?: number | null;
    milkScoop?: number | null;
    milkTime1?: Date | null;
    milkTime2?: Date | null;
    milkTime3?: Date | null;
    lunchIncluded: boolean;
    sleepFrom?: Date | null;
    sleepTo?: Date | null;
    remarks?: string | null;
    language?: string | null;
    previousGarderie: boolean;
    previousGarderieName?: string | null;
    branch: { name: string };
    class?: { name: string } | null;
    schoolYear?: { label: string } | null;
    parents: Array<{
      type: string;
      firstName?: string | null;
      lastName?: string | null;
      nationality?: string | null;
      phone?: string | null;
      mobile?: string | null;
      email?: string | null;
      profession?: string | null;
      workplace?: string | null;
      workPhone?: string | null;
      maritalStatus?: string | null;
      idNumber?: string | null;
    }>;
    relatives: Array<{
      name: string;
      relation?: string | null;
      phone?: string | null;
      isAuthorized: boolean;
    }>;
    addresses: Array<{
      street?: string | null;
      building?: string | null;
      floor?: string | null;
      city?: string | null;
      region?: { name: string } | null;
    }>;
  };
}

function ChildApplicationPdf({ child }: ChildPdfProps) {
  const mother = child.parents.find((p) => p.type === "MOTHER") ?? null;
  const father = child.parents.find((p) => p.type === "FATHER") ?? null;
  const address = child.addresses[0];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Letterhead */}
        <View style={s.letterhead}>
          <View>
            <Text style={s.letterheadTitle}>Garderie</Text>
            <Text style={s.letterheadSubtitle}>
              Child Enrollment Application Form
            </Text>
          </View>
          <View>
            <Text style={s.letterheadDate}>
              Date: {new Date().toLocaleDateString("en-GB")}
            </Text>
            <Text style={s.letterheadDate}>
              Branch: {child.branch.name}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>
          {child.firstName} {child.middleName ? child.middleName + " " : ""}
          {child.lastName}
        </Text>
        {(child.firstNameAr || child.lastNameAr) && (
          <Text style={s.subtitle}>
            {val(child.firstNameAr)} {val(child.lastNameAr)}
          </Text>
        )}

        {/* Personal Information */}
        <Text style={s.sectionTitle}>Personal Information</Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            <FieldRow label="First Name" value={val(child.firstName)} />
            <FieldRow label="Middle Name" value={val(child.middleName)} />
            <FieldRow label="Last Name" value={val(child.lastName)} />
            <FieldRow
              label="Date of Birth"
              value={formatDate(child.dateOfBirth)}
            />
            <FieldRow label="Age" value={getAge(child.dateOfBirth)} />
            <FieldRow
              label="Place of Birth"
              value={val(child.placeOfBirth)}
            />
            <FieldRow label="Gender" value={val(child.gender)} />
          </View>
          <View style={s.col}>
            <FieldRow label="Nationality" value={val(child.nationality)} />
            <FieldRow label="Religion" value={val(child.religion)} />
            <FieldRow label="ID Number" value={val(child.idNumber)} />
            <FieldRow label="Blood Type" value={val(child.bloodType)} />
            <FieldRow label="Allergies" value={val(child.allergies)} />
            <FieldRow label="Language" value={val(child.language)} />
          </View>
        </View>

        {/* Enrollment Details */}
        <Text style={s.sectionTitle}>Enrollment Details</Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            <FieldRow label="Branch" value={val(child.branch.name)} />
            <FieldRow label="Class" value={val(child.class?.name)} />
            <FieldRow
              label="School Year"
              value={val(child.schoolYear?.label)}
            />
            <FieldRow
              label="Enrollment Date"
              value={formatDate(child.enrollmentDate)}
            />
          </View>
          <View style={s.col}>
            <FieldRow
              label="Bus Attendance"
              value={child.busAttendance && child.busAttendance !== "false" ? child.busAttendance : "No"}
            />
            <FieldRow
              label="Lunch Included"
              value={child.lunchIncluded ? "Yes" : "No"}
            />
            <FieldRow
              label="Previous Garderie"
              value={
                child.previousGarderie
                  ? val(child.previousGarderieName) || "Yes"
                  : "No"
              }
            />
          </View>
        </View>

        {/* Care Preferences */}
        <Text style={s.sectionTitle}>Care Preferences</Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            <FieldRow label="Diaper Type" value={val(child.diaperType)} />
            <FieldRow label="Milk Type" value={val(child.milkType)} />
            <FieldRow
              label="Milk Portions"
              value={val(child.milkPortions)}
            />
            <FieldRow label="Milk Scoop" value={val(child.milkScoop)} />
          </View>
          <View style={s.col}>
            <FieldRow
              label="Sleep From"
              value={
                child.sleepFrom
                  ? new Date(child.sleepFrom).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"
              }
            />
            <FieldRow
              label="Sleep To"
              value={
                child.sleepTo
                  ? new Date(child.sleepTo).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"
              }
            />
          </View>
        </View>

        {/* Address */}
        {address && (
          <>
            <Text style={s.sectionTitle}>Address</Text>
            <View style={s.twoCol}>
              <View style={s.col}>
                <FieldRow label="Street" value={val(address.street)} />
                <FieldRow label="Building" value={val(address.building)} />
              </View>
              <View style={s.col}>
                <FieldRow label="Floor" value={val(address.floor)} />
                <FieldRow label="City" value={val(address.city)} />
                <FieldRow
                  label="Region"
                  value={val(address.region?.name)}
                />
              </View>
            </View>
          </>
        )}

        {/* Parents */}
        <ParentSection title="Mother Information" parent={mother} />
        <ParentSection title="Father Information" parent={father} />

        {/* Relatives / Authorized Persons */}
        {child.relatives.length > 0 && (
          <>
            <Text style={s.sectionTitle}>
              Relatives / Authorized Persons
            </Text>
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { width: "30%" }]}>
                  Name
                </Text>
                <Text style={[s.tableHeaderCell, { width: "25%" }]}>
                  Relation
                </Text>
                <Text style={[s.tableHeaderCell, { width: "25%" }]}>
                  Phone
                </Text>
                <Text style={[s.tableHeaderCell, { width: "20%" }]}>
                  Authorized
                </Text>
              </View>
              {child.relatives.map((rel, i) => (
                <View
                  key={i}
                  style={i % 2 === 1 ? s.tableRowAlt : s.tableRow}
                >
                  <Text style={[s.tableCell, { width: "30%" }]}>
                    {val(rel.name)}
                  </Text>
                  <Text style={[s.tableCell, { width: "25%" }]}>
                    {val(rel.relation)}
                  </Text>
                  <Text style={[s.tableCell, { width: "25%" }]}>
                    {val(rel.phone)}
                  </Text>
                  <Text style={[s.tableCell, { width: "20%" }]}>
                    {rel.isAuthorized ? "Yes" : "No"}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Remarks */}
        {child.remarks && (
          <>
            <Text style={s.sectionTitle}>Remarks</Text>
            <Text style={{ fontSize: 9 }}>{child.remarks}</Text>
          </>
        )}

        {/* Footer */}
        <Text style={s.footer}>
          Garderie - Child Enrollment Form - Generated on{" "}
          {new Date().toLocaleDateString("en-GB")}
        </Text>
      </Page>
    </Document>
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const child = await db.child.findUnique({
      where: { id },
      include: {
        branch: true,
        class: true,
        schoolYear: true,
        parents: true,
        relatives: true,
        addresses: {
          include: { region: true },
        },
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: "Child not found" },
        { status: 404 },
      );
    }

    const buffer = await renderToBuffer(
      <ChildApplicationPdf child={child} />,
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="child-${child.firstName}-${child.lastName}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Child PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
