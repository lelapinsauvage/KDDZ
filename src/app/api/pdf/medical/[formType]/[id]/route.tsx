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
import type { MedicalFormType } from "@/generated/prisma/client";

// ─────────────────────────────────────────────
// Medical Form PDF
// ─────────────────────────────────────────────

const FORM_TYPE_MAP: Record<string, MedicalFormType> = {
  general: "GENERAL",
  conditions: "CONDITIONS",
  visits: "VISITS",
  vaccinations: "VACCINATIONS",
  accidents: "ACCIDENTS",
};

const FORM_TITLES: Record<string, string> = {
  GENERAL: "General Medical Information",
  CONDITIONS: "Health Conditions Report",
  VISITS: "Medical Visits Record",
  VACCINATIONS: "Vaccination Record",
  ACCIDENTS: "Accident Report",
};

// Fields to display for each form type (from the data JSON)
const FORM_FIELDS: Record<string, Array<{ key: string; label: string }>> = {
  GENERAL: [
    { key: "doctor", label: "Doctor Name" },
    { key: "doctorPhone", label: "Doctor Phone" },
    { key: "hospital", label: "Hospital" },
    { key: "hospitalPhone", label: "Hospital Phone" },
    { key: "bloodType", label: "Blood Type" },
    { key: "allergies", label: "Allergies" },
    { key: "medications", label: "Current Medications" },
    { key: "chronicConditions", label: "Chronic Conditions" },
    { key: "specialNeeds", label: "Special Needs" },
    { key: "hasInsurance", label: "Has Insurance" },
    { key: "insuranceCompany", label: "Insurance Company" },
    { key: "insuranceNumber", label: "Insurance Number" },
    { key: "insuranceExpiry", label: "Insurance Expiry" },
    { key: "emergencyContact", label: "Emergency Contact" },
    { key: "emergencyPhone", label: "Emergency Phone" },
    { key: "notes", label: "Notes" },
  ],
  CONDITIONS: [
    { key: "condition", label: "Condition" },
    { key: "diagnosedDate", label: "Diagnosed Date" },
    { key: "severity", label: "Severity" },
    { key: "treatment", label: "Treatment" },
    { key: "medication", label: "Medication" },
    { key: "doctor", label: "Doctor" },
    { key: "hospital", label: "Hospital" },
    { key: "notes", label: "Notes" },
  ],
  VISITS: [
    { key: "visitDate", label: "Visit Date" },
    { key: "doctor", label: "Doctor" },
    { key: "hospital", label: "Hospital" },
    { key: "reason", label: "Reason" },
    { key: "diagnosis", label: "Diagnosis" },
    { key: "treatment", label: "Treatment" },
    { key: "medication", label: "Medication" },
    { key: "followUpDate", label: "Follow-up Date" },
    { key: "notes", label: "Notes" },
  ],
  VACCINATIONS: [
    { key: "vaccineName", label: "Vaccine Name" },
    { key: "dateGiven", label: "Date Given" },
    { key: "nextDueDate", label: "Next Due Date" },
    { key: "batchNumber", label: "Batch Number" },
    { key: "doctor", label: "Doctor" },
    { key: "hospital", label: "Hospital / Clinic" },
    { key: "notes", label: "Notes" },
  ],
  ACCIDENTS: [
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "cause", label: "Cause" },
    { key: "place", label: "Place" },
    { key: "specificArea", label: "Specific Area" },
    { key: "firstAid", label: "First Aid Given" },
    { key: "teacher", label: "Teacher" },
    { key: "hospital", label: "Hospital" },
    { key: "treatment", label: "Treatment" },
    { key: "parentNotified", label: "Parent Notified" },
    { key: "notes", label: "Notes" },
  ],
};

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value}</Text>
    </View>
  );
}

interface MedicalFormPdfProps {
  form: {
    formType: string;
    status: string;
    data: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
    child: {
      firstName: string;
      lastName: string;
      dateOfBirth?: Date | null;
      branch: { name: string };
    };
    entries: Array<{
      field: string;
      value?: string | null;
    }>;
  };
}

function MedicalFormPdf({ form }: MedicalFormPdfProps) {
  const formTitle =
    FORM_TITLES[form.formType] || "Medical Form";
  const fields = FORM_FIELDS[form.formType] || [];
  const data = (form.data || {}) as Record<string, unknown>;

  // Merge entry data into data for display
  for (const entry of form.entries) {
    if (!(entry.field in data) && entry.value) {
      data[entry.field] = entry.value;
    }
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Letterhead */}
        <View style={s.letterhead}>
          <View>
            <Text style={s.letterheadTitle}>Garderie</Text>
            <Text style={s.letterheadSubtitle}>{formTitle}</Text>
          </View>
          <View>
            <Text style={s.letterheadDate}>
              Date: {new Date().toLocaleDateString("en-GB")}
            </Text>
            <Text style={s.letterheadDate}>
              Branch: {form.child.branch.name}
            </Text>
          </View>
        </View>

        {/* Child Info */}
        <Text style={s.sectionTitle}>Child Information</Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            <FieldRow
              label="Child Name"
              value={`${form.child.firstName} ${form.child.lastName}`}
            />
            <FieldRow
              label="Date of Birth"
              value={formatDate(form.child.dateOfBirth)}
            />
          </View>
          <View style={s.col}>
            <FieldRow label="Status" value={form.status} />
            <FieldRow
              label="Created"
              value={formatDate(form.createdAt)}
            />
          </View>
        </View>

        {/* Form Data */}
        <Text style={s.sectionTitle}>{formTitle}</Text>
        {fields.map((field) => {
          const value = data[field.key];
          const displayValue =
            typeof value === "boolean"
              ? value
                ? "Yes"
                : "No"
              : val(value);
          return (
            <FieldRow
              key={field.key}
              label={field.label}
              value={displayValue}
            />
          );
        })}

        {/* Additional entries not in the field list */}
        {form.entries
          .filter(
            (e) =>
              !fields.some((f) => f.key === e.field) && e.value,
          )
          .map((entry, i) => (
            <FieldRow
              key={i}
              label={entry.field}
              value={val(entry.value)}
            />
          ))}

        {/* Footer */}
        <Text style={s.footer}>
          Garderie - {formTitle} - Generated on{" "}
          {new Date().toLocaleDateString("en-GB")}
        </Text>
      </Page>
    </Document>
  );
}

export async function GET(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ formType: string; id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { formType: formTypeSlug, id } = await params;

    const formType = FORM_TYPE_MAP[formTypeSlug];
    if (!formType) {
      return NextResponse.json(
        { error: "Invalid form type" },
        { status: 400 },
      );
    }

    const form = await db.medicalForm.findUnique({
      where: { id },
      include: {
        child: {
          include: { branch: true },
        },
        entries: true,
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Medical form not found" },
        { status: 404 },
      );
    }

    if (form.formType !== formType) {
      return NextResponse.json(
        { error: "Form type mismatch" },
        { status: 400 },
      );
    }

    const pdfData = {
      ...form,
      data: form.data as Record<string, unknown> | null,
    };

    const buffer = await renderToBuffer(
      <MedicalFormPdf form={pdfData} />,
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="medical-${formTypeSlug}-${form.child.firstName}-${form.child.lastName}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Medical PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
