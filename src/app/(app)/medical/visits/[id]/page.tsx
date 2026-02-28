import { notFound } from "next/navigation";
import { getMedicalForm } from "@/lib/actions/medical";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import { VisitDetailClient } from "./visit-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

const EMPTY_FORM = {
  childId: "",
  visitDate: new Date().toISOString().split("T")[0],
  doctor: "",
  // Vitals
  heightCm: "",
  weightKg: "",
  bloodPressure: "",
  vitalsNotes: "",
  // Eyes
  withGlasses: false,
  leftEye: "",
  rightEye: "",
  crookedEyes: "",
  eyesNotes: "",
  // Ears
  waxLeft: "",
  waxRight: "",
  drumLeft: "",
  drumRight: "",
  hearingLeft: "",
  hearingRight: "",
  earsNotes: "",
  // Systems
  noseThroat: "",
  thyroid: "",
  lymphNodes: "",
  heartArterial: "",
  respiratory: "",
  motorSystem: "",
  abdomenGenitals: "",
  systemsNotes: "",
  // Skin / Hair / Nails
  liceLupus: "",
  dermatitis: "",
  skinAllergy: "",
  hair: "",
  nails: "",
  skinNotes: "",
};

export default async function VisitDetailPage({ params }: PageProps) {
  const { id } = await params;
  const isNew = id === "new";
  const { organizationId: orgId } = await requireOrg();

  const children = await db.child.findMany({
    where: { isActive: true, branch: { organizationId: orgId } },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const childOptions = children.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }));

  if (isNew) {
    return (
      <VisitDetailClient
        isNew
        formId={null}
        initialData={EMPTY_FORM}
        status="DRAFT"
        childrenList={childOptions}
      />
    );
  }

  const result = await getMedicalForm(id);

  if ("error" in result && result.error) {
    notFound();
  }

  const form = result.form!;
  const data = (form.data ?? {}) as Record<string, unknown>;

  const str = (key: string) => (data[key] as string) ?? "";
  const bool = (key: string) => (data[key] as boolean) ?? false;

  return (
    <VisitDetailClient
      isNew={false}
      formId={form.id}
      initialData={{
        childId: form.childId,
        visitDate: str("visitDate") || form.createdAt.toISOString().split("T")[0],
        doctor: str("doctor"),
        // Vitals
        heightCm: str("heightCm"),
        weightKg: str("weightKg"),
        bloodPressure: str("bloodPressure"),
        vitalsNotes: str("vitalsNotes"),
        // Eyes
        withGlasses: bool("withGlasses"),
        leftEye: str("leftEye"),
        rightEye: str("rightEye"),
        crookedEyes: str("crookedEyes"),
        eyesNotes: str("eyesNotes"),
        // Ears
        waxLeft: str("waxLeft"),
        waxRight: str("waxRight"),
        drumLeft: str("drumLeft"),
        drumRight: str("drumRight"),
        hearingLeft: str("hearingLeft"),
        hearingRight: str("hearingRight"),
        earsNotes: str("earsNotes"),
        // Systems
        noseThroat: str("noseThroat"),
        thyroid: str("thyroid"),
        lymphNodes: str("lymphNodes"),
        heartArterial: str("heartArterial"),
        respiratory: str("respiratory"),
        motorSystem: str("motorSystem"),
        abdomenGenitals: str("abdomenGenitals"),
        systemsNotes: str("systemsNotes"),
        // Skin / Hair / Nails
        liceLupus: str("liceLupus"),
        dermatitis: str("dermatitis"),
        skinAllergy: str("skinAllergy"),
        hair: str("hair"),
        nails: str("nails"),
        skinNotes: str("skinNotes"),
      }}
      status={form.status as "DRAFT" | "SUBMITTED" | "REVIEWED"}
      childrenList={childOptions}
    />
  );
}
