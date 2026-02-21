"use client";

import { use } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, Send } from "lucide-react";

// --- Schema ---

const conditionFormSchema = z.object({
  childName: z.string().min(1, "Child name is required"),
  condition: z.string().min(1, "Condition name is required"),
  description: z.string().optional(),
  severity: z.string().min(1, "Severity is required"),
  diagnosedDate: z.string().min(1, "Diagnosed date is required"),
  treatmentPlan: z.string().optional(),
  currentStatus: z.string().min(1, "Status is required"),
  doctorNotes: z.string().optional(),
});

type ConditionFormValues = z.infer<typeof conditionFormSchema>;

// --- Demo Data ---

const demoConditionsMap: Record<string, ConditionFormValues> = {
  mc1: {
    childName: "Mia Gemayel",
    condition: "Peanut Allergy",
    description: "Severe allergic reaction to peanuts and peanut-derived products. Diagnosed after accidental exposure caused hives and swelling.",
    severity: "Severe",
    diagnosedDate: "2025-06-15",
    treatmentPlan: "Strict peanut avoidance. EpiPen (0.15mg) kept at daycare at all times. Staff trained on emergency administration. Antihistamine (Cetirizine 2.5ml) for mild reactions.",
    currentStatus: "Active",
    doctorNotes: "Annual allergy testing recommended. Parents carry backup EpiPen. Alert card in child's file and posted in kitchen.",
  },
  mc2: {
    childName: "Adam Khoury",
    condition: "Asthma",
    description: "Exercise-induced and seasonal asthma. Triggered by physical activity and pollen exposure.",
    severity: "Moderate",
    diagnosedDate: "2025-09-20",
    treatmentPlan: "Preventive inhaler (Fluticasone) daily. Rescue inhaler (Salbutamol) available at daycare for acute episodes. Limit outdoor activity during high pollen days.",
    currentStatus: "Managed",
    doctorNotes: "Well-controlled with current medication. Review in 6 months. Staff to monitor during outdoor play.",
  },
  mc3: {
    childName: "Lea Boustany",
    condition: "Eczema",
    description: "Mild eczema on arms and behind knees. Flares up in dry weather.",
    severity: "Mild",
    diagnosedDate: "2025-11-03",
    treatmentPlan: "Emollient cream applied twice daily. Hydrocortisone 1% for flare-ups (max 7 days). Avoid harsh soaps.",
    currentStatus: "Managed",
    doctorNotes: "Improving with consistent moisturizing routine. Parents to provide cream for daycare use.",
  },
  new: {
    childName: "",
    condition: "",
    description: "",
    severity: "",
    diagnosedDate: "",
    treatmentPlan: "",
    currentStatus: "",
    doctorNotes: "",
  },
};

// --- Status badge ---

function getConditionStatusBadge(status: string) {
  switch (status) {
    case "Active":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Active
        </Badge>
      );
    case "Managed":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Managed
        </Badge>
      );
    case "Resolved":
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-600">
          Resolved
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// --- Page Component ---

export default function ConditionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isNew = id === "new";
  const formData = demoConditionsMap[id] || demoConditionsMap["new"];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConditionFormValues>({
    resolver: zodResolver(conditionFormSchema),
    defaultValues: formData,
  });

  const currentStatus = watch("currentStatus");

  const onSave = (data: ConditionFormValues) => {
    console.log("Saving condition:", data);
  };

  const onSubmit = (data: ConditionFormValues) => {
    console.log("Submitting condition:", data);
  };

  return (
    <>
      <PageHeader
        title={isNew ? "New Medical Condition" : "Medical Condition"}
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Conditions", href: "/medical/conditions" },
          { label: isNew ? "New" : formData.condition || "Details" },
        ]}
      />
      <div className="p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link href="/medical/conditions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4" />
              Back to List
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {currentStatus && getConditionStatusBadge(currentStatus)}
            <Button variant="outline" onClick={handleSubmit(onSave)}>
              <Save className="size-4" />
              Save Draft
            </Button>
            <Button
              style={{ background: "#1caf9a" }}
              className="text-white"
              onClick={handleSubmit(onSubmit)}
            >
              <Send className="size-4" />
              Submit
            </Button>
          </div>
        </div>

        <form className="space-y-6">
          {/* Child & Condition Info */}
          <Card>
            <CardHeader>
              <CardTitle>Condition Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Child Name</Label>
                  <Select
                    value={watch("childName")}
                    onValueChange={(val) => setValue("childName", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a child" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Lara Haddad",
                        "Adam Khoury",
                        "Mia Gemayel",
                        "Jad Nassar",
                        "Lea Boustany",
                        "Karim Saab",
                        "Nour Mansour",
                        "Zein Abi Saab",
                        "Tia Daher",
                        "Rayan Frem",
                        "Yasmine Geagea",
                        "Tarek Hariri",
                      ].map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.childName && (
                    <p className="text-xs text-red-500">{errors.childName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Condition Name</Label>
                  <Input placeholder="e.g. Peanut Allergy, Asthma, etc." {...register("condition")} />
                  {errors.condition && (
                    <p className="text-xs text-red-500">{errors.condition.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the condition, triggers, and symptoms..."
                  rows={3}
                  {...register("description")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Severity & Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Severity & Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={watch("severity")}
                    onValueChange={(val) => setValue("severity", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mild">Mild</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.severity && (
                    <p className="text-xs text-red-500">{errors.severity.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Diagnosed Date</Label>
                  <Input type="date" {...register("diagnosedDate")} />
                  {errors.diagnosedDate && (
                    <p className="text-xs text-red-500">{errors.diagnosedDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <Select
                    value={watch("currentStatus")}
                    onValueChange={(val) => setValue("currentStatus", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Managed">Managed</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.currentStatus && (
                    <p className="text-xs text-red-500">{errors.currentStatus.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Treatment Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Treatment Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe the treatment plan, medications, dietary restrictions, emergency procedures..."
                rows={5}
                {...register("treatmentPlan")}
              />
            </CardContent>
          </Card>

          {/* Doctor Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Doctor Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Doctor's observations and additional recommendations..."
                rows={4}
                {...register("doctorNotes")}
              />
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
