import { getAlarms } from "@/lib/actions/alarms";
import { getBranches } from "@/lib/actions/branches";
import { ContractAlarmsClient } from "./contract-alarms-client";

export default async function ContractAlarmsPage() {
  const [alarmsResult, branchesResult] = await Promise.all([
    getAlarms({ type: "CONTRACT" }),
    getBranches(),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = (alarmsResult.success ? (alarmsResult.data as any) : { alarms: [] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAlarms = (rawData.alarms ?? []) as Array<any>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const serializedAlarms = rawAlarms.map((a) => {
    const dueDate = a.dueDate ? (a.dueDate as Date).toISOString().split("T")[0] : "";
    const dueDateObj = a.dueDate ? new Date(a.dueDate as Date) : null;
    let daysLeft = 0;
    let status: "Expired" | "Expiring Soon" | "Active" = "Active";

    if (dueDateObj) {
      daysLeft = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) {
        status = "Expired";
      } else if (daysLeft <= 30) {
        status = "Expiring Soon";
      }
    }

    return {
      id: a.id as string,
      message: (a.message ?? "—") as string,
      dueDate,
      daysLeft,
      status,
      branch: (a.branch?.name ?? "—") as string,
    };
  });

  return (
    <ContractAlarmsClient
      alarms={serializedAlarms}
      branches={branches}
    />
  );
}
