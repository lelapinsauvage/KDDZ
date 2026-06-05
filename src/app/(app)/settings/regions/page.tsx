import { getRegions } from "@/lib/actions/settings";
import { RegionsClient } from "./regions-client";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function RegionsManagementPage() {
  const result = await getRegions();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provinces = (result.success ? result.data : []) as Array<any>;

  const serialized = provinces.map((prov) => ({
    id: prov.id as string,
    name: prov.name as string,
    referenceNumber: (prov.referenceNumber ?? "") as string,
    createdAt: formatDate(prov.createdAt as Date | string),
    districts: (prov.districts ?? []).map((dist: { id: string; name: string; referenceNumber: string | null; provinceId: string; createdAt: Date | string; regions: Array<{ id: string; name: string; referenceNumber: string | null; districtId: string; createdAt: Date | string; _count?: { childAddresses: number } }>; _count?: { regions: number } }) => ({
      id: dist.id,
      name: dist.name,
      referenceNumber: dist.referenceNumber ?? "",
      provinceId: dist.provinceId,
      createdAt: formatDate(dist.createdAt),
      regions: (dist.regions ?? []).map((reg) => ({
        id: reg.id,
        name: reg.name,
        referenceNumber: reg.referenceNumber ?? "",
        districtId: reg.districtId,
        createdAt: formatDate(reg.createdAt),
        _count: reg._count,
      })),
      _count: dist._count,
    })),
  }));

  return <RegionsClient provinces={serialized} />;
}
