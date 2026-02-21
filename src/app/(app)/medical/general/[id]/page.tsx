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

const generalFormSchema = z.object({
  childName: z.string().min(1, "Child name is required"),
  date: z.string().min(1, "Date is required"),
  doctor: z.string().min(1, "Doctor is required"),
  height: z.string().min(1, "Height is required"),
  weight: z.string().min(1, "Weight is required"),
  headCircumference: z.string().optional(),
  generalHealthNotes: z.string().optional(),
  doctorNotes: z.string().optional(),
  status: z.string(),
});

type GeneralFormValues = z.infer<typeof generalFormSchema>;

// --- Demo Data Lookup ---

const demoFormsMap: Record<string, GeneralFormValues> = {
  gf1: {
    childName: "Lara Haddad",
    date: "2026-02-18",
    doctor: "Dr. Antoine Karam",
    height: "92",
    weight: "13.5",
    headCircumference: "48",
    generalHealthNotes: "Overall healthy. Active and meeting developmental milestones. Good appetite and sleep patterns.",
    doctorNotes: "No concerns at this time. Continue regular checkups every 6 months.",
    status: "Reviewed",
  },
  gf2: {
    childName: "Adam Khoury",
    date: "2026-02-15",
    doctor: "Dr. Nadia Saade",
    height: "88",
    weight: "12.2",
    headCircumference: "47",
    generalHealthNotes: "Mild seasonal allergies noted. Otherwise healthy and thriving.",
    doctorNotes: "Recommended antihistamine for allergy season. Follow up in 3 months.",
    status: "Submitted",
  },
  gf3: {
    childName: "Mia Gemayel",
    date: "2026-02-12",
    doctor: "Dr. Antoine Karam",
    height: "95",
    weight: "14.1",
    headCircumference: "49",
    generalHealthNotes: "",
    doctorNotes: "",
    status: "Draft",
  },
  new: {
    childName: "",
    date: new Date().toISOString().split("T")[0],
    doctor: "",
    height: "",
    weight: "",
    headCircumference: "",
    generalHealthNotes: "",
    doctorNotes: "",
    status: "Draft",
  },
};

// --- Status badge ---

function getStatusBadge(status: string) {
  switch (status) {
    case "Draft":
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-600">
          Draft
        </Badge>
      );
    case "Submitted":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Submitted
        </Badge>
      );
    case "Reviewed":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Reviewed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// --- Page Component ---

export default function GeneralMedicalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isNew = id === "new";
  const formData = demoFormsMap[id] || demoFormsMap["new"];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GeneralFormValues>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: formData,
  });

  const currentStatus = watch("status");

  const onSave = (data: GeneralFormValues) => {
    console.log("Saving form:", data);
  };

  const onSubmit = (data: GeneralFormValues) => {
    console.log("Submitting form:", { ...data, status: "Submitted" });
  };

  return (
    <>
      <PageHeader
        title={isNew ? "New General Medical Form" : `General Medical Form`}
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "General", href: "/medical/general" },
          { label: isNew ? "New" : formData.childName },
        ]}
      />
      <div className="p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link href="/medical/general">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4" />
              Back to List
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {getStatusBadge(currentStatus)}
            <Button
              variant="outline"
              onClick={handleSubmit(onSave)}
            >
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
          {/* Child Information */}
          <Card>
            <CardHeader>
              <CardTitle>Child Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="childName">Child Name</Label>
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
                  <Label htmlFor="date">Date</Label>
                  <Input type="date" {...register("date")} />
                  {errors.date && (
                    <p className="text-xs text-red-500">{errors.date.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctor">Doctor</Label>
                  <Input placeholder="e.g. Dr. Antoine Karam" {...register("doctor")} />
                  {errors.doctor && (
                    <p className="text-xs text-red-500">{errors.doctor.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Measurements */}
          <Card>
            <CardHeader>
              <CardTitle>Measurements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input type="text" placeholder="e.g. 92" {...register("height")} />
                  {errors.height && (
                    <p className="text-xs text-red-500">{errors.height.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input type="text" placeholder="e.g. 13.5" {...register("weight")} />
                  {errors.weight && (
                    <p className="text-xs text-red-500">{errors.weight.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headCircumference">Head Circumference (cm)</Label>
                  <Input
                    type="text"
                    placeholder="e.g. 48"
                    {...register("headCircumference")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Notes */}
          <Card>
            <CardHeader>
              <CardTitle>General Health Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  placeholder="Enter general health observations, developmental notes, etc."
                  rows={4}
                  {...register("generalHealthNotes")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Doctor Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Doctor Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  placeholder="Doctor's observations and recommendations..."
                  rows={4}
                  {...register("doctorNotes")}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
