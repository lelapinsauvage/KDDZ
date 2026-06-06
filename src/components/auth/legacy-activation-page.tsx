import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type ActivationStatus =
  | "activated"
  | "incorrect"
  | "already"
  | "pending"
  | "resend-missing"
  | "resend-unavailable";

interface ActivationState {
  status: ActivationStatus;
  name?: string | null;
  address?: string;
  activationHref?: string;
}

interface LegacyActivationPageProps {
  searchParams: Promise<{
    key?: string | string[];
    resend?: string | string[];
  }>;
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function siteAddress() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "";
}

function adminAddress() {
  return process.env.LEGACY_ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "the site admin";
}

async function findPendingTokenForCurrentUser() {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) return null;

  return db.legacyAuthRecord.findFirst({
    where: {
      legacyTable: { in: ["login_confirm", "login_confirm_man"] },
      recordType: "new_user",
      OR: [
        ...(session.user.id ? [{ userId: session.user.id }] : []),
        ...(session.user.email ? [{ email: session.user.email }] : []),
      ],
    },
    select: {
      recordKey: true,
      email: true,
      username: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function activateByKey(key: string): Promise<ActivationState> {
  const token = key.trim();
  if (!token) return { status: "incorrect" };

  const record = await db.legacyAuthRecord.findFirst({
    where: {
      legacyTable: { in: ["login_confirm", "login_confirm_man"] },
      recordType: "new_user",
      recordKey: token,
    },
    select: {
      id: true,
      userId: true,
      email: true,
      username: true,
    },
  });

  if (!record) return { status: "incorrect" };

  const userFilters = [
    ...(record.userId ? [{ id: record.userId }] : []),
    ...(record.email ? [{ email: record.email }] : []),
  ];

  const user =
    userFilters.length > 0
      ? await db.user.findFirst({
          where: { OR: userFilters },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : null;

  await db.$transaction([
    ...(user
      ? [
          db.user.update({
            where: { id: user.id },
            data: {
              emailVerified: new Date(),
              isActive: true,
            },
          }),
        ]
      : []),
    db.legacyAuthRecord.update({
      where: { id: record.id },
      data: {
        recordType: "new_user_activated",
      },
    }),
  ]);

  return {
    status: "activated",
    name: user?.name ?? record.username,
    address: adminAddress(),
  };
}

async function signedInState(): Promise<ActivationState | null> {
  const pending = await findPendingTokenForCurrentUser();
  if (pending) {
    return {
      status: "pending",
      activationHref: pending.recordKey
        ? `/activate.php?key=${encodeURIComponent(pending.recordKey)}`
        : undefined,
    };
  }

  const session = await auth();
  if (!session?.user) return null;
  return { status: "already" };
}

async function resendState(): Promise<ActivationState | null> {
  const pending = await findPendingTokenForCurrentUser();
  if (!pending?.recordKey) {
    const session = await auth();
    return session?.user ? { status: "resend-missing", address: adminAddress() } : null;
  }

  const activationHref = `${siteAddress()}/activate.php?key=${encodeURIComponent(
    pending.recordKey,
  )}`;
  return {
    status: "resend-unavailable",
    activationHref,
  };
}

async function resolveActivationState({
  key,
  resend,
}: {
  key?: string;
  resend?: string;
}): Promise<ActivationState | null> {
  if (key) return activateByKey(key);
  if (resend === "1") return resendState();
  return signedInState();
}

function ActivationMessage({ state }: { state: ActivationState }) {
  if (state.status === "activated") {
    return (
      <>
        <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Your account has been activated!
        </div>
        <p className="text-sm text-muted-foreground">
          You can now see the default access granted to new users.
        </p>
        <p className="text-sm text-muted-foreground">
          If you require more access please contact the site admin at {state.address}.
        </p>
        <WhatNext />
      </>
    );
  }

  if (state.status === "incorrect") {
    return (
      <>
        <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Your activation link is incorrect.
        </div>
        <WhatNext />
      </>
    );
  }

  if (state.status === "already") {
    return (
      <>
        <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Your account has already been activated.
        </div>
        <WhatNext />
      </>
    );
  }

  if (state.status === "pending") {
    return (
      <>
        <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          You have not activated your account yet.
        </div>
        <WhatNext />
        <p className="text-sm text-muted-foreground">
          Please follow the link in your email to activate your account.
        </p>
        <p className="text-sm text-muted-foreground">
          Would you like us to{" "}
          <Link className="font-medium text-primary hover:underline" href="/activate.php?resend=1">
            resend
          </Link>{" "}
          the link?
        </p>
      </>
    );
  }

  if (state.status === "resend-missing") {
    return (
      <>
        <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          You do not have an activation key!
        </div>
        <p className="text-sm text-muted-foreground">
          Please contact an admin: {state.address}
        </p>
      </>
    );
  }

  return (
    <>
      <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
        Activation email delivery is not configured yet.
      </div>
      <p className="text-sm text-muted-foreground">
        Use your pending activation link directly:
      </p>
      {state.activationHref ? (
        <Link
          className="break-all text-sm font-medium text-primary hover:underline"
          href={state.activationHref}
        >
          {state.activationHref}
        </Link>
      ) : null}
    </>
  );
}

function WhatNext() {
  return (
    <div className="space-y-1">
      <h2 className="text-base font-semibold text-foreground">What to do now?</h2>
      <p className="text-sm text-muted-foreground">
        Go to the{" "}
        <Link className="font-medium text-primary hover:underline" href="/dashboard">
          homepage
        </Link>
      </p>
    </div>
  );
}

export async function LegacyActivationPage({
  searchParams,
}: LegacyActivationPageProps) {
  const params = await searchParams;
  const state = await resolveActivationState({
    key: firstParam(params.key),
    resend: firstParam(params.resend),
  });

  if (!state) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-4">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#EFFCF8] via-[#F7F8FA] to-[#D1F7EC]/30" />
      <section className="relative w-full max-w-[480px] rounded-sm border border-[#E2E5E9] bg-white p-8 shadow-[0_4px_6px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.04)]">
        <div className="mb-6">
          <h1 className="font-heading text-xl font-semibold text-[#1A1D23]">
            Account activation
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">KiddzOnline</p>
        </div>
        <div className="space-y-4">
          <ActivationMessage state={state} />
        </div>
      </section>
    </main>
  );
}
