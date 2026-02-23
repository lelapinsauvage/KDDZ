import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getChildMedicalTimeline } from "@/lib/actions/medical-timeline";
import { MedicalHub } from "@/components/medical/medical-hub";
import { PageHeader } from "@/components/layout/page-header";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChildMedicalPage({ params }: Props) {
  const { id } = await params;

  const child = await getChild(id);
  if (!child) {
    notFound();
  }

  const data = await getChildMedicalTimeline(id);

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} — Medical`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}` },
          { label: "Medical" },
        ]}
      />
      <MedicalHub data={data} childId={id} />
    </>
  );
}
