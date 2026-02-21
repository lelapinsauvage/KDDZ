import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AppContextProvider } from "@/components/providers/app-context-provider"

// TODO: Fetch from database when connected
const demoBranches = [
  { id: "branch-1", name: "Main Branch" },
  { id: "branch-2", name: "Downtown Branch" },
  { id: "branch-3", name: "Suburb Branch" },
]

const demoYears = [
  { id: "year-1", label: "2024-2025" },
  { id: "year-2", label: "2023-2024" },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppContextProvider
      branches={demoBranches}
      years={demoYears}
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
        <AppSidebar />
        <SidebarInset className="mt-[46px] flex min-h-[calc(100svh-46px)] flex-col">
          {/* Scrollable content area */}
          <div className="flex-1 bg-[#eef1f5]">
            {children}
          </div>

          {/* Footer */}
          <Footer />
        </SidebarInset>
      </SidebarProvider>
    </AppContextProvider>
  )
}
