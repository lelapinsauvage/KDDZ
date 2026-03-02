"use client"

import { useState } from "react"
import { AlertTriangle, GraduationCap, Baby, Lock } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

// ---------------------------------------------------------------------------
// Import option definitions (mirrors old PHP newyear.php)
// ---------------------------------------------------------------------------

interface ImportOption {
  id: string
  label: string
  defaultChecked: boolean
}

const optionalImports: ImportOption[] = [
  { id: "general-forms", label: "General Forms", defaultChecked: true },
  { id: "vaccinations", label: "Vaccination Forms", defaultChecked: true },
  { id: "suffering", label: "Suffering Forms", defaultChecked: true },
  { id: "teachers", label: "Teachers", defaultChecked: true },
  { id: "nurses", label: "Nurses", defaultChecked: false },
  { id: "managers", label: "Managers", defaultChecked: false },
  { id: "doctors", label: "Doctors (Garderie Drs)", defaultChecked: false },
  { id: "holidays", label: "Holidays (Only Fixed Holidays)", defaultChecked: false },
]

const mandatoryImports: ImportOption[] = [
  { id: "classes", label: "Classes" },
  { id: "branches", label: "Branches" },
  { id: "children", label: "Children" },
  { id: "parents", label: "Parents" },
] as ImportOption[]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewYearPage() {
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const opt of optionalImports) {
      initial[opt.id] = opt.defaultChecked
    }
    return initial
  })

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <>
      <PageHeader
        title="New Academic Year Setup"
        description="Archive the current year and create a new academic year"
        breadcrumbs={[{ label: "New Academic Year" }]}
      />

      <div className="space-y-6 p-4 sm:p-6">
        {/* Warning banner */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-300">Warning</p>
            <p className="mt-1 text-amber-200/80">
              The current database will be archived on the server. It is{" "}
              <strong>strongly recommended</strong> to download a local backup
              before proceeding.
            </p>
          </div>
        </div>

        {/* Data Import Options */}
        <Card>
          <CardHeader>
            <CardTitle>Data Import Options</CardTitle>
            <CardDescription>
              Choose which data to carry over into the new academic year.
              Mandatory items are always imported.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 sm:grid-cols-2">
              {/* Optional imports */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Optional Imports
                </h3>
                <div className="space-y-3">
                  {optionalImports.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2.5">
                      <Checkbox
                        id={opt.id}
                        checked={selected[opt.id]}
                        onCheckedChange={() => toggle(opt.id)}
                      />
                      <Label
                        htmlFor={opt.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandatory imports */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Mandatory Imports
                </h3>
                <div className="space-y-3">
                  {mandatoryImports.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center gap-2.5 opacity-60"
                    >
                      <Checkbox id={opt.id} checked disabled />
                      <Label
                        htmlFor={opt.id}
                        className="text-sm font-normal cursor-not-allowed"
                      >
                        {opt.label}
                      </Label>
                      <Lock className="size-3 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Reassignment */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5 text-muted-foreground" />
              <CardTitle>Teacher Reassignment</CardTitle>
            </div>
            <CardDescription>
              Reassign teachers to new classes for the upcoming year. Each
              teacher can be mapped from their current class to a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12 text-sm text-muted-foreground">
              {/* TODO: Teacher reassignment table — select checkbox, name, current class → new class dropdown */}
              Teacher reassignment table will be implemented here
            </div>
          </CardContent>
        </Card>

        {/* Child Class Progression */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Baby className="size-5 text-muted-foreground" />
              <CardTitle>Child Class Progression</CardTitle>
            </div>
            <CardDescription>
              Move children to their next class for the new year. Each child can
              be assigned a new class and serial number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12 text-sm text-muted-foreground">
              {/* TODO: Children progression table — checkbox, name, current class → new class dropdown, new S.N */}
              Child class progression table will be implemented here
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <Button disabled className="w-full max-w-xs">
            Create New Academic Year
          </Button>
          <p className="text-xs text-muted-foreground">
            Coming Soon — this action is not yet available
          </p>
        </div>
      </div>
    </>
  )
}
