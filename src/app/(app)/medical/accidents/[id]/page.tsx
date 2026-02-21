"use client";

import { use } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

const accidentFormSchema = z.object({
  childName: z.string().min(1, "Child name is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Description is required"),
  injuryType: z.string().min(1, "Injury type is required"),
  severity: z.string().min(1, "Severity is required"),
  firstAidGiven: z.string().optional(),
  parentNotified: z.boolean(),
  doctorNotes: z.string().optional(),
  status: z.string(),
});

type AccidentFormValues = z.infer<typeof accidentFormSchema>;

// --- Demo Data ---

const demoAccidentsMap: Record<string, AccidentFormValues> = {
  ar1: {
    childName: "Jad Nassar",
    date: "2026-02-19",
    time: "10:30",
    location: "Outdoor playground",
    description: "Fell from low climbing frame during outdoor play. Minor scrape on left knee.",
    injuryType: "Scrape / Abrasion",
    severity: "Minor",
    firstAidGiven: "Cleaned wound with antiseptic, applied adhesive bandage. Ice pack on knee for 5 minutes.",
    parentNotified: true,
    doctorNotes: "No further treatment needed. Monitor for infection.",
    status: "Reviewed",
  },
  ar2: {
    childName: "Rayan Frem",
    date: "2026-02-17",
    time: "14:15",
    location: "Indoor play area",
    description: "Bumped head on table edge while crawling. Small bump on forehead, no bleeding.",
    injuryType: "Bump / Bruise",
    severity: "Moderate",
    firstAidGiven: "Applied cold compress to forehead for 10 minutes. Monitored for signs of concussion for 30 minutes.",
    parentNotified: true,
    doctorNotes: "Watch for vomiting, drowsiness or unsteadiness. If symptoms appear, visit ER.",
    status: "Submitted",
  },
  ar3: {
    childName: "Tia Daher",
    date: "2026-02-14",
    time: "11:00",
    location: "Classroom",
    description: "Tripped on play mat and fell on right arm. Complained of pain, arm checked by nurse.",
    injuryType: "Sprain / Strain",
    severity: "Moderate",
    firstAidGiven: "Applied ice pack, immobilized arm with soft wrap. Child kept calm and resting.",
    parentNotified: true,
    doctorNotes: "X-ray recommended if pain persists. Follow up in 24 hours.",
    status: "Reviewed",
  },
  new: {
    childName: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    location: "",
    description: "",
    injuryType: "",
    severity: "",
    firstAidGiven: "",
    parentNotified: false,
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

export default function AccidentReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isNew = id === "new";
  const formData = demoAccidentsMap[id] || demoAccidentsMap["new"];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<AccidentFormValues>({
    resolver: zodResolver(accidentFormSchema),
    defaultValues: formData,
  });

  const currentStatus = watch("status");

  const onSave = (data: AccidentFormValues) => {
    console.log("Saving accident report:", data);
  };

  const onSubmit = (data: AccidentFormValues) => {
    console.log("Submitting accident report:", { ...data, status: "Submitted" });
  };

  return (
    <>
      <PageHeader
        title={isNew ? "New Accident Report" : "Accident Report"}
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Accidents", href: "/medical/accidents" },
          { label: isNew ? "New" : formData.childName },
        ]}
      />
      <div className="p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link href="/medical/accidents">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4" />
              Back to List
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {getStatusBadge(currentStatus)}
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
          {/* Child & Timing */}
          <Card>
            <CardHeader>
              <CardTitle>Child & Timing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  <Label>Date of Accident</Label>
                  <Input type="date" {...register("date")} />
                  {errors.date && (
                    <p className="text-xs text-red-500">{errors.date.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Time of Accident</Label>
                  <Input type="time" {...register("time")} />
                  {errors.time && (
                    <p className="text-xs text-red-500">{errors.time.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incident Details */}
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={watch("location")}
                    onValueChange={(val) => setValue("location", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Outdoor playground">Outdoor playground</SelectItem>
                      <SelectItem value="Indoor play area">Indoor play area</SelectItem>
                      <SelectItem value="Classroom">Classroom</SelectItem>
                      <SelectItem value="Cafeteria">Cafeteria</SelectItem>
                      <SelectItem value="Hallway">Hallway</SelectItem>
                      <SelectItem value="Bathroom">Bathroom</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.location && (
                    <p className="text-xs text-red-500">{errors.location.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Injury Type</Label>
                  <Select
                    value={watch("injuryType")}
                    onValueChange={(val) => setValue("injuryType", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select injury type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scrape / Abrasion">Scrape / Abrasion</SelectItem>
                      <SelectItem value="Bump / Bruise">Bump / Bruise</SelectItem>
                      <SelectItem value="Cut / Laceration">Cut / Laceration</SelectItem>
                      <SelectItem value="Sprain / Strain">Sprain / Strain</SelectItem>
                      <SelectItem value="Bite">Bite</SelectItem>
                      <SelectItem value="Burn">Burn</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.injuryType && (
                    <p className="text-xs text-red-500">{errors.injuryType.message}</p>
                  )}
                </div>
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
                      <SelectItem value="Minor">Minor</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.severity && (
                    <p className="text-xs text-red-500">{errors.severity.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what happened in detail..."
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* First Aid & Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>First Aid & Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>First Aid Given</Label>
                  <Textarea
                    placeholder="Describe first aid measures taken..."
                    rows={3}
                    {...register("firstAidGiven")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    name="parentNotified"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label className="cursor-pointer">Parent / Guardian Notified</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Doctor Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Doctor's observations and recommendations..."
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
