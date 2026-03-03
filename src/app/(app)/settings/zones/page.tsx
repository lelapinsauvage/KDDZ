import { getRegions } from "@/lib/actions/settings";
import { ZonesClient } from "./zones-client";

interface ProvinceData {
  id: string;
  name: string;
  referenceNumber: string | null;
  createdAt: string;
  districts: {
    id: string;
    name: string;
    regions: { id: string; name: string }[];
    _count: { regions: number };
  }[];
}

export default async function ZonesManagementPage() {
  const result = await getRegions();
  const provinces: ProvinceData[] = Array.isArray(result.data) ? result.data : [];

  const zones = provinces.map((p) => ({
    id: p.id,
    name: p.name,
    referenceNumber: p.referenceNumber ?? "",
    createdAt: new Date(p.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    regionCount: p.districts.reduce((sum, d) => sum + d._count.regions, 0),
  }));

  return <ZonesClient initialZones={zones} />;
}
