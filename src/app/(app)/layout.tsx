import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AppContextProvider } from "@/components/providers/app-context-provider"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, branches, years] = await Promise.all([
    auth(),
    db.branch.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.schoolYear.findMany({ select: { id: true, label: true }, orderBy: { startDate: "desc" } }),
  ])

  const defaultBranchId = session?.user?.branchId ?? null

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
        <Header />

        {/* Sidebar + main content area below header */}
        <AppSidebar userRole={session?.user?.role ?? "TEACHER"} />
        <SidebarInset className="mt-[56px] flex min-h-[calc(100svh-56px)] flex-col">
          {/* Scrollable content area */}
          <div className="flex-1 bg-background">
            {children}
          </div>

          {/* Footer */}
          <Footer />
        </SidebarInset>
      </SidebarProvider>
    </AppContextProvider>
  )
}
