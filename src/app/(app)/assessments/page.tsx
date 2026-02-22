import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ASSESSMENT_TYPE_NAMES } from "@/lib/assessment-types";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Calendar } from "lucide-react";

export default function AssessmentsPage() {
  const ageGroups = Object.entries(ASSESSMENT_TYPE_NAMES).map(([key, name]) => ({
    type: key,
    name,
  }));

  return (
    <>
      <PageHeader
        title="Assessments"
        breadcrumbs={[{ label: "Assessments" }]}
      />
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ageGroups.map((group) => (
            <Link key={group.type} href={`/assessments/${group.type}`}>
              <Card className="group cursor-pointer py-4 transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <ClipboardList className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary">
                      {group.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Age group assessment
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          <Link href="/assessments/dates">
            <Card className="group cursor-pointer py-4 transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                  <Calendar className="size-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary">
                    Assessment Dates
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Schedule and manage dates
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
}
