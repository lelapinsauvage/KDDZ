import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLegacySignupPageData } from "@/lib/actions/legacy-signup";
import { LegacySignupClient } from "./signup-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    source?: string | string[];
  }>;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const params = await searchParams;
  const result = await getLegacySignupPageData(firstParam(params.source));

  return (
    <LegacySignupClient
      data={
        result.data ?? {
          sourceDatabase: null,
          registrationsDisabled: true,
          useEmailAsUsername: false,
          requireActivation: false,
          captchaMode: "disableCaptcha",
          defaultLevelLabels: [],
          profileFields: [],
        }
      }
      error={result.success ? null : (result.error ?? null)}
    />
  );
}
