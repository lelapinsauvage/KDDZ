"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { childFormSchema, type ChildFormValues } from "@/lib/validations/child";
import { createChild, updateChild } from "@/lib/actions/children";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Users,
  GraduationCap,
  Heart,
  UserPlus,
  Receipt,
  Plus,
  Trash2,
  Save,
  Send,
} from "lucide-react";

const SCHOOL_YEARS = [
  { id: "year-1", label: "2024-2025" },
  { id: "year-2", label: "2025-2026" },
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const NATIONALITIES = [
  "Lebanese",
  "Syrian",
  "Palestinian",
  "Jordanian",
  "Egyptian",
  "Iraqi",
  "French",
  "American",
  "British",
  "Canadian",
  "Other",
];

const DIAPER_TYPES = ["Pampers", "Huggies", "Molfix", "Fine Baby", "Other"];

const MILK_TYPES = [
  "Breast Milk",
  "Aptamil",
  "Similac",
  "S-26",
  "NAN",
  "Novalac",
  "Other",
];

const LANGUAGES = ["Arabic", "English", "French", "Armenian", "Other"];

// ── Helper: form field with label + error ──
function FormField({
  label,
  error,
  required,
  children,
  className,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 text-[#333]">
        {label}
        {required && <span className="ml-0.5 text-[#e7505a]">*</span>}
      </Label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-[#e7505a]">{error}</p>
      )}
    </div>
  );
}

// ── Props ──
interface ChildFormProps {
  defaultValues?: Partial<ChildFormValues>;
  childId?: string;
}

/** Convert ChildFormValues to FormData for server action consumption */
function toFormData(data: ChildFormValues, isDraft = false): FormData {
  const fd = new FormData();
  fd.set("firstName", data.firstName);
  fd.set("middleName", data.middleName ?? "");
  fd.set("lastName", data.lastName);
  fd.set("dateOfBirth", data.dateOfBirth ?? "");
  fd.set("placeOfBirth", data.placeOfBirth ?? "");
  fd.set("gender", data.gender ?? "");
  fd.set("nationality", data.nationality ?? "");
  fd.set("bloodType", data.bloodType ?? "");
  fd.set("allergies", data.allergies ?? "");
  fd.set("photo", data.photo ?? "");
  fd.set("branchId", data.branchId ?? "");
  fd.set("classId", data.classId ?? "");
  fd.set("schoolYearId", data.schoolYearId ?? "");
  fd.set("enrollmentDate", data.enrollmentDate ?? "");
  fd.set("isActive", isDraft ? "false" : String(data.isActive ?? true));
  fd.set("isDraft", isDraft ? "true" : String(data.isDraft ?? false));
  fd.set("busAttendance", String(data.busAttendance ?? false));
  fd.set("diaperType", data.diaperType ?? "");
  fd.set("milkType", data.milkType ?? "");
  fd.set("milkPortions", String(data.milkPortions ?? 0));
  fd.set("sleepFrom", data.sleepFrom ?? "");
  fd.set("sleepTo", data.sleepTo ?? "");
  fd.set("remarks", data.remarks ?? "");
  fd.set("language", data.language ?? "");

  // Nested objects as JSON strings
  if (data.mother) fd.set("mother", JSON.stringify(data.mother));
  if (data.father) fd.set("father", JSON.stringify(data.father));
  fd.set("relatives", JSON.stringify(data.relatives ?? []));
  fd.set("accountingEntries", JSON.stringify(data.accountingEntries ?? []));

  return fd;
}

export function ChildForm({ defaultValues, childId }: ChildFormProps) {
  const isEditing = !!childId;
  const router = useRouter();

  // Fetch branches and classes from the server
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    async function loadOptions() {
      const [branchesResult, classesResult] = await Promise.all([
        getBranches(),
        getClasses(),
      ]);
      if (branchesResult.success && branchesResult.data) {
        setBranches(
          (branchesResult.data as Array<{ id: string; name: string }>)
        );
      }
      if (classesResult.success && classesResult.data) {
        setClasses(
          (classesResult.data as Array<{ id: string; name: string }>)
        );
      }
    }
    loadOptions();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ChildFormValues>({
    resolver: zodResolver(childFormSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: "",
      placeOfBirth: "",
      gender: undefined,
      nationality: "",
      bloodType: "",
      allergies: "",
      photo: "",
      mother: {
        firstName: "",
        lastName: "",
        nationality: "",
        phone: "",
        mobile: "",
        email: "",
      },
      father: {
        firstName: "",
        lastName: "",
        nationality: "",
        phone: "",
        mobile: "",
        email: "",
        workplace: "",
        workPhone: "",
      },
      branchId: "",
      classId: "",
      schoolYearId: "",
      enrollmentDate: "",
      isActive: true,
      isDraft: false,
      busAttendance: false,
      diaperType: "",
      milkType: "",
      milkPortions: 0,
      sleepFrom: "",
      sleepTo: "",
      remarks: "",
      language: "",
      relatives: [],
      accountingEntries: [],
      ...defaultValues,
    },
  });

  const {
    fields: relativeFields,
    append: appendRelative,
    remove: removeRelative,
  } = useFieldArray({ control, name: "relatives" });

  const {
    fields: accountingFields,
    append: appendAccounting,
    remove: removeAccounting,
  } = useFieldArray({ control, name: "accountingEntries" });

  async function onSubmit(data: ChildFormValues) {
    const fd = toFormData(data);
    let result;
    if (isEditing && childId) {
      result = await updateChild(childId, fd);
    } else {
      result = await createChild(fd);
    }
    if (result.success) {
      router.push("/children");
    } else {
      // TODO: show a toast or inline error
      console.error("Save failed:", result.error);
    }
  }

  async function onSaveDraft() {
    const values = watch();
    const fd = toFormData(values as ChildFormValues, true);
    let result;
    if (isEditing && childId) {
      result = await updateChild(childId, fd);
    } else {
      result = await createChild(fd);
    }
    if (result.success) {
      router.push("/children/drafts");
    } else {
      console.error("Draft save failed:", result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList variant="line" className="w-full justify-start border-b border-[#e1e5ec] bg-transparent px-0">
          <TabsTrigger value="basic" className="gap-1.5 data-[state=active]:text-[#1caf9a] after:bg-[#1caf9a]">
            <User className="size-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="guardians" className="gap-1.5 data-[state=active]:text-[#1caf9a] after:bg-[#1caf9a]">
            <Users className="size-4" />
            Guardian Info
          </TabsTrigger>
          <TabsTrigger value="enrollment" className="gap-1.5 data-[state=active]:text-[#1caf9a] after:bg-[#1caf9a]">
            <GraduationCap className="size-4" />
            Enrollment
          </TabsTrigger>
          <TabsTrigger value="care" className="gap-1.5 data-[state=active]:text-[#1caf9a] after:bg-[#1caf9a]">
            <Heart className="size-4" />
            Care Preferences
          </TabsTrigger>
          <TabsTrigger value="relatives" className="gap-1.5 data-[state=active]:text-[#1caf9a] after:bg-[#1caf9a]">
            <UserPlus className="size-4" />
            Relatives
          </TabsTrigger>
          <TabsTrigger value="accounting" className="gap-1.5 data-[state=active]:text-[#1caf9a] after:bg-[#1caf9a]">
            <Receipt className="size-4" />
            Accounting
          </TabsTrigger>
        </TabsList>

        {/* ── Basic Info Tab ── */}
        <TabsContent value="basic">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Basic Information</CardTitle>
              <CardDescription>
                Personal details and identification for the child
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                <FormField
                  label="First Name"
                  required
                  error={errors.firstName?.message}
                >
                  <Input
                    {...register("firstName")}
                    placeholder="Enter first name"
                  />
                </FormField>

                <FormField
                  label="Middle Name"
                  error={errors.middleName?.message}
                >
                  <Input
                    {...register("middleName")}
                    placeholder="Enter middle name"
                  />
                </FormField>

                <FormField
                  label="Last Name"
                  required
                  error={errors.lastName?.message}
                >
                  <Input
                    {...register("lastName")}
                    placeholder="Enter last name"
                  />
                </FormField>

                <FormField
                  label="Date of Birth"
                  required
                  error={errors.dateOfBirth?.message}
                >
                  <Input type="date" {...register("dateOfBirth")} />
                </FormField>

                <FormField
                  label="Place of Birth"
                  error={errors.placeOfBirth?.message}
                >
                  <Input
                    {...register("placeOfBirth")}
                    placeholder="Enter place of birth"
                  />
                </FormField>

                <FormField
                  label="Gender"
                  required
                  error={errors.gender?.message}
                >
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField
                  label="Nationality"
                  error={errors.nationality?.message}
                >
                  <Controller
                    name="nationality"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                        <SelectContent>
                          {NATIONALITIES.map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField
                  label="Blood Type"
                  error={errors.bloodType?.message}
                >
                  <Controller
                    name="bloodType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select blood type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_TYPES.map((bt) => (
                            <SelectItem key={bt} value={bt}>
                              {bt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="Photo URL" error={errors.photo?.message}>
                  <Input
                    {...register("photo")}
                    placeholder="Photo URL or upload path"
                  />
                </FormField>
              </div>

              <div className="mt-4">
                <FormField
                  label="Allergies"
                  error={errors.allergies?.message}
                >
                  <Textarea
                    {...register("allergies")}
                    placeholder="List any known allergies, food sensitivities, or medical conditions..."
                    className="min-h-20"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Guardian Info Tab ── */}
        <TabsContent value="guardians">
          <div className="flex flex-col gap-6">
            {/* Mother */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">Mother Information</CardTitle>
                <CardDescription>
                  Contact and identification details for the mother
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    label="First Name"
                    error={errors.mother?.firstName?.message}
                  >
                    <Input
                      {...register("mother.firstName")}
                      placeholder="Mother's first name"
                    />
                  </FormField>

                  <FormField
                    label="Last Name"
                    error={errors.mother?.lastName?.message}
                  >
                    <Input
                      {...register("mother.lastName")}
                      placeholder="Mother's last name"
                    />
                  </FormField>

                  <FormField
                    label="Nationality"
                    error={errors.mother?.nationality?.message}
                  >
                    <Controller
                      name="mother.nationality"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select nationality" />
                          </SelectTrigger>
                          <SelectContent>
                            {NATIONALITIES.map((n) => (
                              <SelectItem key={n} value={n}>
                                {n}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Phone"
                    error={errors.mother?.phone?.message}
                  >
                    <Input
                      {...register("mother.phone")}
                      placeholder="+961 XX XXX XXX"
                    />
                  </FormField>

                  <FormField
                    label="Mobile"
                    error={errors.mother?.mobile?.message}
                  >
                    <Input
                      {...register("mother.mobile")}
                      placeholder="+961 XX XXX XXX"
                    />
                  </FormField>

                  <FormField
                    label="Email"
                    error={errors.mother?.email?.message}
                  >
                    <Input
                      type="email"
                      {...register("mother.email")}
                      placeholder="mother@email.com"
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Father */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">Father Information</CardTitle>
                <CardDescription>
                  Contact, identification, and workplace details for the father
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    label="First Name"
                    error={errors.father?.firstName?.message}
                  >
                    <Input
                      {...register("father.firstName")}
                      placeholder="Father's first name"
                    />
                  </FormField>

                  <FormField
                    label="Last Name"
                    error={errors.father?.lastName?.message}
                  >
                    <Input
                      {...register("father.lastName")}
                      placeholder="Father's last name"
                    />
                  </FormField>

                  <FormField
                    label="Nationality"
                    error={errors.father?.nationality?.message}
                  >
                    <Controller
                      name="father.nationality"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select nationality" />
                          </SelectTrigger>
                          <SelectContent>
                            {NATIONALITIES.map((n) => (
                              <SelectItem key={n} value={n}>
                                {n}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Phone"
                    error={errors.father?.phone?.message}
                  >
                    <Input
                      {...register("father.phone")}
                      placeholder="+961 XX XXX XXX"
                    />
                  </FormField>

                  <FormField
                    label="Mobile"
                    error={errors.father?.mobile?.message}
                  >
                    <Input
                      {...register("father.mobile")}
                      placeholder="+961 XX XXX XXX"
                    />
                  </FormField>

                  <FormField
                    label="Email"
                    error={errors.father?.email?.message}
                  >
                    <Input
                      type="email"
                      {...register("father.email")}
                      placeholder="father@email.com"
                    />
                  </FormField>

                  <Separator className="col-span-full my-2" />

                  <FormField
                    label="Workplace"
                    error={errors.father?.workplace?.message}
                  >
                    <Input
                      {...register("father.workplace")}
                      placeholder="Company or workplace name"
                    />
                  </FormField>

                  <FormField
                    label="Work Phone"
                    error={errors.father?.workPhone?.message}
                  >
                    <Input
                      {...register("father.workPhone")}
                      placeholder="+961 XX XXX XXX"
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Enrollment Tab ── */}
        <TabsContent value="enrollment">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">
                Enrollment Information
              </CardTitle>
              <CardDescription>
                Branch assignment, class placement, and enrollment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                <FormField
                  label="Branch"
                  required
                  error={errors.branchId?.message}
                >
                  <Controller
                    name="branchId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField
                  label="Class"
                  required
                  error={errors.classId?.message}
                >
                  <Controller
                    name="classId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField
                  label="School Year"
                  required
                  error={errors.schoolYearId?.message}
                >
                  <Controller
                    name="schoolYearId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select school year" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHOOL_YEARS.map((y) => (
                            <SelectItem key={y.id} value={y.id}>
                              {y.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField
                  label="Enrollment Date"
                  error={errors.enrollmentDate?.message}
                >
                  <Input type="date" {...register("enrollmentDate")} />
                </FormField>
              </div>

              <Separator className="my-6" />

              <div className="flex flex-wrap gap-8">
                <div className="flex items-center gap-3">
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="isActive"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer text-[#333]">
                    Active enrollment
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Controller
                    name="isDraft"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="isDraft"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="isDraft" className="cursor-pointer text-[#333]">
                    Save as draft (incomplete enrollment)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Care Preferences Tab ── */}
        <TabsContent value="care">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Care Preferences</CardTitle>
              <CardDescription>
                Daily care routines, dietary needs, and transportation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                <FormField label="Language" error={errors.language?.message}>
                  <Controller
                    name="language"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Preferred language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField
                  label="Diaper Type"
                  error={errors.diaperType?.message}
                >
                  <Controller
                    name="diaperType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select diaper type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIAPER_TYPES.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="Milk Type" error={errors.milkType?.message}>
                  <Controller
                    name="milkType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select milk type" />
                        </SelectTrigger>
                        <SelectContent>
                          {MILK_TYPES.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField
                  label="Milk Portions (per day)"
                  error={errors.milkPortions?.message}
                >
                  <Input
                    type="number"
                    min={0}
                    {...register("milkPortions")}
                    placeholder="0"
                  />
                </FormField>

                <FormField label="Sleep From" error={errors.sleepFrom?.message}>
                  <Input type="time" {...register("sleepFrom")} />
                </FormField>

                <FormField label="Sleep To" error={errors.sleepTo?.message}>
                  <Input type="time" {...register("sleepTo")} />
                </FormField>
              </div>

              <Separator className="my-6" />

              <div className="flex items-center gap-3">
                <Controller
                  name="busAttendance"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="busAttendance"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="busAttendance" className="cursor-pointer text-[#333]">
                  Uses bus transportation
                </Label>
              </div>

              <div className="mt-6">
                <FormField label="Remarks" error={errors.remarks?.message}>
                  <Textarea
                    {...register("remarks")}
                    placeholder="Any additional notes about care preferences, habits, or special instructions..."
                    className="min-h-24"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Relatives Tab ── */}
        <TabsContent value="relatives">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Relatives & Authorized Contacts
                  </CardTitle>
                  <CardDescription className="mt-1">
                    People authorized to pick up the child or to contact in case
                    of emergency
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendRelative({
                      name: "",
                      relation: "",
                      phone: "",
                      isAuthorized: false,
                    })
                  }
                >
                  <Plus className="size-4" />
                  Add Relative
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {relativeFields.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#e1e5ec] py-12 text-center">
                  <UserPlus className="mb-3 size-10 text-[#6f7b8a]" />
                  <p className="text-sm text-[#6f7b8a]">
                    No relatives added yet.
                  </p>
                  <p className="mt-1 text-xs text-[#6f7b8a]">
                    Click &quot;Add Relative&quot; to add emergency contacts and
                    authorized persons.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {relativeFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-lg border border-[#e1e5ec] bg-[#f9fafb] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#333]">
                          Relative #{index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-[#e7505a] hover:bg-[#e7505a]/10 hover:text-[#e7505a]"
                          onClick={() => removeRelative(index)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-4">
                        <FormField
                          label="Name"
                          required
                          error={errors.relatives?.[index]?.name?.message}
                        >
                          <Input
                            {...register(`relatives.${index}.name`)}
                            placeholder="Full name"
                          />
                        </FormField>

                        <FormField
                          label="Relation"
                          required
                          error={errors.relatives?.[index]?.relation?.message}
                        >
                          <Input
                            {...register(`relatives.${index}.relation`)}
                            placeholder="e.g. Grandmother, Uncle"
                          />
                        </FormField>

                        <FormField
                          label="Phone"
                          required
                          error={errors.relatives?.[index]?.phone?.message}
                        >
                          <Input
                            {...register(`relatives.${index}.phone`)}
                            placeholder="+961 XX XXX XXX"
                          />
                        </FormField>

                        <div className="flex items-end pb-1">
                          <div className="flex items-center gap-3">
                            <Controller
                              name={`relatives.${index}.isAuthorized`}
                              control={control}
                              render={({ field: f }) => (
                                <Checkbox
                                  id={`relative-auth-${index}`}
                                  checked={f.value}
                                  onCheckedChange={f.onChange}
                                />
                              )}
                            />
                            <Label
                              htmlFor={`relative-auth-${index}`}
                              className="cursor-pointer text-[#333]"
                            >
                              Authorized for pickup
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Accounting Tab ── */}
        <TabsContent value="accounting">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Accounting Entries
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Fees, discounts, payments, and adjustments for this child
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendAccounting({
                      description: "",
                      amount: 0,
                      type: "FEE",
                    })
                  }
                >
                  <Plus className="size-4" />
                  Add Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {accountingFields.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#e1e5ec] py-12 text-center">
                  <Receipt className="mb-3 size-10 text-[#6f7b8a]" />
                  <p className="text-sm text-[#6f7b8a]">
                    No accounting entries yet.
                  </p>
                  <p className="mt-1 text-xs text-[#6f7b8a]">
                    Click &quot;Add Entry&quot; to add fees, payments, or
                    adjustments.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Table header */}
                  <div className="hidden grid-cols-[1fr_150px_180px_40px] gap-4 px-4 text-xs font-medium uppercase tracking-wide text-[#6f7b8a] md:grid">
                    <span>Description</span>
                    <span>Amount</span>
                    <span>Type</span>
                    <span />
                  </div>

                  {accountingFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 gap-4 rounded-lg border border-[#e1e5ec] bg-[#f9fafb] p-4 md:grid-cols-[1fr_150px_180px_40px] md:items-start md:rounded-none md:border-0 md:bg-transparent md:p-0 md:px-4"
                    >
                      <FormField
                        label="Description"
                        className="md:hidden"
                        error={
                          errors.accountingEntries?.[index]?.description
                            ?.message
                        }
                      >
                        <Input
                          {...register(
                            `accountingEntries.${index}.description`
                          )}
                          placeholder="e.g. Monthly tuition"
                        />
                      </FormField>
                      <div className="hidden md:block">
                        <Input
                          {...register(
                            `accountingEntries.${index}.description`
                          )}
                          placeholder="e.g. Monthly tuition"
                          aria-invalid={
                            !!errors.accountingEntries?.[index]?.description
                          }
                        />
                        {errors.accountingEntries?.[index]?.description && (
                          <p className="mt-1 text-xs text-[#e7505a]">
                            {
                              errors.accountingEntries[index].description
                                ?.message
                            }
                          </p>
                        )}
                      </div>

                      <FormField
                        label="Amount"
                        className="md:hidden"
                        error={
                          errors.accountingEntries?.[index]?.amount?.message
                        }
                      >
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`accountingEntries.${index}.amount`)}
                          placeholder="0.00"
                        />
                      </FormField>
                      <div className="hidden md:block">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`accountingEntries.${index}.amount`)}
                          placeholder="0.00"
                          aria-invalid={
                            !!errors.accountingEntries?.[index]?.amount
                          }
                        />
                        {errors.accountingEntries?.[index]?.amount && (
                          <p className="mt-1 text-xs text-[#e7505a]">
                            {errors.accountingEntries[index].amount?.message}
                          </p>
                        )}
                      </div>

                      <FormField
                        label="Type"
                        className="md:hidden"
                        error={
                          errors.accountingEntries?.[index]?.type?.message
                        }
                      >
                        <Controller
                          name={`accountingEntries.${index}.type`}
                          control={control}
                          render={({ field: f }) => (
                            <Select
                              value={f.value}
                              onValueChange={f.onChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FEE">Fee</SelectItem>
                                <SelectItem value="DISCOUNT">
                                  Discount
                                </SelectItem>
                                <SelectItem value="PAYMENT">Payment</SelectItem>
                                <SelectItem value="ADJUSTMENT">
                                  Adjustment
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </FormField>
                      <div className="hidden md:block">
                        <Controller
                          name={`accountingEntries.${index}.type`}
                          control={control}
                          render={({ field: f }) => (
                            <Select
                              value={f.value}
                              onValueChange={f.onChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FEE">Fee</SelectItem>
                                <SelectItem value="DISCOUNT">
                                  Discount
                                </SelectItem>
                                <SelectItem value="PAYMENT">Payment</SelectItem>
                                <SelectItem value="ADJUSTMENT">
                                  Adjustment
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.accountingEntries?.[index]?.type && (
                          <p className="mt-1 text-xs text-[#e7505a]">
                            {errors.accountingEntries[index].type?.message}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end md:pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-[#e7505a] hover:bg-[#e7505a]/10 hover:text-[#e7505a]"
                          onClick={() => removeAccounting(index)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Sticky Action Bar ── */}
      <div className="sticky bottom-0 z-10 -mx-6 -mb-6 border-t border-[#e1e5ec] bg-white px-6 py-4">
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            disabled={isSubmitting}
          >
            <Save className="size-4" />
            Save as Draft
          </Button>
          <Button
            type="submit"
            className="bg-[#1caf9a] text-white hover:bg-[#18a08c]"
            disabled={isSubmitting}
          >
            <Send className="size-4" />
            {isEditing ? "Update Child" : "Submit Enrollment"}
          </Button>
        </div>
      </div>
    </form>
  );
}
