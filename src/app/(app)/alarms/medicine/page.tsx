import { getAlarms } from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import { MedicineAlarmsClient } from "./medicine-alarms-client";

export default async function MedicineAlarmsPage() {
  const [alarmsResult, branchesResult] = await Promise.all([
    getAlarms({ type: "MEDICINE" }),
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
    branch: (a.branch?.name ?? "—") as string,
    isActive: a.isActive as boolean,
  }));

  return (
    <MedicineAlarmsClient
      alarms={serializedAlarms}
      branches={branches}
    />
  );
}
