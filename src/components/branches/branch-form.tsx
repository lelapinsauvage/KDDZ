"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  branchFormSchema,
  type BranchFormValues,
} from "@/lib/validations/branch";
import {
  createBranch,
  setNewBranchImage,
  updateBranch,
} from "@/lib/actions/branches";
import { uploadFileWithPresign } from "@/lib/uploads/client-upload";
import { PageHeader } from "@/components/layout/page-header";
import { FormSection } from "@/components/ui/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, ArrowLeft, Building2, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BranchFormProps {
  branch?: BranchFormValues & { id: string };
  /** Hide PageHeader when rendered inside a layout that already has one */
  hideHeader?: boolean;
}

const COLOR_PRESETS = [
  "#1caf9a",
  "#4b8df8",
  "#e7505a",
  "#c49f47",
  "#8e44ad",
  "#e67e22",
  "#2ecc71",
  "#3498db",
  "#e74c3c",
  "#1abc9c",
];

const DEFAULT_BRANCH_PHOTO = "/images/BranchPhoto/default.jpg";

function branchImageSrc(imageUrl: string) {
  if (!imageUrl || imageUrl === "default.jpg") return DEFAULT_BRANCH_PHOTO;
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("/")) return imageUrl;
  if (imageUrl.includes("/")) return `/${imageUrl.replace(/^\/+/, "")}`;
  return `/images/BranchPhoto/${imageUrl}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BranchForm({ branch, hideHeader = false }: BranchFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const isEditing = !!branch;

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: branch ?? {
      name: "",
      prefix: "",
      address: "",
      phone: "",
      telephone: "",
      email: "",
      imageUrl: "",
      themeColor: "#1caf9a",
      isActive: true,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const selectedColor = watch("themeColor") || "#1caf9a";
  const storedImageUrl = watch("imageUrl") || "";
  const displayImageUrl = imagePreviewUrl || (storedImageUrl ? branchImageSrc(storedImageUrl) : "");

  function clearImageSelection() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
  }

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Select an image file");
      return;
    }
    clearImageSelection();
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function handleClearImage() {
    clearImageSelection();
    setValue("imageUrl", "", { shouldDirty: true });
  }

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  async function uploadSelectedBranchImage(branchId: string) {
    if (!imageFile) return undefined;

    try {
      const uploaded = await uploadFileWithPresign({
        branchId,
        scope: "branch",
        ownerId: branchId,
        file: imageFile,
      });
      setValue("imageUrl", uploaded.publicUrl, { shouldDirty: true });
      return uploaded.publicUrl;
    } catch (uploadError) {
      toast.error(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload branch image",
      );
      return undefined;
    }
  }

  function onSubmit(data: BranchFormValues) {
    setError(null);
    startTransition(async () => {
      const payload = {
        name: data.name,
        prefix: data.prefix || null,
        address: data.address || null,
        phone: data.phone || null,
        telephone: data.telephone || null,
        email: data.email || null,
        imageUrl: data.imageUrl?.trim() || null,
        themeColor: data.themeColor || "#1caf9a",
        isActive: data.isActive,
      };

      if (isEditing) {
        let imageUrl = payload.imageUrl;
        if (imageFile) {
          const uploadedImageUrl = await uploadSelectedBranchImage(branch!.id);
          if (!uploadedImageUrl) return;
          imageUrl = uploadedImageUrl;
        }

        const result = await updateBranch(branch!.id, {
          ...payload,
          imageUrl,
        });

        if (!result.success) {
          setError(result.error ?? "Something went wrong");
          return;
        }

        clearImageSelection();
        toast.success("Branch updated successfully");
        router.push("/branches");
        router.refresh();
        return;
      }

      const result = await createBranch(payload);
      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      if (imageFile) {
        const createdBranch = result.data as { id?: string } | undefined;
        if (!createdBranch?.id) {
          toast.error("Branch created, but image upload could not start");
          router.push("/branches");
          router.refresh();
          return;
        }

        const uploadedImageUrl = await uploadSelectedBranchImage(createdBranch.id);
        if (!uploadedImageUrl) {
          toast.error("Branch created, but image upload failed");
          router.push(`/branches/${createdBranch.id}/edit`);
          router.refresh();
          return;
        }

        const imageResult = await setNewBranchImage(
          createdBranch.id,
          uploadedImageUrl,
        );
        if (!imageResult.success) {
          toast.error(
            imageResult.error ?? "Branch created, but image URL was not saved",
          );
          router.push(`/branches/${createdBranch.id}/edit`);
          router.refresh();
          return;
        }
      }

      clearImageSelection();
      toast.success("Branch created successfully");
      router.push("/branches");
      router.refresh();
    });
  }

  return (
    <>
      {!hideHeader && (
        <PageHeader
          title={isEditing ? "Edit Branch" : "New Branch"}
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Branches", href: "/branches" },
            { label: isEditing ? "Edit" : "New" },
          ]}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* ── Left sidebar ── */}
          <div className="space-y-4">
            <div className="rounded-sm border bg-card p-6 text-center shadow-sm">
              <input type="hidden" {...register("imageUrl")} />
              <div
                role="button"
                tabIndex={0}
                className={`group relative mx-auto flex size-32 cursor-pointer items-center justify-center overflow-hidden rounded-sm border-2 border-dashed transition-colors ${
                  isImageDragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
                style={{
                  backgroundColor: displayImageUrl
                    ? undefined
                    : `${selectedColor}20`,
                }}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsImageDragOver(true);
                }}
                onDragLeave={() => setIsImageDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsImageDragOver(false);
                  const file = event.dataTransfer.files[0];
                  if (file) handleImageFile(file);
                }}
              >
                {displayImageUrl ? (
                  <>
                    <Image
                      src={displayImageUrl}
                      alt={watch("name") || "Branch"}
                      fill
                      sizes="128px"
                      className="object-cover"
                      unoptimized
                      onError={(event) => {
                        if (!imagePreviewUrl && displayImageUrl !== DEFAULT_BRANCH_PHOTO) {
                          event.currentTarget.src = DEFAULT_BRANCH_PHOTO;
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 focus:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleClearImage();
                      }}
                      aria-label="Remove branch image"
                    >
                      <X className="size-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Building2
                      className="size-12"
                      style={{ color: selectedColor }}
                    />
                    <ImageIcon className="size-5 text-muted-foreground" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleImageFile(file);
                    event.target.value = "";
                  }}
                />
              </div>
              {imageFile && (
                <p className="mx-auto mt-2 max-w-48 truncate text-xs text-muted-foreground">
                  Selected: {imageFile.name}
                </p>
              )}
              <p className="mt-4 text-lg font-semibold text-foreground">
                {watch("name") || "New Branch"}
              </p>
              {watch("prefix") && (
                <p className="text-sm text-muted-foreground">{watch("prefix")}</p>
              )}

              {/* Color picker */}
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Theme Color
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="size-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          selectedColor === color ? "currentColor" : "transparent",
                      }}
                      onClick={() => setValue("themeColor", color)}
                    />
                  ))}
                </div>
              </div>
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
              >
                <Save className="size-4" />
                {isPending
                  ? "Saving..."
                  : isEditing
                    ? "Update Branch"
                    : "Create Branch"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/branches")}
              >
                <ArrowLeft className="size-4" />
                Back to Branches
              </Button>
            </div>
          </div>

          {/* ── Right: form sections ── */}
          <div className="space-y-6">
            {/* Branch Info */}
            <FormSection title="Branch Info" color="blue">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="name">
                    Branch Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="e.g. Main Branch"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="prefix">
                    Prefix / Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="prefix"
                    {...register("prefix")}
                    placeholder="e.g. MB"
                  />
                  {errors.prefix && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.prefix.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="isActive">Status</Label>
                  <Select
                    value={watch("isActive") ? "true" : "false"}
                    onValueChange={(v) => setValue("isActive", v === "true")}
                  >
                    <SelectTrigger id="isActive">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </FormSection>

            {/* Contact Info */}
            <FormSection title="Contact Info" color="green">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="phone">Mobile</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="+961 XX XXX XXX"
                  />
                </div>
                <div>
                  <Label htmlFor="telephone">Telephone</Label>
                  <Input
                    id="telephone"
                    {...register("telephone")}
                    placeholder="XX XXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="branch@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Location */}
            <FormSection title="Location" color="yellow">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="address">
                    Branch Location <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    {...register("address")}
                    placeholder="Full address"
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.address.message}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>
          </div>
        </div>
      </form>
    </>
  );
}
