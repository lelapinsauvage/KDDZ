import { getRegions } from "@/lib/actions/settings";
import { RegionsClient } from "./regions-client";

export default async function RegionsManagementPage() {
  const result = await getRegions();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provinces = (result.success ? result.data : []) as Array<any>;

  // The data from getRegions() is already nested: provinces > districts > regions
  // Serialize to plain objects for client
  const serialized = provinces.map((prov) => ({
    id: prov.id as string,
    name: prov.name as string,
    districts: (prov.districts ?? []).map((dist: { id: string; name: string; provinceId: string; regions: Array<{ id: string; name: string; districtId: string; _count?: { childAddresses: number } }>; _count?: { regions: number } }) => ({
      id: dist.id,
      name: dist.name,
      provinceId: dist.provinceId,
      regions: (dist.regions ?? []).map((reg) => ({
        id: reg.id,
        name: reg.name,
        districtId: reg.districtId,
        _count: reg._count,
      })),
      _count: dist._count,
    })),
  }));

  return <RegionsClient provinces={serialized} />;
}
