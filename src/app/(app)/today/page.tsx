import { getTodayData } from "@/lib/actions/today";
import { TodayClient } from "./today-client";

export default async function TodayPage() {
  const data = await getTodayData();
  return <TodayClient data={data} />;
}
