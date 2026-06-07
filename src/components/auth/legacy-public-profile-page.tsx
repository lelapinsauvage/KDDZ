import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  getPublicLegacyProfile,
  type LegacyProfileFieldValue,
} from "@/lib/actions/profile";
import { auth } from "@/lib/auth";

interface LegacyPublicProfilePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  legacyPath: "/profile.php" | "/users/profile.php";
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function searchSuffix(params: Record<string, string | string[] | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item);
    } else if (value) {
      search.set(key, value);
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

function loginRedirect(
  path: string,
  params: Record<string, string | string[] | undefined>,
): never {
  redirect(`/login?callbackUrl=${encodeURIComponent(`${path}${searchSuffix(params)}`)}`);
}

function groupedFields(fields: LegacyProfileFieldValue[]) {
  const groups = new Map<string, LegacyProfileFieldValue[]>();
  for (const field of fields) {
    const values = groups.get(field.section) ?? [];
    values.push(field);
    groups.set(field.section, values);
  }
  return Array.from(groups.entries());
}

function displayFieldValue(field: LegacyProfileFieldValue) {
  if (field.fieldType === "checkbox") {
    return field.value === "1" ? "Yes" : "No";
  }
  return field.value || "Not set";
}

export async function LegacyPublicProfilePage({
  searchParams,
  legacyPath,
}: LegacyPublicProfilePageProps) {
  const params = await searchParams;
  const session = await auth();
  const key = firstParam(params.key);
  const uid = firstParam(params.uid);

  if (key) {
    if (session?.user) redirect(`/profile${searchSuffix(params)}`);
    loginRedirect(legacyPath, params);
  }

  if (!uid) {
    if (session?.user) redirect(`/profile${searchSuffix(params)}`);
    loginRedirect(legacyPath, params);
  }

  const result = await getPublicLegacyProfile(uid);
  const profile = result.data;
  const title = profile
    ? `${profile.username} (${profile.name})`
    : "Profile unavailable";

  return (
    <main className="min-h-screen bg-[#F7F8FA] p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <a
              href="/login"
              className="text-sm font-medium text-[#0B7464] underline-offset-4 hover:underline"
            >
              KiddzOnline
            </a>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1A1D23]">
              {title}
            </h1>
          </div>
          {profile ? (
            <Badge variant="outline">User {profile.legacyUserId}</Badge>
          ) : null}
        </div>

        {!result.success || !profile ? (
          <section className="rounded-sm border border-[#f0c1ba] bg-white p-6 text-sm text-[#9f2f22] shadow-sm">
            {result.error ?? "Sorry, that user does not exist."}
          </section>
        ) : (
          <div className="space-y-4">
            {groupedFields(profile.profileFields).length ? (
              groupedFields(profile.profileFields).map(([section, fields]) => (
                <section
                  key={section}
                  className="rounded-sm border border-[#E2E5E9] bg-white p-5 shadow-sm"
                >
                  <h2 className="mb-4 text-base font-semibold text-[#1A1D23]">
                    {section}
                  </h2>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {fields.map((field) => (
                      <div
                        key={field.fieldLegacyId}
                        className={field.fieldType === "textarea" ? "sm:col-span-2" : ""}
                      >
                        <dt className="text-xs font-semibold uppercase text-[#6B7280]">
                          {field.label}
                        </dt>
                        <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-[#1A1D23]">
                          {displayFieldValue(field)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))
            ) : (
              <section className="rounded-sm border border-[#E2E5E9] bg-white p-6 text-sm text-[#6B7280] shadow-sm">
                No profile fields are available.
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
