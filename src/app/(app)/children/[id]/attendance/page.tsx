import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getChildAttendanceMatrix } from "@/lib/actions/attendance";
import { AttendanceClient } from "./attendance-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChildAttendancePage({ params }: Props) {
  const { id } = await params;

  const child = await getChild(id);
  if (!child) {
    notFound();
  }

  const matrix = await getChildAttendanceMatrix(id);

  const childData = {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    photo: child.photo ?? null,
  };

  return (
    <AttendanceClient
      child={childData}
      matrix={matrix}
    />
  );
}
