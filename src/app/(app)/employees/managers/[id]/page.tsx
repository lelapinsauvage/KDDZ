import { notFound } from "next/navigation";
import { getEmployee } from "@/lib/actions/employees";
import { getBranch } from "@/lib/actions/branches";
import { ManagerDetailClient } from "./manager-detail-client";

function serializeDates(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = serializeDates(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? serializeDates(item as Record<string, unknown>)
          : item instanceof Date
            ? item.toISOString()
            : item
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

export default async function ManagerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getEmployee("manager", id);

  if (!result.success || !result.data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const manager = serializeDates(result.data as Record<string, unknown>) as any;

  // Fetch branch stats for the manager's branch
  const branchResult = await getBranch(manager.branch.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branchData = branchResult.data as any;
  const counts = branchData?._count ?? {};

  const branchStats = [
    { label: "Total Children", value: String(counts.children ?? 0) },
    { label: "Active Classes", value: String(counts.classes ?? 0) },
    { label: "Teachers", value: String(counts.teachers ?? 0) },
    { label: "Nurses", value: String(counts.nurses ?? 0) },
    { label: "Doctors", value: String(counts.doctors ?? 0) },
    { label: "Managers", value: String(counts.managers ?? 0) },
  ];

  return <ManagerDetailClient manager={manager} branchStats={branchStats} />;
}
