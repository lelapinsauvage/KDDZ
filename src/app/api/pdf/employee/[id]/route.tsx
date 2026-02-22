import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  pdfStyles as s,
  formatDate,
  val,
} from "@/lib/pdf-styles";

// ─────────────────────────────────────────────
// Employee / Teacher Profile PDF
// ─────────────────────────────────────────────

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value}</Text>
    </View>
  );
}

interface EmployeePdfProps {
  employee: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    nationality?: string | null;
    dateOfBirth?: Date | null;
    hireDate?: Date | null;
    specialization?: string | null;
    isActive: boolean;
    licenseNumber?: string | null;
    branch: { name: string };
    addresses: Array<{
      street?: string | null;
      city?: string | null;
      region?: string | null;
    }>;
  };
  employeeType: string;
}

function EmployeeProfilePdf({ employee, employeeType }: EmployeePdfProps) {
  const typeLabel =
    employeeType.charAt(0).toUpperCase() + employeeType.slice(1);
  const address = employee.addresses[0];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Letterhead */}
        <View style={s.letterhead}>
          <View>
            <Text style={s.letterheadTitle}>Garderie</Text>
            <Text style={s.letterheadSubtitle}>
              {typeLabel} Profile
            </Text>
          </View>
          <View>
            <Text style={s.letterheadDate}>
              Date: {new Date().toLocaleDateString("en-GB")}
            </Text>
            <Text style={s.letterheadDate}>
              Branch: {employee.branch.name}
            </Text>
          </View>
        </View>

        {/* Name */}
        <Text style={s.title}>
          {employee.firstName} {employee.lastName}
        </Text>
        <Text style={s.subtitle}>
          {typeLabel} — {employee.isActive ? "Active" : "Inactive"}
        </Text>

        {/* Personal Information */}
        <Text style={s.sectionTitle}>Personal Information</Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            <FieldRow label="First Name" value={val(employee.firstName)} />
            <FieldRow label="Last Name" value={val(employee.lastName)} />
            <FieldRow label="Email" value={val(employee.email)} />
            <FieldRow label="Phone" value={val(employee.phone)} />
            <FieldRow label="Mobile" value={val(employee.mobile)} />
          </View>
          <View style={s.col}>
            <FieldRow label="Nationality" value={val(employee.nationality)} />
            <FieldRow
              label="Date of Birth"
              value={formatDate(employee.dateOfBirth)}
            />
            <FieldRow label="Hire Date" value={formatDate(employee.hireDate)} />
            <FieldRow
              label="Specialization"
              value={val(employee.specialization)}
            />
            {employee.licenseNumber && (
              <FieldRow
                label="License Number"
                value={val(employee.licenseNumber)}
              />
            )}
          </View>
        </View>

        {/* Employment Details */}
        <Text style={s.sectionTitle}>Employment Details</Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            <FieldRow label="Branch" value={val(employee.branch.name)} />
            <FieldRow label="Role" value={typeLabel} />
          </View>
          <View style={s.col}>
            <FieldRow
              label="Status"
              value={employee.isActive ? "Active" : "Inactive"}
            />
          </View>
        </View>

        {/* Address */}
        {address && (
          <>
            <Text style={s.sectionTitle}>Address</Text>
            <FieldRow label="Street" value={val(address.street)} />
            <FieldRow label="City" value={val(address.city)} />
            <FieldRow label="Region" value={val(address.region)} />
          </>
        )}

        {/* Footer */}
        <Text style={s.footer}>
          Garderie - {typeLabel} Profile - Generated on{" "}
          {new Date().toLocaleDateString("en-GB")}
        </Text>
      </Page>
    </Document>
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "teacher";

    // Try each employee type
    type EmployeeResult = {
      firstName: string;
      lastName: string;
      email?: string | null;
      phone?: string | null;
      mobile?: string | null;
      nationality?: string | null;
      dateOfBirth?: Date | null;
      hireDate?: Date | null;
      specialization?: string | null;
      isActive: boolean;
      licenseNumber?: string | null;
      branch: { name: string };
      addresses: Array<{
        street?: string | null;
        city?: string | null;
        region?: string | null;
      }>;
    };

    let employee: EmployeeResult | null = null;
    let employeeType = type;

    if (type === "teacher") {
      employee = await db.teacher.findUnique({
        where: { id },
        include: { branch: true, addresses: true },
      });
    } else if (type === "nurse") {
      employee = await db.nurse.findUnique({
        where: { id },
        include: { branch: true, addresses: true },
      });
    } else if (type === "doctor") {
      employee = await db.doctor.findUnique({
        where: { id },
        include: { branch: true, addresses: true },
      });
    } else if (type === "manager") {
      employee = await db.manager.findUnique({
        where: { id },
        include: { branch: true, addresses: true },
      });
    }

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    const buffer = await renderToBuffer(
      <EmployeeProfilePdf
        employee={employee}
        employeeType={employeeType}
      />,
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${employeeType}-${employee.firstName}-${employee.lastName}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Employee PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
