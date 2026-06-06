import { auth } from "@/lib/auth";
import { getSettings, getRegions } from "@/lib/actions/settings";
import { getBranch, getBranches } from "@/lib/actions/branches";
import { getCompliance, getDocuments, getStaffForCompliance } from "@/lib/actions/branch-compliance";
import { PageHeader } from "@/components/layout/page-header";
import { BranchComplianceForm } from "@/components/branches/branch-compliance-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NurseryClient from "./nursery-client";

interface PageProps {
  searchParams: Promise<{ branch?: string }>;
}

export default async function NurseryInfoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const userBranchId = session?.user?.branchId ?? null;

  // If user has no branch, try to get first branch
  let branchId = params.branch?.trim() || userBranchId;
  if (!branchId) {
    const branchesResult = await getBranches();
    const branches = Array.isArray(branchesResult.data) ? branchesResult.data : [];
    if (branches.length > 0) {
      branchId = branches[0].id;
    }
  }

  const noBranchResult = Promise.resolve({ success: false, data: null } as const);

  // Fetch settings, compliance, and geographic data in parallel.
  const [
    settingsResult,
    regionsResult,
    branchResult,
    complianceResult,
    docsResult,
    staffResult,
  ] = await Promise.all([
    branchId ? getSettings(branchId) : Promise.resolve({ success: false } as const),
    getRegions(),
    branchId ? getBranch(branchId) : noBranchResult,
    branchId ? getCompliance(branchId) : noBranchResult,
    branchId ? getDocuments(branchId) : noBranchResult,
    branchId ? getStaffForCompliance(branchId) : noBranchResult,
  ]);

  const settings: Record<string, string> =
    settingsResult.success && settingsResult.data
      ? settingsResult.data as Record<string, string>
      : {};

  const provinces = Array.isArray(regionsResult.data) ? regionsResult.data : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branch = branchResult.success ? (branchResult.data as any) : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compliance = complianceResult.success ? (complianceResult.data as any) : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const documents = docsResult.success && Array.isArray(docsResult.data) ? (docsResult.data as any[]) : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const staff = staffResult.success && Array.isArray(staffResult.data) ? (staffResult.data as any[]) : [];

  return (
    <>
      <PageHeader
        title="Nursery Info"
        breadcrumbs={[
          { label: "Settings", href: "/settings/nursery" },
          { label: "Nursery Info" },
        ]}
      />

      <Tabs defaultValue="compliance" className="px-4 pt-4 md:px-6 md:pt-6">
        <TabsList>
          <TabsTrigger value="compliance">Government Compliance</TabsTrigger>
          <TabsTrigger value="operations">Operational Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="compliance" className="-mx-4 md:-mx-6">
          {branchId && branch ? (
            <BranchComplianceForm
              branchId={branchId}
              branchName={branch.name}
              themeColor={branch.themeColor}
              initialData={compliance}
              staff={staff}
              documents={documents}
            />
          ) : (
            <div className="p-4 md:p-6">
              <div className="rounded-sm border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                Select or create a branch before filling the government compliance form.
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="operations" className="-mx-4 md:-mx-6">
          <NurseryClient
            branchId={branchId ?? ""}
            initialSettings={settings}
            provinces={provinces}
            showHeader={false}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
