import { notFound } from "next/navigation";
import { getEmployee } from "@/lib/actions/employees";
import { TeacherDetailClient } from "./teacher-detail-client";

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

export default async function TeacherDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getEmployee("teacher", id);

  if (!result.success || !result.data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teacher = serializeDates(result.data as Record<string, unknown>) as any;

  return <TeacherDetailClient teacher={teacher} />;
}
