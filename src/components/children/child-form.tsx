"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { childFormSchema, type ChildFormValues } from "@/lib/validations/child";
import { createChild, updateChild } from "@/lib/actions/children";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { getSchoolYears } from "@/lib/actions/school-years";
import { toast } from "sonner";
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
  Paperclip,
  Plus,
  Trash2,
  Save,
  Send,
  Loader2,
} from "lucide-react";

// ── Constants ──

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

const RELIGIONS = [
  "Muslim",
  "Christian",
  "Druze",
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

const MARITAL_STATUSES = [
  "Normal life",
  "Separated",
  "Divorced",
  "Widow(er)",
];

const DIVORCE_SITUATIONS = [
  "Child With Father",
  "Child With Mother",
  "Child between Father and Mother",
];

const MEDICAL_CASES = [
  "No",
  "Hearing",
  "Visual",
  "Motion",
  "Mental",
  "Psychological",
  "Neural",
];

const BUS_OPTIONS = [
  { value: "false", label: "No" },
  { value: "morning", label: "Morning" },
  { value: "noon", label: "Noon" },
  { value: "afternoon", label: "Afternoon" },
  { value: "morning-noon", label: "Morning / Noon" },
  { value: "morning-afternoon", label: "Morning / Afternoon" },
];

const MILK_SCOOPS = Array.from({ length: 10 }, (_, i) => i + 1);

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
      <Label className="mb-1.5 text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
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
  fd.set("firstNameAr", data.firstNameAr ?? "");
  fd.set("middleName", data.middleName ?? "");
  fd.set("lastName", data.lastName);
  fd.set("lastNameAr", data.lastNameAr ?? "");
  fd.set("dateOfBirth", data.dateOfBirth ?? "");
  fd.set("placeOfBirth", data.placeOfBirth ?? "");
  fd.set("gender", data.gender ?? "");
  fd.set("nationality", data.nationality ?? "");
  fd.set("religion", data.religion ?? "");
  fd.set("idNumber", data.idNumber ?? "");
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
  fd.set("milkScoop", String(data.milkScoop ?? 0));
  fd.set("milkTime1", data.milkTime1 ?? "");
  fd.set("milkTime2", data.milkTime2 ?? "");
  fd.set("milkTime3", data.milkTime3 ?? "");
  fd.set("lunchIncluded", String(data.lunchIncluded ?? true));
  fd.set("sleepFrom", data.sleepFrom ?? "");
  fd.set("sleepTo", data.sleepTo ?? "");
  fd.set("remarks", data.remarks ?? "");
  fd.set("language", data.language ?? "");
  fd.set("previousGarderie", String(data.previousGarderie ?? false));
  fd.set("previousGarderieName", data.previousGarderieName ?? "");

  // Nested objects as JSON strings
  if (data.mother) fd.set("mother", JSON.stringify(data.mother));
  if (data.father) fd.set("father", JSON.stringify(data.father));
  fd.set("relatives", JSON.stringify(data.relatives ?? []));
  fd.set("accountingEntries", JSON.stringify(data.accountingEntries ?? []));

  return fd;
}

// ── Reusable guardian section ──

