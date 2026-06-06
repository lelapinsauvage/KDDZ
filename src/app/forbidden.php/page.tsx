import type { Metadata } from "next";

import { LegacyForbiddenScreen } from "@/components/legacy/legacy-forbidden-screen";

export const metadata: Metadata = {
  title: "Forbidden",
};

export default function LegacyForbiddenPage() {
  return <LegacyForbiddenScreen />;
}
