"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  employeeFormSchema,
  type EmployeeFormValues,
} from "@/lib/validations/employee";
import type { EmployeeType } from "@/components/employees/employee-columns";
import { createEmployee, updateEmployee } from "@/lib/actions/employees";
import { getClasses } from "@/lib/actions/classes";
import { uploadFileWithPresign } from "@/lib/uploads/client-upload";
import { PageHeader } from "@/components/layout/page-header";
import { FormSection } from "@/components/ui/form-section";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Save,
  ArrowLeft,
  User,
  Plus,
  Trash2,
  Upload,
  FileText,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Branch {
  id: string;
  name: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface EmployeeFormClientProps {
  type: EmployeeType;
  branches: Branch[];
  classes?: ClassOption[];
  employee?: EmployeeFormValues & { id: string };
}

const labels: Record<EmployeeType, { singular: string; plural: string; pluralLower: string }> = {
  teacher: { singular: "Teacher", plural: "Teachers", pluralLower: "teachers" },
  nurse: { singular: "Nurse", plural: "Nurses", pluralLower: "nurses" },
  doctor: { singular: "Doctor", plural: "Doctors", pluralLower: "doctors" },
  manager: { singular: "Manager", plural: "Managers", pluralLower: "managers" },
};

const MARITAL_STATUSES = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
];

const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

const LANGUAGE_OPTIONS = [
  { value: "ENGLISH", label: "English" },
  { value: "FRENCH", label: "French" },
  { value: "ARABIC", label: "Arabic" },
];

const PROFICIENCY_LEVELS = [
  { value: "NONE", label: "None" },
  { value: "BASIC", label: "Basic" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "FLUENT", label: "Fluent" },
];

