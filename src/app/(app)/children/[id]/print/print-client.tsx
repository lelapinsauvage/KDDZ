"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { format } from "date-fns";

interface ParentInfo {
  type: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  relation: string;
}

interface RelativeInfo {
  name: string | null;
  phone: string | null;
  relation: string;
}

interface VaccinationInfo {
  name: string;
  dateGiven: string | null;
  nextDueDate: string | null;
}

interface ChildData {
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  bloodType: string | null;
  allergies: string | null;
  className: string | null;
  branchName: string | null;
  isActive: boolean;
  busAttendance: string | null;
  lunchIncluded: boolean;
  parents: ParentInfo[];
  relatives: RelativeInfo[];
  vaccinations: VaccinationInfo[];
}

function formatGender(g: string): string {
  return g === "MALE" ? "Boy" : g === "FEMALE" ? "Girl" : g;
}

export function ChildPrintClient({ child }: { child: ChildData }) {
  const fullName = `${child.firstName} ${child.lastName}`;
  const allContacts = [
    ...child.parents.map((p) => ({
      name: p.name,
      phone: p.phone,
      email: p.email,
      relation: p.type,
      isEmergency: true,
    })),
    ...child.relatives.map((r) => ({
      name: r.name,
      phone: r.phone,
      email: null as string | null,
      relation: r.relation,
      isEmergency: true,
    })),
  ];

  return (
    <>
      {/* Screen-only header */}
      <div className="print:hidden">
        <PageHeader
          title={`Print — ${fullName}`}
          breadcrumbs={[
            { label: "Children", href: "/children" },
            { label: fullName, href: `/children/${encodeURIComponent(fullName)}` },
            { label: "Print" },
          ]}
          actions={
            <Button
              className="bg-primary text-white hover:bg-primary/90"
              onClick={() => window.print()}
            >
              <Printer className="mr-1 size-4" />
              Print
            </Button>
          }
        />
      </div>

      {/* Printable content */}
      <div className="mx-auto max-w-2xl p-6 print:max-w-none print:p-0 print:text-black">
        {/* Nursery branding */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground print:text-black">
            KiddzOnline
          </h1>
          <p className="text-sm text-muted-foreground print:text-gray-600">
            Child Profile
          </p>
        </div>

        {/* Basic Info */}
        <div className="mb-6 rounded-lg border border-border p-4 print:border-gray-300 print:rounded-none" style={{ breakInside: "avoid" }}>
          <h2 className="mb-3 text-lg font-bold">{fullName}</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            {child.dateOfBirth && (
              <div>
                <span className="font-semibold">Date of Birth:</span>{" "}
                {format(new Date(child.dateOfBirth), "MMMM d, yyyy")}
              </div>
            )}
            {child.gender && (
              <div>
                <span className="font-semibold">Gender:</span>{" "}
                {formatGender(child.gender)}
              </div>
            )}
            {child.nationality && (
              <div>
                <span className="font-semibold">Nationality:</span>{" "}
                {child.nationality}
              </div>
            )}
            {child.bloodType && (
              <div>
                <span className="font-semibold">Blood Type:</span>{" "}
                <span className="font-bold text-red-600">{child.bloodType}</span>
              </div>
            )}
            {child.className && (
              <div>
                <span className="font-semibold">Class:</span>{" "}
                {child.className}
              </div>
            )}
            {child.branchName && (
              <div>
                <span className="font-semibold">Branch:</span>{" "}
                {child.branchName}
              </div>
            )}
            <div>
              <span className="font-semibold">Status:</span>{" "}
              {child.isActive ? "Active" : "Inactive"}
            </div>
            <div>
              <span className="font-semibold">Bus:</span>{" "}
              {child.busAttendance && child.busAttendance !== "false" ? child.busAttendance : "No"}
            </div>
            <div>
              <span className="font-semibold">Lunch Included:</span>{" "}
              {child.lunchIncluded ? "Yes" : "No"}
            </div>
          </div>
        </div>

        {/* Allergies / Medical */}
        <div className="mb-5" style={{ breakInside: "avoid" }}>
          <h2 className="mb-2 border-b border-border pb-1 text-base font-bold print:border-gray-300">
            Medical Information
          </h2>
          <div className="text-sm">
            {child.allergies ? (
              <div className="rounded border border-red-200 bg-red-50 p-3 print:bg-white print:border-gray-300">
                <span className="font-bold text-red-700 print:text-black">Allergies:</span>{" "}
                {child.allergies}
              </div>
            ) : (
              <p className="text-muted-foreground">No known allergies.</p>
            )}
          </div>
        </div>

        {/* Parent / Guardian Contacts */}
        {child.parents.length > 0 && (
          <div className="mb-5" style={{ breakInside: "avoid" }}>
            <h2 className="mb-2 border-b border-border pb-1 text-base font-bold print:border-gray-300">
              Parent / Guardian Contacts
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs font-semibold uppercase text-muted-foreground print:border-gray-200">
                  <th className="pb-1.5 pr-4">Relation</th>
                  <th className="pb-1.5 pr-4">Name</th>
                  <th className="pb-1.5 pr-4">Phone</th>
                  <th className="pb-1.5">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 print:divide-gray-200">
                {child.parents.map((p, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-4 font-medium capitalize">{p.type.toLowerCase()}</td>
                    <td className="py-1.5 pr-4">{p.name ?? "—"}</td>
                    <td className="py-1.5 pr-4">{p.phone ?? "—"}</td>
                    <td className="py-1.5">{p.email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Emergency Contacts (relatives) */}
        {child.relatives.length > 0 && (
          <div className="mb-5" style={{ breakInside: "avoid" }}>
            <h2 className="mb-2 border-b border-border pb-1 text-base font-bold print:border-gray-300">
              Emergency Contacts
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs font-semibold uppercase text-muted-foreground print:border-gray-200">
                  <th className="pb-1.5 pr-4">Relation</th>
                  <th className="pb-1.5 pr-4">Name</th>
                  <th className="pb-1.5">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 print:divide-gray-200">
                {child.relatives.map((r, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-4 font-medium capitalize">{r.relation.toLowerCase()}</td>
                    <td className="py-1.5 pr-4">{r.name ?? "—"}</td>
                    <td className="py-1.5">{r.phone ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* No contacts at all */}
        {allContacts.length === 0 && (
          <div className="mb-5">
            <h2 className="mb-2 border-b border-border pb-1 text-base font-bold print:border-gray-300">
              Contacts
            </h2>
            <p className="text-sm text-muted-foreground">No contacts on file.</p>
          </div>
        )}

        {/* Vaccinations */}
        <div className="mb-5" style={{ breakInside: "avoid" }}>
          <h2 className="mb-2 border-b border-border pb-1 text-base font-bold print:border-gray-300">
            Vaccination Records
          </h2>
          {child.vaccinations.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs font-semibold uppercase text-muted-foreground print:border-gray-200">
                  <th className="pb-1.5 pr-4">Vaccine</th>
                  <th className="pb-1.5 pr-4">Date Given</th>
                  <th className="pb-1.5">Next Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 print:divide-gray-200">
                {child.vaccinations.map((v, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-4 font-medium">{v.name}</td>
                    <td className="py-1.5 pr-4">{v.dateGiven ?? "—"}</td>
                    <td className="py-1.5">{v.nextDueDate ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">No vaccination records.</p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground print:border-gray-300 print:text-gray-500">
          <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>
      </div>
    </>
  );
}
