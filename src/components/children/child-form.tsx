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
import { FormSection } from "@/components/ui/form-section";
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
  Plus,
  Trash2,
  Save,
  Send,
  Loader2,
  MapPin,
  Paperclip,
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

const ADDRESS_TYPES = ["Home", "Work", "Grandparents", "Other"];

const SIBLING_RELATIONS = ["Brother", "Sister", "Half-Brother", "Half-Sister", "Step-Brother", "Step-Sister"];

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

// ── Reusable guardian fields ──

function GuardianFields({
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
    <div>
      <h4 className="mb-4 text-sm font-semibold text-foreground">{label} Information</h4>
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
  fd.set("childNumber", data.childNumber ?? "");
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

  // Financial
  fd.set("garderieFees", String(data.garderieFees ?? 0));
  fd.set("extraFees", String(data.extraFees ?? 0));
  fd.set("busFees", String(data.busFees ?? 0));
  fd.set("apronFees", String(data.apronFees ?? 0));
  fd.set("registrationFees", String(data.registrationFees ?? 0));
  fd.set("activitiesFees", String(data.activitiesFees ?? 0));
  fd.set("discount", String(data.discount ?? 0));
  fd.set("tva", String(data.tva ?? 0));
  fd.set("financialRemarks", data.financialRemarks ?? "");

  // Nested objects as JSON strings
  if (data.mother) fd.set("mother", JSON.stringify(data.mother));
  if (data.father) fd.set("father", JSON.stringify(data.father));
  fd.set("addresses", JSON.stringify(data.addresses ?? []));
  fd.set("siblings", JSON.stringify(data.siblings ?? []));
  fd.set("relatives", JSON.stringify(data.relatives ?? []));
  fd.set("accountingEntries", JSON.stringify(data.accountingEntries ?? []));

  return fd;
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
      addresses: [],
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
      siblings: [],
      branchId: "",
      classId: "",
      schoolYearId: "",
      enrollmentDate: "",
      isActive: true,
      isDraft: false,
      childNumber: "",
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
      garderieFees: 0,
      extraFees: 0,
      busFees: 0,
      apronFees: 0,
      registrationFees: 0,
      activitiesFees: 0,
      discount: 0,
      tva: 0,
      financialRemarks: "",
      accountingEntries: [],
      ...defaultValues,
    },
  });

  const {
    fields: addressFields,
    append: appendAddress,
    remove: removeAddress,
  } = useFieldArray({ control, name: "addresses" });

  const {
    fields: siblingFields,
    append: appendSibling,
    remove: removeSibling,
  } = useFieldArray({ control, name: "siblings" });

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

  // Financial totals
  const watchFees = watch([
    "garderieFees",
    "extraFees",
    "busFees",
    "apronFees",
    "registrationFees",
    "activitiesFees",
    "discount",
    "tva",
  ]);
  const subtotal =
    Number(watchFees[0] || 0) +
    Number(watchFees[1] || 0) +
    Number(watchFees[2] || 0) +
    Number(watchFees[3] || 0) +
    Number(watchFees[4] || 0) +
    Number(watchFees[5] || 0);
  const afterDiscount = subtotal - Number(watchFees[6] || 0);
  const tvaAmount = afterDiscount * (Number(watchFees[7] || 0) / 100);
  const netTotal = afterDiscount + tvaAmount;

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
      {/* ── 1. Child Information ── */}
      <FormSection title="Child Information" color="blue">
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
      </FormSection>

      {/* ── 2. Addresses ── */}
      <FormSection
        title="Addresses"
        color="green"
        collapsible
        defaultOpen={false}
        badge={
          addressFields.length > 0 ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {addressFields.length}
            </span>
          ) : undefined
        }
      >
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendAddress({
                addressType: "",
                country: "Lebanon",
                street: "",
                building: "",
                floor: "",
                city: "",
                telephone: "",
              })
            }
          >
            <Plus className="size-4" />
            Add Address
          </Button>
        </div>

        {addressFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
            <MapPin className="mb-3 size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No addresses added yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Click &quot;Add Address&quot; to add a home or work address.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {addressFields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Address #{index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeAddress(index)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                  <FormField label="Type">
                    <Controller
                      name={`addresses.${index}.addressType`}
                      control={control}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ADDRESS_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>

                  <FormField label="Country">
                    <Input
                      {...register(`addresses.${index}.country`)}
                      placeholder="Lebanon"
                    />
                  </FormField>

                  <FormField label="City">
                    <Input
                      {...register(`addresses.${index}.city`)}
                      placeholder="City"
                    />
                  </FormField>

                  <FormField label="Street">
                    <Input
                      {...register(`addresses.${index}.street`)}
                      placeholder="Street name"
                    />
                  </FormField>

                  <FormField label="Building">
                    <Input
                      {...register(`addresses.${index}.building`)}
                      placeholder="Building name or number"
                    />
                  </FormField>

                  <FormField label="Floor">
                    <Input
                      {...register(`addresses.${index}.floor`)}
                      placeholder="Floor"
                    />
                  </FormField>

                  <FormField label="Telephone">
                    <Input
                      {...register(`addresses.${index}.telephone`)}
                      placeholder="+961 XX XXX XXX"
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        )}
      </FormSection>

      {/* ── 3. Parents ── */}
      <FormSection title="Parents" color="purple" collapsible>
        <GuardianFields
          type="father"
          register={register}
          control={control}
          errors={errors}
        />
        <Separator className="my-8" />
        <GuardianFields
          type="mother"
          register={register}
          control={control}
          errors={errors}
        />
      </FormSection>

      {/* ── 4. Brothers & Sisters ── */}
      <FormSection
        title="Brothers & Sisters"
        color="teal"
        collapsible
        defaultOpen={false}
        badge={
          siblingFields.length > 0 ? (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
              {siblingFields.length}
            </span>
          ) : undefined
        }
      >
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendSibling({
                relation: "",
                firstName: "",
                dateOfBirth: "",
                medicalCase: "",
                canPickUp: false,
              })
            }
          >
            <Plus className="size-4" />
            Add Sibling
          </Button>
        </div>

        {siblingFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No siblings added yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Click &quot;Add Sibling&quot; to add brothers or sisters.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {siblingFields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Sibling #{index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeSibling(index)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-4">
                  <FormField label="Relation">
                    <Controller
                      name={`siblings.${index}.relation`}
                      control={control}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select relation" />
                          </SelectTrigger>
                          <SelectContent>
                            {SIBLING_RELATIONS.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>

                  <FormField label="First Name">
                    <Input
                      {...register(`siblings.${index}.firstName`)}
                      placeholder="Sibling's name"
                    />
                  </FormField>

                  <FormField label="Date of Birth">
                    <Input
                      type="date"
                      {...register(`siblings.${index}.dateOfBirth`)}
                    />
                  </FormField>

                  <FormField label="Medical Case">
                    <Controller
                      name={`siblings.${index}.medicalCase`}
                      control={control}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
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

                  <div className="flex items-end pb-1">
                    <div className="flex items-center gap-3">
                      <Controller
                        name={`siblings.${index}.canPickUp`}
                        control={control}
                        render={({ field: f }) => (
                          <Checkbox
                            id={`sibling-pickup-${index}`}
                            checked={f.value}
                            onCheckedChange={f.onChange}
                          />
                        )}
                      />
                      <Label
                        htmlFor={`sibling-pickup-${index}`}
                        className="cursor-pointer text-foreground"
                      >
                        Can pick up
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </FormSection>

      {/* ── 5. Authorized Persons ── */}
      <FormSection
        title="Authorized Persons"
        color="yellow"
        collapsible
        badge={
          relativeFields.length > 0 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {relativeFields.length}
            </span>
          ) : undefined
        }
      >
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendRelative({
                name: "",
                lastName: "",
                relation: "",
                phone: "",
                mobile: "",
                isAuthorized: false,
                isEmergencyContact: false,
              })
            }
          >
            <Plus className="size-4" />
            Add Person
          </Button>
        </div>

        {relativeFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No authorized persons added yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Click &quot;Add Person&quot; to add emergency contacts and
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
                    Person #{index + 1}
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
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    label="First Name"
                    required
                    error={errors.relatives?.[index]?.name?.message}
                  >
                    <Input
                      {...register(`relatives.${index}.name`)}
                      placeholder="First name"
                    />
                  </FormField>

                  <FormField label="Last Name">
                    <Input
                      {...register(`relatives.${index}.lastName`)}
                      placeholder="Last name"
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

                  <FormField label="Mobile">
                    <Input
                      {...register(`relatives.${index}.mobile`)}
                      placeholder="+961 XX XXX XXX"
                    />
                  </FormField>

                  <div className="flex items-end gap-6 pb-1">
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
                        Authorized
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Controller
                        name={`relatives.${index}.isEmergencyContact`}
                        control={control}
                        render={({ field: f }) => (
                          <Checkbox
                            id={`relative-emergency-${index}`}
                            checked={f.value}
                            onCheckedChange={f.onChange}
                          />
                        )}
                      />
                      <Label
                        htmlFor={`relative-emergency-${index}`}
                        className="cursor-pointer text-foreground"
                      >
                        Emergency Contact
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </FormSection>

      {/* ── 6. General Information ── */}
      <FormSection title="General Information" color="blue" collapsible>
        {/* Enrollment */}
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

          <FormField label="Child Number" error={errors.childNumber?.message}>
            <Input {...register("childNumber")} placeholder="Internal ID" />
          </FormField>
        </div>

        <div className="mt-4 flex flex-wrap gap-8">
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

        <Separator className="my-6" />

        {/* Care Preferences */}
        <h4 className="mb-4 text-sm font-semibold text-foreground">Care Preferences</h4>
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
      </FormSection>

      {/* ── 7. Financial Information ── */}
      <FormSection title="Financial Information" color="red" collapsible defaultOpen={false}>
        <h4 className="mb-4 text-sm font-semibold text-foreground">Fee Schedule</h4>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField label="Garderie Fees" error={errors.garderieFees?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("garderieFees")}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Extra Fees" error={errors.extraFees?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("extraFees")}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Bus Fees" error={errors.busFees?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("busFees")}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Apron Fees" error={errors.apronFees?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("apronFees")}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Registration Fees" error={errors.registrationFees?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("registrationFees")}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Activities Fees" error={errors.activitiesFees?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("activitiesFees")}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Discount" error={errors.discount?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("discount")}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="TVA (%)" error={errors.tva?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register("tva")}
              placeholder="0"
            />
          </FormField>
        </div>

        {/* Computed totals */}
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-y-2 text-sm md:grid-cols-4">
            <div>
              <span className="text-muted-foreground">Subtotal</span>
              <p className="font-medium">${subtotal.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">After Discount</span>
              <p className="font-medium">${afterDiscount.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">TVA Amount</span>
              <p className="font-medium">${tvaAmount.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Net Total</span>
              <p className="text-base font-bold text-primary">${netTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <FormField label="Financial Remarks" error={errors.financialRemarks?.message}>
            <Textarea
              {...register("financialRemarks")}
              placeholder="Any notes about payment arrangements, special discounts, etc."
              className="min-h-20"
            />
          </FormField>
        </div>

        <Separator className="my-6" />

        {/* Accounting Entries */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Accounting Entries</h4>
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

        {accountingFields.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No accounting entries yet.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {accountingFields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-[1fr_150px_180px_40px] md:items-start"
              >
                <FormField
                  label="Description"
                  error={errors.accountingEntries?.[index]?.description?.message}
                >
                  <Input
                    {...register(`accountingEntries.${index}.description`)}
                    placeholder="e.g. Monthly tuition"
                  />
                </FormField>

                <FormField
                  label="Amount"
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

                <FormField
                  label="Type"
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

                <div className="flex justify-end md:pt-6">
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
      </FormSection>

      {/* ── 8. Attachments ── */}
      <FormSection title="Attachments" color="green" collapsible defaultOpen={false}>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
          <Paperclip className="mb-3 size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Attachment management will be available after saving."
              : "Save the enrollment first, then add attachments."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Coming soon &mdash; Photo, ID, Vaccination Card, Doctor Assessment, Medical Report
          </p>
        </div>
      </FormSection>

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