function GuardianSection({
  type,
  register,
  control,
  errors,
}: {
  type: "mother" | "father";
  register: ReturnType<typeof useForm<ChildFormValues>>["register"];
  control: ReturnType<typeof useForm<ChildFormValues>>["control"];
  errors: ReturnType<typeof useForm<ChildFormValues>>["formState"]["errors"];
}) {
  const label = type === "mother" ? "Mother" : "Father";
  const parentErrors = errors[type];

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">{label} Information</CardTitle>
        <CardDescription>
          Contact, identification, and details for the {type}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField label="First Name" error={parentErrors?.firstName?.message}>
            <Input
              {...register(`${type}.firstName`)}
              placeholder={`${label}'s first name`}
            />
          </FormField>

          <FormField label="Last Name" error={parentErrors?.lastName?.message}>
            <Input
              {...register(`${type}.lastName`)}
              placeholder={`${label}'s last name`}
            />
          </FormField>

          <FormField label="Nationality" error={parentErrors?.nationality?.message}>
            <Controller
              name={`${type}.nationality`}
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    {NATIONALITIES.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Profession" error={parentErrors?.profession?.message}>
            <Input
              {...register(`${type}.profession`)}
              placeholder="Occupation / Profession"
            />
          </FormField>

          <FormField label="Workplace" error={parentErrors?.workplace?.message}>
            <Input
              {...register(`${type}.workplace`)}
              placeholder="Company or workplace"
            />
          </FormField>

          <FormField label="Work Phone" error={parentErrors?.workPhone?.message}>
            <Input
              {...register(`${type}.workPhone`)}
              placeholder="+961 XX XXX XXX"
            />
          </FormField>

          <FormField label="Phone" error={parentErrors?.phone?.message}>
            <Input
              {...register(`${type}.phone`)}
              placeholder="+961 XX XXX XXX"
            />
          </FormField>

          <FormField label="Mobile" required error={parentErrors?.mobile?.message}>
            <Input
              {...register(`${type}.mobile`)}
              placeholder="+961 XX XXX XXX"
            />
          </FormField>

          <FormField label="Email" error={parentErrors?.email?.message}>
            <Input
              type="email"
              {...register(`${type}.email`)}
              placeholder={`${type}@email.com`}
            />
          </FormField>

          <FormField label="ID Number" error={parentErrors?.idNumber?.message}>
            <Input
              {...register(`${type}.idNumber`)}
              placeholder="National ID or passport number"
            />
          </FormField>

          <FormField label="Can Pick Up" error={parentErrors?.canPickUp?.message}>
            <Controller
              name={`${type}.canPickUp`}
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? "yes" : "no"}
                  onValueChange={(v) => field.onChange(v === "yes")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Can pick up?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Medical Case" error={parentErrors?.medicalCase?.message}>
            <Controller
              name={`${type}.medicalCase`}
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select if applicable" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICAL_CASES.map((mc) => (
                      <SelectItem key={mc} value={mc}>{mc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField label="Marital Status" error={parentErrors?.maritalStatus?.message}>
            <Controller
              name={`${type}.maritalStatus`}
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARITAL_STATUSES.map((ms) => (
                      <SelectItem key={ms} value={ms}>{ms}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Divorce Situation" error={parentErrors?.divorceSituation?.message}>
            <Controller
              name={`${type}.divorceSituation`}
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select if applicable" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIVORCE_SITUATIONS.map((ds) => (
                      <SelectItem key={ds} value={ds}>{ds}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main form component ──

export function ChildForm({ defaultValues, childId }: ChildFormProps) {
  const isEditing = !!childId;
  const router = useRouter();

  // Dynamic data from server
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [schoolYears, setSchoolYears] = useState<Array<{ id: string; label: string }>>([]);

  useEffect(() => {
    async function loadOptions() {
      const [branchesResult, classesResult, schoolYearsResult] = await Promise.all([
        getBranches(),
        getClasses(),
        getSchoolYears(),
      ]);
      if (branchesResult.success && branchesResult.data) {
        setBranches(branchesResult.data as Array<{ id: string; name: string }>);
      }
      if (classesResult.success && classesResult.data) {
        setClasses(classesResult.data as Array<{ id: string; name: string }>);
      }
      if (schoolYearsResult.success && schoolYearsResult.data) {
        setSchoolYears(schoolYearsResult.data as Array<{ id: string; label: string }>);
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
      firstNameAr: "",
      middleName: "",
      lastName: "",
      lastNameAr: "",
      dateOfBirth: "",
      placeOfBirth: "",
      gender: undefined,
      nationality: "",
      religion: "",
      idNumber: "",
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
        profession: "",
        workplace: "",
        workPhone: "",
        maritalStatus: "",
        divorceSituation: "",
        medicalCase: "",
        canPickUp: true,
        idNumber: "",
      },
      father: {
        firstName: "",
        lastName: "",
        nationality: "",
        phone: "",
        mobile: "",
        email: "",
        profession: "",
        workplace: "",
        workPhone: "",
        maritalStatus: "",
        divorceSituation: "",
        medicalCase: "",
        canPickUp: true,
        idNumber: "",
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
      milkScoop: 0,
      milkTime1: "",
      milkTime2: "",
      milkTime3: "",
      lunchIncluded: true,
      sleepFrom: "",
      sleepTo: "",
      remarks: "",
      language: "",
      previousGarderie: false,
      previousGarderieName: "",
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

  const watchPreviousGarderie = watch("previousGarderie");

  async function onSubmit(data: ChildFormValues) {
    const fd = toFormData(data);
    let result;
    if (isEditing && childId) {
      result = await updateChild(childId, fd);
    } else {
      result = await createChild(fd);
    }
    if (result.success) {
      toast.success(isEditing ? "Child updated successfully" : "Child enrolled successfully");
      router.push("/children");
    } else {
      toast.error(result.error || "Failed to save");
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
      toast.success("Draft saved successfully");
      router.push("/children/drafts");
    } else {
      toast.error(result.error || "Failed to save draft");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-border bg-transparent px-0">
          <TabsTrigger value="basic" className="gap-1.5 data-[state=active]:text-primary after:bg-primary">
            <User className="size-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="guardians" className="gap-1.5 data-[state=active]:text-primary after:bg-primary">
            <Users className="size-4" />
            Guardian Info
          </TabsTrigger>
          <TabsTrigger value="enrollment" className="gap-1.5 data-[state=active]:text-primary after:bg-primary">
            <GraduationCap className="size-4" />
            Enrollment
          </TabsTrigger>
          <TabsTrigger value="care" className="gap-1.5 data-[state=active]:text-primary after:bg-primary">
            <Heart className="size-4" />
            Care Preferences
          </TabsTrigger>
          <TabsTrigger value="relatives" className="gap-1.5 data-[state=active]:text-primary after:bg-primary">
            <UserPlus className="size-4" />
            Relatives
          </TabsTrigger>
          <TabsTrigger value="accounting" className="gap-1.5 data-[state=active]:text-primary after:bg-primary">
            <Receipt className="size-4" />
            Accounting
          </TabsTrigger>
          <TabsTrigger value="attachments" className="gap-1.5 data-[state=active]:text-primary after:bg-primary">
            <Paperclip className="size-4" />
            Attachments
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
                <FormField label="First Name (EN)" required error={errors.firstName?.message}>
                  <Input {...register("firstName")} placeholder="Enter first name" />
                </FormField>

                <FormField label="First Name (AR)" error={errors.firstNameAr?.message}>
                  <Input {...register("firstNameAr")} placeholder="الاسم الأول" dir="rtl" />
                </FormField>

                <FormField label="Middle Name" error={errors.middleName?.message}>
                  <Input {...register("middleName")} placeholder="Enter middle name" />
                </FormField>

                <FormField label="Last Name (EN)" required error={errors.lastName?.message}>
                  <Input {...register("lastName")} placeholder="Enter last name" />
                </FormField>

                <FormField label="Last Name (AR)" error={errors.lastNameAr?.message}>
                  <Input {...register("lastNameAr")} placeholder="اسم العائلة" dir="rtl" />
                </FormField>

                <FormField label="Date of Birth" required error={errors.dateOfBirth?.message}>
                  <Input type="date" {...register("dateOfBirth")} />
                </FormField>

                <FormField label="Place of Birth" error={errors.placeOfBirth?.message}>
                  <Input {...register("placeOfBirth")} placeholder="Enter place of birth" />
                </FormField>

                <FormField label="Gender" required error={errors.gender?.message}>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
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

                <FormField label="Nationality" error={errors.nationality?.message}>
                  <Controller
                    name="nationality"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                        <SelectContent>
                          {NATIONALITIES.map((n) => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="Religion" error={errors.religion?.message}>
                  <Controller
                    name="religion"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select religion" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELIGIONS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="ID Number" error={errors.idNumber?.message}>
                  <Input {...register("idNumber")} placeholder="National ID or document number" />
                </FormField>

                <FormField label="Blood Type" error={errors.bloodType?.message}>
                  <Controller
                    name="bloodType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select blood type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_TYPES.map((bt) => (
                            <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="Photo URL" error={errors.photo?.message}>
                  <Input {...register("photo")} placeholder="Photo URL or upload path" />
                </FormField>
              </div>

              <div className="mt-4">
                <FormField label="Allergies" error={errors.allergies?.message}>
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
            <GuardianSection
              type="father"
              register={register}
              control={control}
              errors={errors}
            />
            <GuardianSection
              type="mother"
              register={register}
              control={control}
              errors={errors}
            />
          </div>
        </TabsContent>

        {/* ── Enrollment Tab ── */}
        <TabsContent value="enrollment">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Enrollment Information</CardTitle>
              <CardDescription>
                Branch assignment, class placement, and enrollment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                <FormField label="Branch" required error={errors.branchId?.message}>
                  <Controller
                    name="branchId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((b) => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="Class" required error={errors.classId?.message}>
                  <Controller
                    name="classId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="School Year" required error={errors.schoolYearId?.message}>
                  <Controller
                    name="schoolYearId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select school year" />
                        </SelectTrigger>
                        <SelectContent>
                          {schoolYears.map((y) => (
                            <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="Enrollment Date" error={errors.enrollmentDate?.message}>
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
                  <Label htmlFor="isActive" className="cursor-pointer text-foreground">
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
                  <Label htmlFor="isDraft" className="cursor-pointer text-foreground">
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Preferred language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="Bus Service" error={errors.busAttendance?.message}>
                  <Controller
                    name="busAttendance"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? "true" : "false"}
                        onValueChange={(v) => field.onChange(v !== "false")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Bus service" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="Lunch Included" error={errors.lunchIncluded?.message}>
                  <Controller
                    name="lunchIncluded"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? "yes" : "no"}
                        onValueChange={(v) => field.onChange(v === "yes")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Lunch included?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="Diaper Type" error={errors.diaperType?.message}>
                  <Controller
                    name="diaperType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select diaper type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIAPER_TYPES.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select milk type" />
                        </SelectTrigger>
                        <SelectContent>
                          {MILK_TYPES.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="Milk Portions (ML)" error={errors.milkPortions?.message}>
                  <Input
                    type="number"
                    min={0}
                    {...register("milkPortions")}
                    placeholder="0"
                  />
                </FormField>

                <FormField label="Milk Scoop" error={errors.milkScoop?.message}>
                  <Controller
                    name="milkScoop"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Number of scoops" />
                        </SelectTrigger>
                        <SelectContent>
                          {MILK_SCOOPS.map((s) => (
                            <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField label="Milk Time 1" error={errors.milkTime1?.message}>
                  <Input type="time" {...register("milkTime1")} />
                </FormField>

                <FormField label="Milk Time 2" error={errors.milkTime2?.message}>
                  <Input type="time" {...register("milkTime2")} />
                </FormField>

                <FormField label="Milk Time 3" error={errors.milkTime3?.message}>
                  <Input type="time" {...register("milkTime3")} />
                </FormField>

                <FormField label="Sleep From" error={errors.sleepFrom?.message}>
                  <Input type="time" {...register("sleepFrom")} />
                </FormField>

                <FormField label="Sleep To" error={errors.sleepTo?.message}>
                  <Input type="time" {...register("sleepTo")} />
                </FormField>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Controller
                    name="previousGarderie"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="previousGarderie"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="previousGarderie" className="cursor-pointer text-foreground">
                    Child attended another garderie before
                  </Label>
                </div>

                {watchPreviousGarderie && (
                  <FormField label="Previous Garderie Name" error={errors.previousGarderieName?.message}>
                    <Input
                      {...register("previousGarderieName")}
                      placeholder="Name of previous garderie"
                    />
                  </FormField>
                )}
              </div>

              <div className="mt-6">
                <FormField label="Remarks / Special Needs" error={errors.remarks?.message}>
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
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                  <UserPlus className="mb-3 size-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No relatives added yet.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Click &quot;Add Relative&quot; to add emergency contacts and
                    authorized persons.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {relativeFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-lg border border-border bg-muted/30 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          Relative #{index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                              className="cursor-pointer text-foreground"
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
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                  <Receipt className="mb-3 size-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No accounting entries yet.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Click &quot;Add Entry&quot; to add fees, payments, or
                    adjustments.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Table header */}
                  <div className="hidden grid-cols-[1fr_150px_180px_40px] gap-4 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                    <span>Description</span>
                    <span>Amount</span>
                    <span>Type</span>
                    <span />
                  </div>

                  {accountingFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-[1fr_150px_180px_40px] md:items-start md:rounded-none md:border-0 md:bg-transparent md:p-0 md:px-4"
                    >
                      <FormField
                        label="Description"
                        className="md:hidden"
                        error={errors.accountingEntries?.[index]?.description?.message}
                      >
                        <Input
                          {...register(`accountingEntries.${index}.description`)}
                          placeholder="e.g. Monthly tuition"
                        />
                      </FormField>
                      <div className="hidden md:block">
                        <Input
                          {...register(`accountingEntries.${index}.description`)}
                          placeholder="e.g. Monthly tuition"
                          aria-invalid={!!errors.accountingEntries?.[index]?.description}
                        />
                        {errors.accountingEntries?.[index]?.description && (
                          <p className="mt-1 text-xs text-destructive">
                            {errors.accountingEntries[index].description?.message}
                          </p>
                        )}
                      </div>

                      <FormField
                        label="Amount"
                        className="md:hidden"
                        error={errors.accountingEntries?.[index]?.amount?.message}
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
                          aria-invalid={!!errors.accountingEntries?.[index]?.amount}
                        />
                        {errors.accountingEntries?.[index]?.amount && (
                          <p className="mt-1 text-xs text-destructive">
                            {errors.accountingEntries[index].amount?.message}
                          </p>
                        )}
                      </div>

                      <FormField
                        label="Type"
                        className="md:hidden"
                        error={errors.accountingEntries?.[index]?.type?.message}
                      >
                        <Controller
                          name={`accountingEntries.${index}.type`}
                          control={control}
                          render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FEE">Fee</SelectItem>
                                <SelectItem value="DISCOUNT">Discount</SelectItem>
                                <SelectItem value="PAYMENT">Payment</SelectItem>
                                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
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
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FEE">Fee</SelectItem>
                                <SelectItem value="DISCOUNT">Discount</SelectItem>
                                <SelectItem value="PAYMENT">Payment</SelectItem>
                                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.accountingEntries?.[index]?.type && (
                          <p className="mt-1 text-xs text-destructive">
                            {errors.accountingEntries[index].type?.message}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end md:pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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

        {/* ── Attachments Tab ── */}
        <TabsContent value="attachments">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Attachments</CardTitle>
              <CardDescription>
                Upload documents such as photos, ID copies, vaccination cards,
                doctor assessments, and medical reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                <Paperclip className="mb-3 size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isEditing
                    ? "Attachment management will be available after saving."
                    : "Save the enrollment first, then add attachments."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supported: Photo, ID, Vaccination Card, Doctor Assessment, Medical Report
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Sticky Action Bar ── */}
      <div className="sticky bottom-0 z-10 -mx-6 -mb-6 border-t border-border bg-white px-6 py-4">
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save as Draft
          </Button>
          <Button
            type="submit"
            className="bg-primary text-white hover:bg-[#18a08c]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {isEditing ? "Update Child" : "Submit Enrollment"}
          </Button>
        </div>
      </div>
    </form>
  );
}
