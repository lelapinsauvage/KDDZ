import { getRegions } from "@/lib/actions/settings";
import AreasClient from "./areas-client";

interface ProvinceData {
  id: string;
  name: string;
  districts: {
    id: string;
    name: string;
    referenceNumber: string | null;
    provinceId: string;
    createdAt: string;
    regions: { id: string; name: string }[];
    _count: { regions: number };
  }[];
}

export default async function AreasManagementPage() {
  const result = await getRegions();
  const provinces: ProvinceData[] = Array.isArray(result.data) ? result.data : [];

  const zoneOptions = provinces.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  const areas = provinces.flatMap((province) =>
    province.districts.map((district) => ({
      id: district.id,
      name: district.name,
      referenceNumber: district.referenceNumber ?? "",
      zone: province.name,
      zoneId: province.id,
      createdAt: new Date(district.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    }))
  );

  return <AreasClient initialAreas={areas} zoneOptions={zoneOptions} />;
}
