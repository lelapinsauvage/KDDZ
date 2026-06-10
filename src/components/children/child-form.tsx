"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { childFormSchema, type ChildFormValues } from "@/lib/validations/child";
import { createChild, updateChild } from "@/lib/actions/children";
import { uploadFileWithPresign } from "@/lib/uploads/client-upload";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { getSchoolYears } from "@/lib/actions/school-years";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  ImageIcon,
  Upload,
  X,
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

const WIZARD_STEPS = [
  { label: "Core Child Info" },
  { label: "Addresses & Family" },
  { label: "General & Medical" },
  { label: "Financial Info" },
  { label: "Attachments" },
  { label: "Review & Submit" },
];

const DRAFT_STORAGE_KEY = "child-enrollment-draft";

const ATTACHMENT_TYPES = [
  { key: "id", label: "ID Document" },
  { key: "vaccination", label: "Vaccination Card" },
  { key: "doctor", label: "Doctor Assessment" },
  { key: "medical", label: "Medical Report" },
  { key: "other", label: "Other Attachment" },
];

const DEFAULT_MAP_COORDINATES = {
  latitude: "33.885",
  longitude: "35.513",
};

function mapPreviewHref(latitude?: string, longitude?: string) {
  const lat = latitude?.trim();
  const lng = longitude?.trim();
  if (!lat || !lng) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
}

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
        {required && <span className="ml-0.5 text-primary">*</span>}
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

type ChildAttachmentValue = NonNullable<ChildFormValues["attachments"]>[number];

