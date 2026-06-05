import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/skeleton";
import { getNewYearSetupData } from "@/lib/actions/new-year";
import { GraduationCap } from "lucide-react";
import { NewYearClient } from "./new-year-client";

export default async function NewYearPage() {
  const result = await getNewYearSetupData();

  if (!result.success || !result.data) {
    return (
      <>
        <PageHeader
          title="New Academic Year Setup"
          breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "New Academic Year" }]}
        />
        <div className="p-4 md:p-6">
          <EmptyState
            icon={GraduationCap}
            title="Unable to load setup"
            description={result.success ? "No setup data was returned" : result.error}
          />
        </div>
      </>
    );
  }

  return (
    <FadeIn>
      <NewYearClient setup={result.data} />
    </FadeIn>
  );
}
