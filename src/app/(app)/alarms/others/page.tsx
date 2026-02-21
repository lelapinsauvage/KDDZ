import { getAlarms } from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import { OtherAlarmsClient } from "./other-alarms-client";

export default async function OtherAlarmsPage() {
  const [alarmsResult, branchesResult] = await Promise.all([
    getAlarms({ type: "OTHER" }),
    getBranches(),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = (alarmsResult.success ? (alarmsResult.data as any) : { alarms: [] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAlarms = (rawData.alarms ?? []) as Array<any>;

  const serializedAlarms = rawAlarms.map((a) => ({
    id: a.id as string,
    message: (a.message ?? "—") as string,
    dueDate: a.dueDate ? (a.dueDate as Date).toISOString().split("T")[0] : "",
    isActive: a.isActive as boolean,
    branch: (a.branch?.name ?? "—") as string,
  }));

  return (
    <OtherAlarmsClient
      alarms={serializedAlarms}
      branches={branches}
    />
  );
}