interface PendingChildAttachment {
  key: string;
  type: string;
  title: string;
  file: File;
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
  fd.set("busAttendance", data.busAttendance || "false");
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
  fd.set("attachments", JSON.stringify(data.attachments ?? []));

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
      const [branchesResult, schoolYearsResult] = await Promise.all([
        getBranches(),
        getSchoolYears(),
      ]);
      if (branchesResult.success && branchesResult.data) {
        setBranches(branchesResult.data as Array<{ id: string; name: string }>);
      }
      if (schoolYearsResult.success && schoolYearsResult.data) {
        setSchoolYears(schoolYearsResult.data as Array<{ id: string; label: string }>);
      }
    }
    loadOptions();
  }, []);

  // Restore draft from localStorage on mount
  const [draftRestored, setDraftRestored] = useState(false);
  const savedDraft = typeof window !== "undefined" && !isEditing
    ? (() => { try { return JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || "null"); } catch { return null; } })()
    : null;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    trigger,
    setValue,
  } = useForm<ChildFormValues>({
    resolver: zodResolver(childFormSchema),
    mode: "onTouched",
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
      busAttendance: "false",
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
      attachments: [],
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
  const watchedBranchId = watch("branchId");
  const selectedPhotoUrl = watch("photo");
  const attachmentValues = watch("attachments") ?? [];
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingChildAttachment[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);

  const visibleExistingAttachments = attachmentValues.filter(
    (attachment): attachment is ChildAttachmentValue & { id: string } => {
      const id = attachment.id;
      if (!id) return false;
      return !removedAttachmentIds.includes(id);
    }
  );

  function setSelectedPhoto(file: File) {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  function clearSelectedPhoto() {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  }

  function addPendingAttachment(type: string, title: string, file: File) {
    setPendingAttachments((current) => [
      ...current,
      {
        key: `${type}-${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        type,
        title,
        file,
      },
    ]);
  }

  function removePendingAttachment(key: string) {
    setPendingAttachments((current) =>
      current.filter((attachment) => attachment.key !== key)
    );
  }

  function removeExistingAttachment(id: string) {
    setRemovedAttachmentIds((current) =>
      current.includes(id) ? current : [...current, id]
    );
  }

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  // Auto-save draft to localStorage on step changes (non-edit mode only)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formValues = watch();

  useEffect(() => {
    if (isEditing) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formValues));
      } catch {
        // localStorage full or unavailable
      }
    }, 1000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formValues, isEditing]);

  // Restore draft on mount
  useEffect(() => {
    if (savedDraft && !draftRestored && !isEditing) {
      const keys = Object.keys(savedDraft) as (keyof ChildFormValues)[];
      for (const key of keys) {
        if (savedDraft[key] !== undefined && savedDraft[key] !== "") {
          setValue(key, savedDraft[key]);
        }
      }
      setDraftRestored(true);
      toast.info("Draft restored from your previous session");
    }
  }, [savedDraft, draftRestored, isEditing, setValue]);

  // Refetch classes when branch changes
  const branchInitRef = useRef(true);
  useEffect(() => {
    if (!watchedBranchId) {
      setClasses([]);
      return;
    }
    async function loadClasses() {
      const result = await getClasses({ branchId: watchedBranchId });
      if (result.success && result.data) {
        setClasses(result.data as Array<{ id: string; name: string }>);
      } else {
        setClasses([]);
      }
    }
    loadClasses();
    // Clear classId on branch change, but not on initial mount (edit mode)
    if (branchInitRef.current) {
      branchInitRef.current = false;
    } else {
      setValue("classId", "");
    }
  }, [watchedBranchId, setValue]);

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

  // ── Wizard Step Management ──
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = WIZARD_STEPS.length;
  const completionPercent = Math.round((currentStep / (totalSteps - 1)) * 100);

  async function handleNextStep() {
    let valid = true;
    if (currentStep === 0) {
      valid = await trigger(["firstName", "lastName", "dateOfBirth", "gender", "branchId"]);
    } else if (currentStep === 2) {
      valid = await trigger(["classId", "schoolYearId"]);
    }
    if (!valid) return;
    setCurrentStep((s) => Math.min(totalSteps - 1, s + 1));
  }

  function handlePrevStep() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  function handleGoToStep(step: number) {
    setCurrentStep(step);
  }

  async function prepareFormDataWithUploads(
    data: ChildFormValues,
    isDraft = false
  ): Promise<FormData | null> {
    const needsFileUpload = Boolean(photoFile) || pendingAttachments.length > 0;
    if (needsFileUpload && !data.branchId) {
      toast.error("Select a branch before uploading files");
      return null;
    }

    let nextPhoto = data.photo ?? "";
    const nextAttachments: ChildAttachmentValue[] = [...(data.attachments ?? [])];

    try {
      if (photoFile && data.branchId) {
        const uploaded = await uploadFileWithPresign({
          branchId: data.branchId,
          scope: "child",
          ownerId: childId,
          file: photoFile,
        });
        nextPhoto = uploaded.publicUrl;
      }

      for (const attachment of pendingAttachments) {
        if (!data.branchId) break;
        const uploaded = await uploadFileWithPresign({
          branchId: data.branchId,
          scope: "child-document",
          ownerId: childId,
          file: attachment.file,
        });
        nextAttachments.push({
          title: attachment.title,
          filename: attachment.file.name,
          fileUrl: uploaded.publicUrl,
          type: attachment.type,
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload files"
      );
      return null;
    }

    if (photoFile) {
      setValue("photo", nextPhoto, { shouldDirty: true });
      clearSelectedPhoto();
    }
    if (pendingAttachments.length > 0) {
      setValue("attachments", nextAttachments, { shouldDirty: true });
      setPendingAttachments([]);
    }

    const fd = toFormData(
      {
        ...data,
        photo: nextPhoto,
        attachments: nextAttachments,
      },
      isDraft
    );
    if (removedAttachmentIds.length) {
      fd.set("removeAttachmentIds", JSON.stringify(removedAttachmentIds));
    }
    return fd;
  }

  async function onSubmit(data: ChildFormValues) {
    const fd = await prepareFormDataWithUploads(data);
    if (!fd) return;
    let result;
    if (isEditing && childId) {
      result = await updateChild(childId, fd);
    } else {
      result = await createChild(fd);
    }
    if (result.success) {
      // Clear draft from localStorage on successful submit
      try { localStorage.removeItem(DRAFT_STORAGE_KEY); } catch {}
      toast.success(isEditing ? "Child updated successfully" : "Child enrolled successfully");
      router.push("/children");
    } else {
      toast.error(result.error || "Failed to save");
    }
  }

  function onSubmitError(fieldErrors: typeof errors) {
    if (fieldErrors.firstName || fieldErrors.lastName || fieldErrors.dateOfBirth || fieldErrors.gender || fieldErrors.branchId) {
      setCurrentStep(0);
    } else if (fieldErrors.classId || fieldErrors.schoolYearId) {
      setCurrentStep(2);
    }
  }

  async function onSaveDraft() {
    const values = watch();
    const fd = await prepareFormDataWithUploads(values as ChildFormValues, true);
    if (!fd) return;
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
    <form onSubmit={handleSubmit(onSubmit, onSubmitError)}>
      {/* ── Mobile Step Indicator with labels + completion ── */}
      <div className="mb-6 lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {completionPercent}% complete
          </span>
        </div>
        {/* Progress bar */}
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        {/* Step labels (scrollable) */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {WIZARD_STEPS.map((step, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleGoToStep(i)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                i === currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : i < currentStep
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground",
              )}
            >
              {i < currentStep ? (
                <Check className="size-3" />
              ) : (
                <span className="flex size-4 items-center justify-center rounded-full bg-current/10 text-[10px]">{i + 1}</span>
              )}
              <span className="whitespace-nowrap">{step.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-8">
        {/* ── Desktop Step Sidebar ── */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 flex flex-col gap-1">
            {/* Completion indicator */}
            <div className="mb-3 rounded-lg border border-border bg-card p-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Progress</span>
                <span className="font-semibold text-primary">{completionPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
            {WIZARD_STEPS.map((step, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleGoToStep(i)}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm transition-colors",
                  i === currentStep
                    ? "bg-primary/10 font-medium text-primary"
                    : i < currentStep
                      ? "text-foreground hover:bg-muted"
                      : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    i === currentStep
                      ? "bg-primary text-primary-foreground"
                      : i < currentStep
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {i < currentStep ? <Check className="size-3.5" /> : i + 1}
                </div>
                <span className="leading-tight">{step.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-6">

            {/* ════════════════════════════════════════════
                 STEP 1: Core Child Info
                 ════════════════════════════════════════════ */}
            {currentStep === 0 && (
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

                  <FormField
                    label="Photo"
                    error={errors.photo?.message}
                    className="md:col-span-2 lg:col-span-3"
                  >
                    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-center">
                      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background">
                        {photoPreviewUrl || selectedPhotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoPreviewUrl || selectedPhotoUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="size-7 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <Input {...register("photo")} placeholder="Photo URL or uploaded file URL" />
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground">
                            <Upload className="size-4" />
                            Upload photo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) setSelectedPhoto(file);
                                event.target.value = "";
                              }}
                            />
                          </label>
                          {photoFile && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={clearSelectedPhoto}
                            >
                              <X className="mr-1 size-4" />
                              Clear selected
                            </Button>
                          )}
                        </div>
                        {photoFile && (
                          <p className="truncate text-xs text-muted-foreground">
                            Selected: {photoFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </FormField>
                </div>

                <Separator className="my-6" />
                <h4 className="mb-4 text-sm font-semibold text-foreground">Enrollment Basics</h4>
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

                  <FormField label="Joining Date" error={errors.enrollmentDate?.message}>
                    <Input type="date" {...register("enrollmentDate")} />
                  </FormField>

                  <FormField label="Child Number" error={errors.childNumber?.message}>
                    <Input {...register("childNumber")} placeholder="Internal ID" />
                  </FormField>
                </div>
              </FormSection>
            )}

            {/* ════════════════════════════════════════════
                 STEP 2: Addresses & Family
                 ════════════════════════════════════════════ */}
            {currentStep === 1 && (
              <>
                {/* Addresses */}
                <FormSection
                  title="Addresses"
                  color="green"
                  badge={
                    addressFields.length > 0 ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
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
                          latitude: "",
                          longitude: "",
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
                      {addressFields.map((field, index) => {
                        const latitude = watch(`addresses.${index}.latitude`);
                        const longitude = watch(`addresses.${index}.longitude`);
                        const previewHref = mapPreviewHref(latitude, longitude);
                        return (
                          <div
                            key={field.id}
                            className="rounded-lg border border-border bg-muted/30 p-4"
                          >
                          <input
                            type="hidden"
                            {...register(`addresses.${index}.recordId`)}
                          />
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

                            <FormField label="Latitude">
                              <Input
                                {...register(`addresses.${index}.latitude`)}
                                placeholder={DEFAULT_MAP_COORDINATES.latitude}
                              />
                            </FormField>

                            <FormField label="Longitude">
                              <Input
                                {...register(`addresses.${index}.longitude`)}
                                placeholder={DEFAULT_MAP_COORDINATES.longitude}
                              />
                            </FormField>

                            <div className="flex items-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setValue(
                                    `addresses.${index}.latitude`,
                                    DEFAULT_MAP_COORDINATES.latitude,
                                    { shouldDirty: true }
                                  );
                                  setValue(
                                    `addresses.${index}.longitude`,
                                    DEFAULT_MAP_COORDINATES.longitude,
                                    { shouldDirty: true }
                                  );
                                }}
                              >
                                <MapPin className="size-4" />
                                Select From Map
                              </Button>
                              {previewHref ? (
                                <Button asChild type="button" variant="ghost" size="sm">
                                  <a
                                    href={previewHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Preview Location
                                  </a>
                                </Button>
                              ) : null}
                            </div>
                          </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </FormSection>

                {/* Parents */}
                <FormSection title="Parents" color="purple">
                  <GuardianFields
                    type="father"
                    register={register}
                    control={control}
                    errors={errors}
                  />
                  <Separator className="my-8 bg-border/40" />
                  <GuardianFields
                    type="mother"
                    register={register}
                    control={control}
                    errors={errors}
                  />
                </FormSection>

                {/* Brothers & Sisters */}
                <FormSection
                  title="Brothers & Sisters"
                  color="teal"
                  collapsible
                  defaultOpen={false}
                  badge={
                    siblingFields.length > 0 ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
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
                          <input
                            type="hidden"
                            {...register(`siblings.${index}.recordId`)}
                          />
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

                {/* Authorized Persons */}
                <FormSection
                  title="Authorized Persons"
                  color="yellow"
                  collapsible
                  badge={
                    relativeFields.length > 0 ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
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
                          <input
                            type="hidden"
                            {...register(`relatives.${index}.recordId`)}
                          />
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
              </>
            )}

            {/* ════════════════════════════════════════════
                 STEP 3: General & Medical Info
                 ════════════════════════════════════════════ */}
            {currentStep === 2 && (
              <>
                {/* School Context */}
                <FormSection title="School Context" color="blue">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
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
                </FormSection>

                {/* Health */}
                <FormSection title="Health & Allergies" color="red">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
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

                {/* Logistics & Care */}
                <FormSection title="Logistics & Care" color="green">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                    <FormField label="Bus Service" error={errors.busAttendance?.message}>
                      <Controller
                        name="busAttendance"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value || "false"}
                            onValueChange={(v) => field.onChange(v)}
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
                  </div>

                  <Separator className="my-6" />

                  {/* Milk Tracker */}
                  <h4 className="mb-4 text-sm font-semibold text-foreground">Milk Tracker</h4>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
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
                  </div>

                  <Separator className="my-6" />

                  {/* Routines */}
                  <h4 className="mb-4 text-sm font-semibold text-foreground">Routines</h4>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                    <FormField label="Sleep From" error={errors.sleepFrom?.message}>
                      <Input type="time" {...register("sleepFrom")} />
                    </FormField>

                    <FormField label="Sleep To" error={errors.sleepTo?.message}>
                      <Input type="time" {...register("sleepTo")} />
                    </FormField>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
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
              </>
            )}

            {/* ════════════════════════════════════════════
                 STEP 4: Financial Info
                 ════════════════════════════════════════════ */}
            {currentStep === 3 && (
              <FormSection title="Financial Information" color="red">
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

                  <FormField label="Discount ($)" error={errors.discount?.message}>
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

                {/* Live Net$ Calculator */}
                <div className="mt-6 rounded-sm border-2 border-primary/20 bg-primary/5 p-5">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Live Fee Calculator</h4>
                  <div className="grid grid-cols-2 gap-y-3 text-sm md:grid-cols-4">
                    <div>
                      <span className="text-muted-foreground">Subtotal</span>
                      <p className="text-lg font-medium">${subtotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">After Discount</span>
                      <p className="text-lg font-medium">${afterDiscount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">TVA Amount</span>
                      <p className="text-lg font-medium">${tvaAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Net Total</span>
                      <p className="text-2xl font-bold text-primary">${netTotal.toFixed(2)}</p>
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
                        <input
                          type="hidden"
                          {...register(`accountingEntries.${index}.recordId`)}
                        />
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
            )}

            {/* ════════════════════════════════════════════
                 STEP 5: Attachments
                 ════════════════════════════════════════════ */}
            {currentStep === 4 && (
              <FormSection title="Attachments" color="green">
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Required Documents</h4>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {ATTACHMENT_TYPES.map((doc) => {
                      const existingForType = visibleExistingAttachments.filter(
                        (attachment) =>
                          doc.key === "other"
                            ? !attachment.type || attachment.type === doc.key
                            : attachment.type === doc.key
                      );
                      const pendingForType = pendingAttachments.filter(
                        (attachment) => attachment.type === doc.key
                      );
                      const hasFiles = existingForType.length > 0 || pendingForType.length > 0;

                      return (
                        <div
                          key={doc.key}
                          className="rounded-lg border border-border bg-card p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                <Paperclip className="size-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{doc.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {hasFiles
                                    ? `${existingForType.length + pendingForType.length} file(s)`
                                    : "Not uploaded"}
                                </p>
                              </div>
                            </div>

                            <label className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground">
                              <Upload className="size-4" />
                              Add
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(event) => {
                                  const files = Array.from(event.target.files ?? []);
                                  for (const file of files) {
                                    addPendingAttachment(doc.key, doc.label, file);
                                  }
                                  event.target.value = "";
                                }}
                                multiple
                              />
                            </label>
                          </div>

                          {hasFiles && (
                            <div className="mt-3 space-y-2">
                              {existingForType.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2"
                                >
                                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                                  <a
                                    href={attachment.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="min-w-0 flex-1 truncate text-sm text-primary hover:underline"
                                  >
                                    {attachment.title || attachment.filename}
                                  </a>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeExistingAttachment(attachment.id)}
                                  >
                                    <X className="size-3.5" />
                                  </Button>
                                </div>
                              ))}
                              {pendingForType.map((attachment) => (
                                <div
                                  key={attachment.key}
                                  className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2"
                                >
                                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                                  <span className="min-w-0 flex-1 truncate text-sm">
                                    {attachment.file.name}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => removePendingAttachment(attachment.key)}
                                  >
                                    <X className="size-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </FormSection>
            )}

            {/* ════════════════════════════════════════════
                 STEP 6: Review & Submit
                 ════════════════════════════════════════════ */}
            {currentStep === 5 && (
              <FormSection title="Review & Submit">
                <p className="mb-4 text-sm text-muted-foreground">
                  Please review the enrollment details below before submitting.
                </p>

                {/* Child info summary */}
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">Child Information</h4>
                      <button type="button" onClick={() => handleGoToStep(0)} className="text-xs font-medium text-primary hover:underline">Edit</button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-3">
                      <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{watch("firstName")} {watch("middleName")} {watch("lastName")}</span></div>
                      {watch("firstNameAr") && <div><span className="text-muted-foreground">Arabic:</span> <span className="font-medium">{watch("firstNameAr")} {watch("lastNameAr")}</span></div>}
                      <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium">{watch("dateOfBirth") || "—"}</span></div>
                      <div><span className="text-muted-foreground">Gender:</span> <span className="font-medium">{watch("gender") || "—"}</span></div>
                      <div><span className="text-muted-foreground">Nationality:</span> <span className="font-medium">{watch("nationality") || "—"}</span></div>
                      <div><span className="text-muted-foreground">Religion:</span> <span className="font-medium">{watch("religion") || "—"}</span></div>
                    </div>
                  </div>

                  {/* Family summary */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">Family</h4>
                      <button type="button" onClick={() => handleGoToStep(1)} className="text-xs font-medium text-primary hover:underline">Edit</button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">Mother:</span>{" "}
                        <span className="font-medium">{watch("mother.firstName")} {watch("mother.lastName")}</span>
                        {watch("mother.mobile") && <span className="ml-2 text-muted-foreground">({watch("mother.mobile")})</span>}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Father:</span>{" "}
                        <span className="font-medium">{watch("father.firstName")} {watch("father.lastName")}</span>
                        {watch("father.mobile") && <span className="ml-2 text-muted-foreground">({watch("father.mobile")})</span>}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {(watch("addresses")?.length ?? 0)} address(es), {(watch("siblings")?.length ?? 0)} sibling(s), {(watch("relatives")?.length ?? 0)} relative(s)
                    </div>
                  </div>

                  {/* School & Medical summary */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">School &amp; Medical</h4>
                      <button type="button" onClick={() => handleGoToStep(2)} className="text-xs font-medium text-primary hover:underline">Edit</button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-3">
                      <div><span className="text-muted-foreground">Branch:</span> <span className="font-medium">{branches.find(b => b.id === watch("branchId"))?.name || "—"}</span></div>
                      <div><span className="text-muted-foreground">Class:</span> <span className="font-medium">{classes.find(c => c.id === watch("classId"))?.name || "—"}</span></div>
                      <div><span className="text-muted-foreground">Blood Type:</span> <span className="font-medium">{watch("bloodType") || "—"}</span></div>
                      <div><span className="text-muted-foreground">Allergies:</span> <span className="font-medium">{watch("allergies") || "None"}</span></div>
                      <div><span className="text-muted-foreground">Bus:</span> <span className="font-medium">{BUS_OPTIONS.find(o => o.value === watch("busAttendance"))?.label || "No"}</span></div>
                    </div>
                  </div>

                  {/* Financial summary */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">Financial</h4>
                      <button type="button" onClick={() => handleGoToStep(3)} className="text-xs font-medium text-primary hover:underline">Edit</button>
                    </div>
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="text-muted-foreground">Net Total:</span>
                      <span className="text-lg font-bold text-primary">${netTotal.toFixed(2)}</span>
                      <span className="text-muted-foreground">(Subtotal ${subtotal.toFixed(2)} − ${Number(watchFees[6] || 0).toFixed(2)} discount + ${tvaAmount.toFixed(2)} TVA)</span>
                    </div>
                  </div>
                </div>
              </FormSection>
            )}

            {/* ── Sticky Navigation Bar ── */}
            <div className="sticky bottom-0 z-10 -mx-1 border-t border-border/40 bg-card px-1 py-4">
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-3">
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

                  {currentStep < totalSteps - 1 ? (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {currentStep === totalSteps - 2 ? "Review" : "Next"}
                      <ChevronRight className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      {isEditing ? "Update Child" : "Submit Enrollment"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </form>
  );
}
