import { getRegions } from "@/lib/actions/settings";
import ZonesClient from "./zones-client";

interface ProvinceData {
  id: string;
  name: string;
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

  // Map provinces to zones with total region count (sum of all districts' regions)
  const zones = provinces.map((p) => ({
    id: p.id,
    name: p.name,
    regionCount: p.districts.reduce((sum, d) => sum + d._count.regions, 0),
  }));

  return <ZonesClient initialZones={zones} />;
}