function employeeDocumentScope(type: EmployeeType) {
  switch (type) {
    case "teacher":
      return "teacher-document";
    case "nurse":
      return "nurse-document";
    case "doctor":
      return "doctor-document";
    case "manager":
      return "manager-document";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmployeeFormClient({
  type,
  branches,
  classes = [],
  employee,
}: EmployeeFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<Array<File | null>>([]);
  const isEditing = !!employee;
  const { singular, plural, pluralLower } = labels[type];

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: employee ?? {
      username: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      placeOfBirth: "",
      registerNumber: "",
      nationality: "",
      maritalStatus: "",
      numberOfChildren: 0,
      gender: "",
      medicalCase: false,
      medicalCaseDescription: "",
      phone: "",
      telephone: "",
      mobile: "",
      email: "",
      cnss: "",
      cnssNo: "",
      secondaryDegree: "",
      secondaryDegreeYear: "",
      universityDegree: "",
      universityDegreeYear: "",
      licenseNumber: "",
      hireDate: "",
      specialization: "",
      branchId: "",
      classId: "",
      isActive: true,
      remarks: "",
      address: { governorate: "", district: "", region: "", city: "", street: "", building: "" },
      languages: [],
      experiences: [],
      documents: [],
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = form;

  // Field arrays
  const {
    fields: langFields,
    append: appendLang,
    remove: removeLang,
  } = useFieldArray({ control, name: "languages" });

  const {
    fields: expFields,
    append: appendExp,
    remove: removeExp,
  } = useFieldArray({ control, name: "experiences" });

  const {
    fields: docFields,
    append: appendDoc,
    remove: removeDoc,
  } = useFieldArray({ control, name: "documents" });

  // Fetch classes filtered by selected branch
  const [filteredClasses, setFilteredClasses] = useState<ClassOption[]>(classes);
  const watchedBranchId = watch("branchId");
  const branchInitRef = useRef(true);
  useEffect(() => {
    if (type !== "teacher") return;
    if (!watchedBranchId) {
      setFilteredClasses([]);
      return;
    }
    async function loadClasses() {
      const result = await getClasses({ branchId: watchedBranchId });
      if (result.success && result.data) {
        setFilteredClasses(
          (result.data as Array<{ id: string; name: string }>).map((c) => ({
            id: c.id,
            name: c.name,
          })),
        );
      } else {
        setFilteredClasses([]);
      }
    }
    loadClasses();
    if (branchInitRef.current) {
      branchInitRef.current = false;
    } else {
      setValue("classId", "");
    }
  }, [watchedBranchId, type, setValue]);

  // Filtered experience helpers
  const workExps = expFields.map((f, i) => ({ ...f, index: i })).filter((f) => f.type === "WORK");
  const stageExps = expFields.map((f, i) => ({ ...f, index: i })).filter((f) => f.type === "STAGE");
  const workshopExps = expFields.map((f, i) => ({ ...f, index: i })).filter((f) => f.type === "WORKSHOP");

  // Filtered documents helpers
  const indexedDocs = docFields.map((f, i) => ({ ...f, index: i }));
  const contractDocs = indexedDocs.filter((f) => f.type === "CONTRACT");
  const medicalDocs = indexedDocs.filter((f) => f.type === "MEDICAL_TEST");
  const firstAidDocs = indexedDocs.filter((f) => f.type === "FIRST_AID");
  const certDocs = indexedDocs.filter((f) => f.type === "CERTIFICATE");
  const attachDocs = indexedDocs.filter((f) => f.type === "ATTACHMENT");

  function appendDocument(doc: EmployeeFormValues["documents"][number]) {
    appendDoc(doc);
    setDocumentFiles((current) => {
      const next = [...current];
      next[docFields.length] = null;
      return next;
    });
  }

  function removeDocument(index: number) {
    removeDoc(index);
    setDocumentFiles((current) => {
      const next = [...current];
      next.splice(index, 1);
      return next;
    });
  }

  function setDocumentFile(index: number, file: File) {
    setValue(`documents.${index}.fileUrl`, "", { shouldDirty: true });
    if (!watch(`documents.${index}.title`)) {
      setValue(`documents.${index}.title`, file.name, { shouldDirty: true });
    }
    setDocumentFiles((current) => {
      const next = [...current];
      next[index] = file;
      return next;
    });
  }

  function onSubmit(data: EmployeeFormValues) {
    setError(null);
    startTransition(async () => {
      let payload = data;
      const filesToUpload: Array<{ file: File; index: number }> = [];
      documentFiles.forEach((file, index) => {
        if (file) filesToUpload.push({ file, index });
      });

      if (filesToUpload.length) {
        if (!data.branchId) {
          setError("Cannot upload documents because the employee branch is unavailable");
          return;
        }

        try {
          const nextDocuments = [...data.documents];
          for (const { file, index } of filesToUpload) {
            const uploaded = await uploadFileWithPresign({
              branchId: data.branchId,
              scope: employeeDocumentScope(type),
              ownerId: employee?.id,
              file,
            });
            const existingDocument =
              nextDocuments[index] ?? {
                type: "ATTACHMENT" as const,
                title: "",
                date: "",
                expiryDate: "",
                fileUrl: "",
              };
            nextDocuments[index] = {
              ...existingDocument,
              title: existingDocument.title || file.name,
              fileUrl: uploaded.publicUrl,
            };
          }
          payload = { ...data, documents: nextDocuments };
        } catch (uploadError) {
          setError(
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload employee documents",
          );
          return;
        }
      }

      const result = isEditing
        ? await updateEmployee(type, employee!.id, payload)
        : await createEmployee(type, payload);

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      router.push(`/employees/${pluralLower}`);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title={isEditing ? `Edit ${singular}` : `New ${singular}`}
        breadcrumbs={[
          { label: "Employees" },
          { label: plural, href: `/employees/${pluralLower}` },
          { label: isEditing ? "Edit" : "New" },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* ── Left sidebar: profile photo + save button ── */}
          <div className="space-y-4">
            <div className="rounded-sm border border-border bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex size-40 items-center justify-center rounded-full bg-muted/50">
                <User className="size-20 text-[#c5ccd6]" />
              </div>
              <p className="mt-4 text-lg font-semibold text-foreground">
                {watch("firstName") || watch("lastName")
                  ? `${watch("firstName")} ${watch("lastName")}`
                  : `New ${singular}`}
              </p>
            </div>

            {error && (
              <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="size-4" />
                {isPending ? "Saving..." : isEditing ? `Update ${singular}` : `Create ${singular}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/employees/${pluralLower}`)}
              >
                <ArrowLeft className="size-4" />
                Back to {plural}
              </Button>
            </div>
          </div>

          {/* ── Right: 6-section tabbed layout ── */}
          <Tabs orientation="vertical" defaultValue="account" className="min-h-0 lg:flex-row">
            {/* Vertical tab list — desktop */}
            <TabsList variant="line" className="hidden lg:flex w-[180px] shrink-0 sticky top-4 self-start">
              <TabsTrigger value="account" className="text-left text-xs">A. Account & Core</TabsTrigger>
              <TabsTrigger value="contact" className="text-left text-xs">B. Contact & Address</TabsTrigger>
              <TabsTrigger value="education" className="text-left text-xs">C. Education & Languages</TabsTrigger>
              <TabsTrigger value="experience" className="text-left text-xs">D. Experience</TabsTrigger>
              <TabsTrigger value="placement" className="text-left text-xs">E. Placement</TabsTrigger>
              <TabsTrigger value="documents" className="text-left text-xs">F. Documents</TabsTrigger>
            </TabsList>
            {/* Horizontal tab list — mobile */}
            <TabsList className="lg:hidden flex-wrap h-auto gap-1 mb-4">
              <TabsTrigger value="account" className="text-xs">A. Account</TabsTrigger>
              <TabsTrigger value="contact" className="text-xs">B. Contact</TabsTrigger>
              <TabsTrigger value="education" className="text-xs">C. Education</TabsTrigger>
              <TabsTrigger value="experience" className="text-xs">D. Experience</TabsTrigger>
              <TabsTrigger value="placement" className="text-xs">E. Placement</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs">F. Documents</TabsTrigger>
            </TabsList>

            {/* ── Section A: Account & Core Info ── */}
            <TabsContent value="account" className="space-y-6">
              <FormSection title="System Username" color="purple">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" {...register("username")} placeholder="Username" />
                  </div>
                </div>
              </FormSection>

              <FormSection title={`${singular} Info`} color="blue">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="firstName" {...register("firstName")} placeholder="First Name" />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="lastName" {...register("lastName")} placeholder="Last Name" />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                  </div>
                  <div>
                    <Label htmlFor="placeOfBirth">Place of Birth</Label>
                    <Input id="placeOfBirth" {...register("placeOfBirth")} placeholder="Place of Birth" />
                  </div>
                  <div>
                    <Label htmlFor="registerNumber">Register #</Label>
                    <Input id="registerNumber" {...register("registerNumber")} placeholder="Register Number" />
                  </div>
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input id="nationality" {...register("nationality")} placeholder="Nationality" />
                  </div>
                  <div>
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select
                      value={watch("maritalStatus") || ""}
                      onValueChange={(v) => setValue("maritalStatus", v as EmployeeFormValues["maritalStatus"])}
                    >
                      <SelectTrigger id="maritalStatus">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {MARITAL_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="numberOfChildren">Children Count</Label>
                    <Input
                      id="numberOfChildren"
                      type="number"
                      min={0}
                      {...register("numberOfChildren", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={watch("gender") || ""}
                      onValueChange={(v) => setValue("gender", v as EmployeeFormValues["gender"])}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDERS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="medicalCase"
                        className="size-4 rounded border-gray-300"
                        {...register("medicalCase")}
                      />
                      <Label htmlFor="medicalCase" className="mb-0">Medical Case</Label>
                    </div>
                  </div>
                  {watch("medicalCase") && (
                    <div className="sm:col-span-2">
                      <Label htmlFor="medicalCaseDescription">Medical Case Description</Label>
                      <Input id="medicalCaseDescription" {...register("medicalCaseDescription")} placeholder="Describe medical case" />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="specialization">
                      {type === "doctor" ? "Studied Domain" : "Specialization"}
                    </Label>
                    <Input
                      id="specialization"
                      {...register("specialization")}
                      placeholder={type === "doctor" ? "Studied Domain" : "Specialization"}
                    />
                  </div>
                  {type === "doctor" && (
                    <div>
                      <Label htmlFor="licenseNumber">Registration / License No</Label>
                      <Input
                        id="licenseNumber"
                        {...register("licenseNumber")}
                        placeholder="Registration number"
                      />
                    </div>
                  )}
                </div>
              </FormSection>
            </TabsContent>

            {/* ── Section B: Contact & Address ── */}
            <TabsContent value="contact" className="space-y-6">
              <FormSection title="Address" color="green">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label htmlFor="address.governorate">Governorate</Label>
                    <Input id="address.governorate" {...register("address.governorate")} placeholder="Governorate" />
                  </div>
                  <div>
                    <Label htmlFor="address.district">District</Label>
                    <Input id="address.district" {...register("address.district")} placeholder="District" />
                  </div>
                  <div>
                    <Label htmlFor="address.region">Region</Label>
                    <Input id="address.region" {...register("address.region")} placeholder="Region" />
                  </div>
                  <div>
                    <Label htmlFor="address.city">City</Label>
                    <Input id="address.city" {...register("address.city")} placeholder="City" />
                  </div>
                  <div>
                    <Label htmlFor="address.street">Street</Label>
                    <Input id="address.street" {...register("address.street")} placeholder="Street" />
                  </div>
                  <div>
                    <Label htmlFor="address.building">Building</Label>
                    <Input id="address.building" {...register("address.building")} placeholder="Building" />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Contact" color="blue">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label htmlFor="telephone">Telephone</Label>
                    <Input id="telephone" {...register("telephone")} placeholder="Telephone" />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input id="mobile" {...register("mobile")} placeholder="Mobile #" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...register("phone")} placeholder="Phone" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register("email")} placeholder="Email Address" />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>
              </FormSection>
            </TabsContent>

            {/* ── Section C: Education & Languages ── */}
            <TabsContent value="education" className="space-y-6">
              <FormSection title="Education & CNSS" color="blue">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label htmlFor="secondaryDegree">Secondary Degree</Label>
                    <Input id="secondaryDegree" {...register("secondaryDegree")} placeholder="Secondary Degree" />
                  </div>
                  <div>
                    <Label htmlFor="secondaryDegreeYear">Secondary Degree Year</Label>
                    <Input id="secondaryDegreeYear" {...register("secondaryDegreeYear")} placeholder="Year" />
                  </div>
                  <div>
                    <Label htmlFor="universityDegree">University Degree</Label>
                    <Input id="universityDegree" {...register("universityDegree")} placeholder="University Degree" />
                  </div>
                  <div>
                    <Label htmlFor="universityDegreeYear">University Degree Year</Label>
                    <Input id="universityDegreeYear" {...register("universityDegreeYear")} placeholder="Year" />
                  </div>
                  <div>
                    <Label htmlFor="cnss">CNSS</Label>
                    <Input id="cnss" {...register("cnss")} placeholder="CNSS" />
                  </div>
                  <div>
                    <Label htmlFor="cnssNo">CNSS #</Label>
                    <Input id="cnssNo" {...register("cnssNo")} placeholder="CNSS Number" />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Languages" color="teal">
                {langFields.length === 0 && (
                  <p className="mb-3 text-sm text-muted-foreground">No languages added yet.</p>
                )}
                <div className="space-y-3">
                  {langFields.map((field, index) => (
                    <div key={field.id} className="flex flex-wrap items-end gap-3 rounded-sm border bg-muted/30 p-3">
                      <div className="w-32">
                        <Label>Language</Label>
                        <Controller
                          control={control}
                          name={`languages.${index}.language`}
                          render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {LANGUAGE_OPTIONS.map((l) => (
                                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="w-36">
                        <Label>Read</Label>
                        <Controller
                          control={control}
                          name={`languages.${index}.canRead`}
                          render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {PROFICIENCY_LEVELS.map((p) => (
                                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="w-36">
                        <Label>Write</Label>
                        <Controller
                          control={control}
                          name={`languages.${index}.canWrite`}
                          render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {PROFICIENCY_LEVELS.map((p) => (
                                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="w-36">
                        <Label>Speak</Label>
                        <Controller
                          control={control}
                          name={`languages.${index}.canSpeak`}
                          render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {PROFICIENCY_LEVELS.map((p) => (
                                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLang(index)}>
                        <Trash2 className="size-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => appendLang({ language: "ENGLISH", canRead: "NONE", canWrite: "NONE", canSpeak: "NONE" })}
                >
                  <Plus className="size-4" /> Add Language
                </Button>
              </FormSection>
            </TabsContent>

            {/* ── Section D: Experience ── */}
            <TabsContent value="experience" className="space-y-6">
              <FormSection title="Work Experience" color="yellow">
                {workExps.length === 0 && (
                  <p className="mb-3 text-sm text-muted-foreground">No work experience entries.</p>
                )}
                <div className="space-y-3">
                  {workExps.map((field) => (
                    <ExperienceRow
                      key={field.id}
                      index={field.index}
                      register={register}
                      onRemove={() => removeExp(field.index)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => appendExp({ type: "WORK", company: "", position: "", fromDate: "", toDate: "", description: "" })}
                >
                  <Plus className="size-4" /> Add Work Experience
                </Button>
              </FormSection>

              <FormSection title="Stage (Internship)" color="yellow">
                {stageExps.length === 0 && (
                  <p className="mb-3 text-sm text-muted-foreground">No stage experience entries.</p>
                )}
                <div className="space-y-3">
                  {stageExps.map((field) => (
                    <ExperienceRow
                      key={field.id}
                      index={field.index}
                      register={register}
                      onRemove={() => removeExp(field.index)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => appendExp({ type: "STAGE", company: "", position: "", fromDate: "", toDate: "", description: "" })}
                >
                  <Plus className="size-4" /> Add Stage Experience
                </Button>
              </FormSection>

              <FormSection title="Workshop" color="yellow">
                {workshopExps.length === 0 && (
                  <p className="mb-3 text-sm text-muted-foreground">No workshop entries.</p>
                )}
                <div className="space-y-3">
                  {workshopExps.map((field) => (
                    <ExperienceRow
                      key={field.id}
                      index={field.index}
                      register={register}
                      onRemove={() => removeExp(field.index)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => appendExp({ type: "WORKSHOP", company: "", position: "", fromDate: "", toDate: "", description: "" })}
                >
                  <Plus className="size-4" /> Add Workshop
                </Button>
              </FormSection>
            </TabsContent>

            {/* ── Section E: Placement ── */}
            <TabsContent value="placement" className="space-y-6">
              <FormSection title="Placement Info" color="blue">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label htmlFor="isActive">
                      Active <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch("isActive") ? "true" : "false"}
                      onValueChange={(v) => setValue("isActive", v === "true")}
                    >
                      <SelectTrigger id="isActive">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="branchId">
                      Branch <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch("branchId")}
                      onValueChange={(v) => setValue("branchId", v)}
                    >
                      <SelectTrigger id="branchId">
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.branchId && (
                      <p className="mt-1 text-xs text-red-500">{errors.branchId.message}</p>
                    )}
                  </div>
                  {type === "teacher" && (
                    <div>
                      <Label htmlFor="classId">Class</Label>
                      <Select
                        value={watch("classId") || ""}
                        onValueChange={(v) => setValue("classId", v)}
                      >
                        <SelectTrigger id="classId">
                          <SelectValue placeholder={watchedBranchId ? "Select Class" : "Select branch first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredClasses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="hireDate">Hire Date</Label>
                    <Input id="hireDate" type="date" {...register("hireDate")} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      {...register("remarks")}
                      placeholder="Any remarks..."
                      rows={3}
                    />
                  </div>
                </div>
              </FormSection>
            </TabsContent>

            {/* ── Section F: Compliance Documents ── */}
            <TabsContent value="documents" className="space-y-6">
              <FormSection title="Contract Documents" color="purple">
                {contractDocs.length === 0 && (
                  <p className="mb-3 text-sm text-muted-foreground">No contract documents.</p>
                )}
                <div className="space-y-3">
                  {contractDocs.map((field) => (
                    <DocumentRow
                      key={field.id}
                      index={field.index}
                      register={register}
                      fileUrl={watch(`documents.${field.index}.fileUrl`)}
                      selectedFileName={documentFiles[field.index]?.name}
                      onFileSelect={(file) => setDocumentFile(field.index, file)}
                      showExpiry
                      onRemove={() => removeDocument(field.index)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => appendDocument({ type: "CONTRACT", title: "", date: "", expiryDate: "", fileUrl: "" })}
                >
                  <Plus className="size-4" /> Add Contract
                </Button>
              </FormSection>

              <FormSection title="Medical Test Documents" color="purple">
                {medicalDocs.length === 0 && (
                  <p className="mb-3 text-sm text-muted-foreground">No medical test documents.</p>
                )}
                <div className="space-y-3">
                  {medicalDocs.map((field) => (
                    <DocumentRow
                      key={field.id}
                      index={field.index}
                      register={register}
                      fileUrl={watch(`documents.${field.index}.fileUrl`)}
                      selectedFileName={documentFiles[field.index]?.name}
                      onFileSelect={(file) => setDocumentFile(field.index, file)}
                      showExpiry
                      onRemove={() => removeDocument(field.index)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => appendDocument({ type: "MEDICAL_TEST", title: "", date: "", expiryDate: "", fileUrl: "" })}
                >
                  <Plus className="size-4" /> Add Medical Test
                </Button>
              </FormSection>

              <FormSection title="First Aid Documents" color="purple">
                {firstAidDocs.length === 0 && (
                  <p className="mb-3 text-sm text-muted-foreground">No first aid documents.</p>
                )}
                <div className="space-y-3">
                  {firstAidDocs.map((field) => (
                    <DocumentRow
                      key={field.id}
                      index={field.index}
                      register={register}
                      fileUrl={watch(`documents.${field.index}.fileUrl`)}
                      selectedFileName={documentFiles[field.index]?.name}
                      onFileSelect={(file) => setDocumentFile(field.index, file)}
                      showExpiry
                      onRemove={() => removeDocument(field.index)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => appendDocument({ type: "FIRST_AID", title: "", date: "", expiryDate: "", fileUrl: "" })}
                >
                  <Plus className="size-4" /> Add First Aid
                </Button>
              </FormSection>

              <FormSection title="Certificates" color="purple">
                {certDocs.length === 0 && (
                  <p className="mb-3 text-sm text-muted-foreground">No certificates.</p>
                )}
                <div className="space-y-3">
                  {certDocs.map((field) => (
                    <DocumentRow
                      key={field.id}
                      index={field.index}
                      register={register}
                      fileUrl={watch(`documents.${field.index}.fileUrl`)}
                      selectedFileName={documentFiles[field.index]?.name}
                      onFileSelect={(file) => setDocumentFile(field.index, file)}
                      showTitle
                      onRemove={() => removeDocument(field.index)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => appendDocument({ type: "CERTIFICATE", title: "", date: "", expiryDate: "", fileUrl: "" })}
                >
                  <Plus className="size-4" /> Add Certificate
                </Button>
              </FormSection>

              <FormSection title="Attachments" color="purple">
                {attachDocs.length === 0 && (
                  <p className="mb-3 text-sm text-muted-foreground">No attachments.</p>
                )}
                <div className="space-y-3">
                  {attachDocs.map((field) => (
                    <DocumentRow
                      key={field.id}
                      index={field.index}
                      register={register}
                      fileUrl={watch(`documents.${field.index}.fileUrl`)}
                      selectedFileName={documentFiles[field.index]?.name}
                      onFileSelect={(file) => setDocumentFile(field.index, file)}
                      showTitle
                      onRemove={() => removeDocument(field.index)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => appendDocument({ type: "ATTACHMENT", title: "", date: "", expiryDate: "", fileUrl: "" })}
                >
                  <Plus className="size-4" /> Add Attachment
                </Button>
              </FormSection>
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </>
  );
}

// ---------------------------------------------------------------------------
// ExperienceRow sub-component
// ---------------------------------------------------------------------------

function ExperienceRow({
  index,
  register,
  onRemove,
}: {
  index: number;
  register: ReturnType<typeof useForm<EmployeeFormValues>>["register"];
  onRemove: () => void;
}) {
  return (
    <div className="rounded-sm border bg-muted/30 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Company / Organization</Label>
          <Input {...register(`experiences.${index}.company`)} placeholder="Company" />
        </div>
        <div>
          <Label>Position</Label>
          <Input {...register(`experiences.${index}.position`)} placeholder="Position" />
        </div>
        <div>
          <Label>From</Label>
          <Input type="date" {...register(`experiences.${index}.fromDate`)} />
        </div>
        <div>
          <Label>To</Label>
          <Input type="date" {...register(`experiences.${index}.toDate`)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Description</Label>
          <Input {...register(`experiences.${index}.description`)} placeholder="Description" />
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="size-4 text-red-500" /> Remove
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DocumentRow sub-component
// ---------------------------------------------------------------------------

function DocumentRow({
  index,
  register,
  fileUrl,
  selectedFileName,
  showExpiry = false,
  showTitle: _showTitle = false,
  onFileSelect,
  onRemove,
}: {
  index: number;
  register: ReturnType<typeof useForm<EmployeeFormValues>>["register"];
  fileUrl?: string;
  selectedFileName?: string;
  showExpiry?: boolean;
  showTitle?: boolean;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-sm border bg-muted/30 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Title</Label>
          <Input {...register(`documents.${index}.title`)} placeholder="Document title" />
        </div>
        <div>
          <Label>Date</Label>
          <Input type="date" {...register(`documents.${index}.date`)} />
        </div>
        {showExpiry && (
          <div>
            <Label>Expiry Date</Label>
            <Input type="date" {...register(`documents.${index}.expiryDate`)} />
          </div>
        )}
        <div>
          <Label>File</Label>
          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFileSelect(file);
            }}
          />
          <input type="hidden" {...register(`documents.${index}.fileUrl`)} />
          {selectedFileName ? (
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Upload className="size-3" />
              {selectedFileName}
            </p>
          ) : fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex items-center gap-1 truncate text-xs text-primary hover:underline"
            >
              <FileText className="size-3" />
              Current file
            </a>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">No file selected</p>
          )}
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="size-4 text-red-500" /> Remove
        </Button>
      </div>
    </div>
  );
}
