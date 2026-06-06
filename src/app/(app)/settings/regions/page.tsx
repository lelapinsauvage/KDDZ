import { getRegions } from "@/lib/actions/settings";
import { normalizeLegacySearchQuery } from "@/lib/legacy-query";
import { RegionsClient } from "./regions-client";

interface RegionData {
  id: string;
  name: string;
  referenceNumber: string | null;
  districtId: string;
  createdAt: string | Date;
}

interface DistrictData {
  id: string;
  name: string;
  regions: RegionData[];
}

interface ProvinceData {
  districts: DistrictData[];
}

function formatDisplayDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateFilterValue(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

export default async function RegionsManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const resultParams = await searchParams;
  const result = await getRegions();
  const provinces: ProvinceData[] = Array.isArray(result.data) ? result.data : [];

  const quadaaOptions = provinces.flatMap((province) =>
    province.districts.map((district) => ({
      id: district.id,
      name: district.name,
    })),
  );

  const regions = provinces.flatMap((province) =>
    province.districts.flatMap((district) =>
      district.regions.map((region) => ({
        id: region.id,
        name: region.name,
        referenceNumber: region.referenceNumber ?? "",
        quadaa: district.name,
        quadaaId: district.id,
        createdAt: formatDisplayDate(region.createdAt),
        createdDate: formatDateFilterValue(region.createdAt),
      })),
    ),
  );

  return (
    <RegionsClient
      initialRegions={regions}
      quadaaOptions={quadaaOptions}
      initialSearchQuery={normalizeLegacySearchQuery(resultParams.q)}
    />
  );
}
