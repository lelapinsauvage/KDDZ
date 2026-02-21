import { PageHeader } from "@/components/layout/page-header";
import { ChildForm } from "@/components/children/child-form";

export default function NewChildPage() {
  return (
    <>
      <PageHeader
        title="New Child Enrollment"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: "New Enrollment" },
        ]}
      />
      <div className="p-6">
        <ChildForm />
      </div>
    </>
  );
}
