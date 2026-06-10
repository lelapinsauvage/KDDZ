import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MobileNav } from "@/components/layout/mobile-nav"
import { PageTransition } from "@/components/layout/page-transition"
import { AppContextProvider } from "@/components/providers/app-context-provider"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getSidebarBadges } from "@/lib/actions/sidebar"
import {
  getLegacyAccessPermissionMap,
  type LegacyAccessPermissionDecision,
} from "@/lib/legacy-access-permissions"
import {
  getLegacyPageNameForPath,
  legacyPermissionAllows,
  LEGACY_GUARDED_PAGE_NAMES,
} from "@/lib/legacy-page-guards"
import { getLegacyNotificationGateVisibility } from "@/lib/legacy-notification-gates"
import { getLegacySystemActionPermissions } from "@/lib/legacy-system-action-permissions"
import { isExpiredIsoDate } from "@/lib/auth-public-paths"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const requestHeaders = await headers()
  const currentPathname = requestHeaders.get("x-current-pathname")
  const legacySessionExpiresAt = session?.user?.legacySessionExpiresAt
  const legacySessionExpired = isExpiredIsoDate(legacySessionExpiresAt)

  if (!session?.user?.id || legacySessionExpired) {
    const callbackPath = currentPathname && currentPathname !== "/" ? currentPathname : "/dashboard"
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`)
  }

  const guardedLegacyPage = getLegacyPageNameForPath(currentPathname)
  let orgId = session?.user?.organizationId ?? null

  // Fallback: if JWT is stale and missing orgId, look up from DB
  if (!orgId && session?.user?.id) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, branch: { select: { organizationId: true } } },
    })
    orgId = dbUser?.organizationId ?? dbUser?.branch?.organizationId ?? null
  }
  if (!orgId) {
    const firstOrg = await db.organization.findFirst({ select: { id: true } })
    orgId = firstOrg?.id ?? null
  }

  const defaultBranchId = session?.user?.branchId ?? null
  const userRole = session?.user?.role ?? "TEACHER"
  const emptyLegacyPagePermissions: Record<
    string,
    LegacyAccessPermissionDecision
  > = {}
  const emptyLegacySystemActionPermissions = { canManageSystem: false }

  const [
    branches,
    years,
    badges,
    classes,
    notificationGates,
    legacyPagePermissions,
    legacySystemActionPermissions,
  ] = await Promise.all([
    orgId
      ? db.branch.findMany({
          where: { organizationId: orgId },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [],
    orgId
      ? db.schoolYear.findMany({
          where: { organizationId: orgId },
          select: { id: true, label: true },
          orderBy: { startDate: "desc" },
        })
      : [],
    getSidebarBadges(),
    orgId
      ? db.class.findMany({
          where: { isActive: true, branch: { organizationId: orgId } },
          select: { id: true, name: true, branch: { select: { id: true, name: true } } },
          orderBy: [{ branch: { name: "asc" } }, { name: "asc" }],
        })
      : [],
    orgId ? getLegacyNotificationGateVisibility(orgId) : null,
    orgId && session?.user?.id
      ? getLegacyAccessPermissionMap(
          {
            userId: session.user.id,
            organizationId: orgId,
            branchId: defaultBranchId,
            role: userRole,
          },
          LEGACY_GUARDED_PAGE_NAMES,
          "PAGE"
        )
      : emptyLegacyPagePermissions,
    orgId && session?.user?.id && userRole === "ADMIN"
      ? getLegacySystemActionPermissions({
          userId: session.user.id,
          organizationId: orgId,
          branchId: defaultBranchId,
          role: userRole,
        })
      : emptyLegacySystemActionPermissions,
  ])

  if (
    guardedLegacyPage &&
    !legacyPermissionAllows(legacyPagePermissions[guardedLegacyPage])
  ) {
    redirect("/forbidden.php")
  }

  return (
    <AppContextProvider
      branches={branches}
      years={years}
      defaultBranchId={defaultBranchId}
    >
      <SidebarProvider
        defaultOpen
        style={
          {
            "--sidebar-width": "270px",
          } as React.CSSProperties
        }
      >
        {/* Fixed header spanning full width */}
        <Header canManageSystem={legacySystemActionPermissions.canManageSystem} />

        {/* Sidebar + main content area below header */}
        <AppSidebar
          userRole={userRole}
          badges={badges}
          classes={classes}
          branches={branches}
          notificationGates={notificationGates}
          legacyPagePermissions={legacyPagePermissions}
        />
        <SidebarInset className="mt-[52px] flex min-h-[calc(100svh-52px)] flex-col">
          {/* Scrollable content area */}
          <div className="flex-1 bg-background pb-16 md:pb-0">
            <PageTransition>{children}</PageTransition>
          </div>

          {/* Footer — hidden on mobile (tab bar takes that space) */}
          <div className="hidden md:block">
            <Footer />
          </div>
        </SidebarInset>

        {/* Mobile bottom tab bar */}
        <MobileNav
          userRole={userRole}
          classes={classes}
          branches={branches}
          badges={badges}
          notificationGates={notificationGates}
          legacyPagePermissions={legacyPagePermissions}
        />
      </SidebarProvider>
    </AppContextProvider>
  )
}
