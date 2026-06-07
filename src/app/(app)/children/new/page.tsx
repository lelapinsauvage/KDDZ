import { PageHeader } from "@/components/layout/page-header";
import { ChildForm } from "@/components/children/child-form";
import { getLegacyChildActionPermissions } from "@/lib/legacy-child-action-permissions";
import { requireOrg } from "@/lib/require-org";
import { redirect } from "next/navigation";

export default async function NewChildPage() {
  const ctx = await requireOrg();
  const permissions = await getLegacyChildActionPermissions(ctx);
  if (!permissions.canAddChild) {
    redirect("/forbidden.php");
  }

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
      <div className="p-4 md:p-6">
        <ChildForm />
      </div>
    </>
  );
}
