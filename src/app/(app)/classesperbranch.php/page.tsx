import { notFound, redirect } from "next/navigation";
import { resolveLegacyBranchId } from "@/lib/legacy-branch";

interface PageProps {
  searchParams: Promise<{
    brid?: string | string[];
    ids?: string | string[];
    name?: string | string[];
    lname?: string | string[];
    language?: string | string[];
    dob?: string | string[];
    maxStudents?: string | string[];
    from?: string | string[];
    to?: string | string[];
    order_date_from?: string | string[];
    order_date_to?: string | string[];
    q?: string | string[];
  }>;
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function appendLegacyFilters(
  target: URLSearchParams,
  params: Awaited<PageProps["searchParams"]>,
) {
  const supported = [
    "ids",
    "name",
    "lname",
    "language",
    "dob",
    "maxStudents",
    "from",
    "to",
    "order_date_from",
    "order_date_to",
    "q",
  ] as const;

  for (const key of supported) {
    const value = firstParam(params[key])?.trim();
    if (value) target.set(key, value);
  }
}

export default async function LegacyClassesPerBranchRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const brid = firstParam(params.brid);

  if (!brid?.trim()) {
    redirect("/classes");
  }

  const branchId = await resolveLegacyBranchId(brid);
  if (!branchId) {
    notFound();
  }

  const target = new URLSearchParams();
  appendLegacyFilters(target, params);
  const suffix = target.toString();
  redirect(`/branches/${encodeURIComponent(branchId)}/classes${suffix ? `?${suffix}` : ""}`);
}
