import { getRegions } from "@/lib/actions/settings";
import AreasClient from "./areas-client";

interface ProvinceData {
  id: string;
  name: string;
  districts: {
    id: string;
    name: string;
    provinceId: string;
    regions: { id: string; name: string }[];
    _count: { regions: number };
  }[];
}

export default async function AreasManagementPage() {
  const result = await getRegions();
  const provinces: ProvinceData[] = Array.isArray(result.data) ? result.data : [];

  // Build zone options from provinces
  const zoneOptions = provinces.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  // Build areas from districts, referencing their parent province as zone
  const areas = provinces.flatMap((province) =>
    province.districts.map((district) => ({
      id: district.id,
      name: district.name,
      zone: province.name,
      zoneId: province.id,
    }))
  );

  return <AreasClient initialAreas={areas} zoneOptions={zoneOptions} />;
}
