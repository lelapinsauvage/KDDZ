import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legacy Home",
};

export default function LegacyUsersHomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
        Nothing to show
      </div>
    </div>
  );
}
