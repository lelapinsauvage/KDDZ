import { getUpcomingBirthdays } from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import { BirthdaysClient } from "./birthdays-client";

export default async function BirthdayAlarmsPage() {
  const [birthdaysResult, branchesResult] = await Promise.all([
    getUpcomingBirthdays(),
    getBranches(),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawBirthdays = (birthdaysResult.success ? birthdaysResult.data : []) as Array<any>;

  const serializedBirthdays = rawBirthdays.map((b) => ({
    id: b.child.id as string,
    childName: `${b.child.firstName} ${b.child.lastName}` as string,
    branchId: b.child.branchId as string,
    dateOfBirth: b.child.dateOfBirth
      ? (b.child.dateOfBirth as Date).toISOString().split("T")[0]
      : "",
    age: b.age as number,
    daysUntil: b.daysUntil as number,
    branch: (b.child.branch?.name ?? "—") as string,
    className: (b.child.class?.name ?? "—") as string,
  }));

  return (
    <BirthdaysClient
      birthdays={serializedBirthdays}
      branches={branches}
    />
  );
}
