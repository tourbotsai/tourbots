"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, Loader2, AlertCircle, Crop as CropIcon, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import { LogoCropModal } from "./logo-crop-modal";

interface LogoUploadProps {
  value?: string | null;
  onChange: (imageUrl: string | null) => void;
  venueId: string;
  tourId: string;
  label?: string;
  className?: string;
  /** Compact square thumbnail — for dense inspector rows. */
  compact?: boolean;
}

export function LogoUpload({
  value,
  onChange,
  venueId,
  tourId,
  label,
  className,
  compact = false,
}: LogoUploadProps) {
  const { toast } = useToast();
  const { getAuthHeaders } = useAuthHeaders();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropObjectUrl, setCropObjectUrl] = useState<string | null>(null);
  const [isCropSaving, setIsCropSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inside the agency portal embed the client is authenticated via the portal
  // session cookie (not an app bearer token), so uploads must go to the
  // cookie-authenticated public endpoint with the CSRF token + share slug.
  const isAgencyEmbed =
    typeof window !== "undefined" && window.location.pathname.startsWith("/embed/agency");

  const getAgencyCsrfToken = () => {
    if (typeof document === "undefined") return null;
    const csrfCookie = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("tb_agency_csrf="));
    if (!csrfCookie) return null;
    return decodeURIComponent(csrfCookie.split("=")[1] || "");
  };

  const getAgencyShareSlug = () => {
    if (typeof window === "undefined") return null;
    const parts = window.location.pathname.split("/").filter(Boolean);
    const agencyIndex = parts.findIndex((part) => part === "agency");
    if (agencyIndex === -1) return null;
    return parts[agencyIndex + 1] || null;
  };

  const cleanupCropObjectUrl = useCallback(() => {
    if (cropObjectUrl) {
      URL.revokeObjectURL(cropObjectUrl);
      setCropObjectUrl(null);
    }
  }, [cropObjectUrl]);

  const isSvgFile = (file: File) => file.type === "image/svg+xml";
  const isSvgUrl = (url: string) => {
    const normalised = url.toLowerCase();
    return normalised.includes("image/svg+xml") || normalised.includes(".svg");
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return "Please upload a PNG, JPEG, SVG, or WebP image.";
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return "File size must be less than 2MB.";
    }

    return null;
  };

  const uploadImage = useCallback(
    async (blob: Blob, fileName: string, mimeType: string) => {
      const validationError = validateFile(new File([blob], fileName, { type: mimeType }));
      if (validationError) {
        toast({
          title: "Invalid File",
          description: validationError,
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", blob, fileName);
        formData.append("venueId", venueId);
        formData.append("tourId", tourId);

        const shareSlug = getAgencyShareSlug();
        if (isAgencyEmbed && shareSlug) {
          formData.append("shareSlug", shareSlug);
        }

        const uploadEndpoint = isAgencyEmbed
          ? "/api/public/agency-portal/tour-menu/upload-logo"
          : "/api/app/tours/menu/upload-logo";
        const csrfToken = isAgencyEmbed ? getAgencyCsrfToken() : null;
        const uploadHeaders = isAgencyEmbed
          ? csrfToken
            ? { "x-csrf-token": csrfToken }
            : {}
          : await getAuthHeaders();

        const response = await fetch(uploadEndpoint, {
          method: "POST",
          headers: uploadHeaders,
          credentials: "include",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to upload image");
        }

        onChange(data.imageUrl);
        toast({
          title: "Logo Uploaded",
          description: "Your logo has been uploaded successfully.",
        });
      } catch (error: any) {
        console.error("Error uploading logo:", error);
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload logo. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [venueId, tourId, onChange, toast, getAuthHeaders, isAgencyEmbed]
  );

  const openCropForSource = useCallback((src: string, objectUrl: string | null = null) => {
    if (objectUrl) {
      setCropObjectUrl(objectUrl);
    }
    setCropImageSrc(src);
    setIsCropOpen(true);
  }, []);

  const closeCropModal = useCallback(() => {
    setIsCropOpen(false);
    setCropImageSrc(null);
    cleanupCropObjectUrl();
  }, [cleanupCropObjectUrl]);

  const handleCropSave = useCallback(
    async (blob: Blob) => {
      try {
        setIsCropSaving(true);
        await uploadImage(blob, `logo-cropped-${Date.now()}.png`, "image/png");
        closeCropModal();
      } catch (error) {
        // uploadImage handles the error toast already.
      } finally {
        setIsCropSaving(false);
      }
    },
    [closeCropModal, uploadImage]
  );

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (isSvgFile(file)) {
        uploadImage(file, file.name || `logo-${Date.now()}.svg`, file.type);
        return;
      }

      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: "Invalid File",
          description: validationError,
          variant: "destructive",
        });
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      openCropForSource(objectUrl, objectUrl);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const handleRemove = async () => {
    if (!value) return;

    try {
      const shareSlug = getAgencyShareSlug();
      const csrfToken = isAgencyEmbed ? getAgencyCsrfToken() : null;
      const deleteEndpoint = isAgencyEmbed
        ? "/api/public/agency-portal/tour-menu/upload-logo"
        : "/api/app/tours/menu/upload-logo";
      const deleteHeaders = isAgencyEmbed
        ? {
            "Content-Type": "application/json",
            ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
          }
        : await getAuthHeaders({ "Content-Type": "application/json" });

      const response = await fetch(deleteEndpoint, {
        method: "DELETE",
        headers: deleteHeaders,
        credentials: "include",
        body: JSON.stringify({
          imageUrl: value,
          venueId,
          tourId,
          ...(isAgencyEmbed && shareSlug ? { shareSlug } : {}),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete image");
      }

      onChange(null);
      toast({
        title: "Logo Removed",
        description: "Your logo has been removed.",
      });
    } catch (error: any) {
      console.error("Error removing logo:", error);
      toast({
        title: "Remove Failed",
        description: error.message || "Failed to remove logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
      onChange={(e) => handleFileSelect(e.target.files)}
      className="hidden"
      disabled={isUploading}
    />
  );

  const cropModal = (
    <LogoCropModal
      open={isCropOpen}
      imageSrc={cropImageSrc}
      isSaving={isCropSaving}
      onOpenChange={(open) => {
        if (!open) closeCropModal();
      }}
      onCancel={closeCropModal}
      onSave={handleCropSave}
    />
  );

  // Compact: standard settings pattern — thumbnail + Upload/Change button (Webflow / Stripe / Happly).
  if (compact) {
    return (
      <div className={cn("shrink-0", className)}>
        {label ? <Label className="mb-1 block text-[11px] font-medium">{label}</Label> : null}

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-slate-50 dark:bg-neutral-900",
              isDragOver
                ? "border-slate-900 dark:border-slate-100"
                : "border-slate-200 dark:border-neutral-700"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
            ) : value ? (
              <img
                src={value}
                alt="Menu logo"
                className="h-full w-full object-contain p-1"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-slate-200 dark:hover:bg-neutral-800"
            >
              {isUploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              {value ? "Change" : "Upload"}
            </button>

            {value && !isSvgUrl(value) ? (
              <button
                type="button"
                title="Crop"
                disabled={isUploading}
                onClick={() => openCropForSource(value)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
              >
                <CropIcon className="h-3 w-3" />
              </button>
            ) : null}

            {value ? (
              <button
                type="button"
                title="Remove"
                disabled={isUploading}
                onClick={handleRemove}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-red-950/40"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        </div>

        {fileInput}
        {cropModal}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <Label className="text-sm font-medium dark:text-gray-200">{label}</Label> : null}

      {value ? (
        <div className="space-y-1.5">
          <div className="flex h-16 items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex h-12 min-w-0 flex-1 items-center justify-center">
              <img
                src={value}
                alt="Menu logo"
                className="max-h-12 max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden flex-col items-center text-slate-400">
                <AlertCircle className="mb-0.5 h-4 w-4" />
                <span className="text-[10px]">Failed to load</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!isSvgUrl(value) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCropForSource(value)}
                  type="button"
                  disabled={isUploading}
                  className="h-7 px-2 text-xs"
                >
                  <CropIcon className="mr-1 h-3 w-3" />
                  Crop
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
                onClick={handleRemove}
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {!isSvgUrl(value) ? (
            <p className="text-[10px] text-slate-400">Crop to trim transparent padding.</p>
          ) : (
            <p className="text-[10px] text-slate-400">SVG — cropping unavailable.</p>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "flex h-16 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed transition-colors",
            isDragOver
              ? "border-brand-blue bg-brand-blue/5"
              : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-neutral-700 dark:bg-neutral-800",
            isUploading && "pointer-events-none opacity-50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-brand-blue" />
              Uploading…
            </span>
          ) : (
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Upload className="h-3.5 w-3.5" />
              Drop or click · PNG, JPEG, SVG, WebP · 2MB
            </span>
          )}
        </div>
      )}

      {fileInput}
      {cropModal}
    </div>
  );
}
