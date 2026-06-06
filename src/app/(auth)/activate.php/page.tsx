import { LegacyActivationPage } from "@/components/auth/legacy-activation-page";

interface PageProps {
  searchParams: Promise<{
    key?: string | string[];
    resend?: string | string[];
  }>;
}

export default function ActivatePage({ searchParams }: PageProps) {
  return <LegacyActivationPage searchParams={searchParams} />;
}
