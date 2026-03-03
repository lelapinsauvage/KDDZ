"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Table2, GitBranchPlus } from "lucide-react";
import { VaccinationsClient } from "./vaccinations-client";
import { VaccinationTimelineClient } from "./vaccination-timeline-client";

interface VaccinationRow {
  id: string;
  childId: string;
  childName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  nationality: string;
  gender: string | null;
  vaccine: string;
  dateGiven: string | null;
  nextDue: string | null;
  notes: string;
  vacStatus: "Up to date" | "Overdue" | "Upcoming";
  branchId: string;
  branchName: string;
  className: string;
}

interface ChildInfo {
  id: string;
  name: string;
  dob: string | null;
  branchId: string;
  branchName: string;
}

interface VaccinationsPageClientProps {
  vaccinations: VaccinationRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
  childrenList: ChildInfo[];
}

export function VaccinationsPageClient({
  vaccinations,
  total,
  branches,
  childrenList: children,
}: VaccinationsPageClientProps) {
  const [tab, setTab] = useState("records");

  return (
    <>
      <PageHeader
        title="Vaccination Records"
        breadcrumbs={[
          { label: "Health", href: "/medical/general" },
          { label: "Vaccinations" },
        ]}
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/medical/vaccinations/new">
              <Plus className="mr-1 size-4" />
              Add New
            </Link>
          </Button>
        }
      />
      <div className="p-4 md:p-6 space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="records" className="gap-1.5">
              <Table2 className="size-3.5" />
              Records
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5">
              <GitBranchPlus className="size-3.5" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="mt-4">
            <VaccinationsRecordsTab
              vaccinations={vaccinations}
              total={total}
              branches={branches}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <VaccinationTimelineClient
              vaccinations={vaccinations}
              childrenList={children}
              branches={branches}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// Inline wrapper that uses VaccinationsClient without its own PageHeader
function VaccinationsRecordsTab({
  vaccinations,
  total,
  branches,
}: {
  vaccinations: VaccinationRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
}) {
  return <VaccinationsClient vaccinations={vaccinations} total={total} branches={branches} hideHeader />;
}
