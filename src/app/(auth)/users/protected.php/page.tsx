import type { Metadata } from "next";

import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Protected Content",
};

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
      {children}
    </div>
  );
}

function SecretBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mt-3 overflow-auto rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
      {children}
    </pre>
  );
}

export default async function LegacyProtectedPage() {
  const session = await auth();
  const role = session?.user?.role ?? null;
  const isSignedIn = Boolean(session?.user);
  const isAdmin = role === "ADMIN";
  const isSpecial = role === "MANAGER";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-2">
        <section>
          {isAdmin ? (
            <>
              <h1 className="text-2xl font-semibold text-slate-950">
                Admin only text <small className="text-base text-slate-500">User level: 1</small>
              </h1>
              <p className="mt-3 text-sm text-slate-700">
                You will only be able to see this content if you have an{" "}
                <span className="rounded-sm bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                  administrator
                </span>{" "}
                user level.
              </p>
              <SecretBlock>Super secret code that admin only can view</SecretBlock>
            </>
          ) : (
            <Warning>Only admins can view this content.</Warning>
          )}
        </section>

        <section>
          {isAdmin || isSpecial ? (
            <>
              <h1 className="text-2xl font-semibold text-slate-950">
                Why hello, special user!{" "}
                <small className="text-base text-slate-500">User level: 2</small>
              </h1>
              <p className="mt-3 text-sm text-slate-700">
                You will only be able to see this content if you have a{" "}
                <span className="rounded-sm bg-sky-100 px-1.5 py-0.5 text-xs font-semibold text-sky-700">
                  special
                </span>{" "}
                user level.
              </p>
            </>
          ) : (
            <Warning>Only admins or special users can view this content.</Warning>
          )}
        </section>

        <section>
          {isSignedIn ? (
            <>
              <h1 className="text-2xl font-semibold text-slate-950">
                All registered users{" "}
                <small className="text-base text-slate-500">User level: *</small>
              </h1>
              <p className="mt-3 text-sm text-slate-700">
                Any user level in the entire world can see this! All that matters is that
                you&apos;re logged in.
              </p>
              <SecretBlock>All signed in users view this</SecretBlock>
            </>
          ) : (
            <Warning>Only signed in users can view what&apos;s hidden here!</Warning>
          )}
        </section>

        <section>
          <h1 className="text-2xl font-semibold text-slate-950">
            Public content. <small className="text-base text-slate-500">No sign in required.</small>
          </h1>
          <p className="mt-3 text-sm text-slate-700">
            When visiting this page, anyone that is not signed in will be able to view
            your markup.
          </p>
          <SecretBlock>Not-so super secret code, let&apos;s let everyone view this</SecretBlock>
        </section>
      </div>
    </main>
  );
}
