"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, Image, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";

interface ImageUploadProps {
  value?: string | null;
  onChange: (imageUrl: string | null) => void;
  venueId: string;
  chatbotType: 'tour';
  fieldKey?: string;
  label?: string;
  className?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  venueId, 
  chatbotType, 
  fieldKey,
  label = "Custom Icon", 
  className 
}: ImageUploadProps) {
  const { toast } = useToast();
  const { getAuthHeaders } = useAuthHeaders();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAgencyEmbed = typeof window !== 'undefined' && window.location.pathname.startsWith('/embed/agency');

  const getAgencyCsrfToken = () => {
    if (typeof document === 'undefined') return null;
    const csrfCookie = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith('tb_agency_csrf='));
    if (!csrfCookie) return null;
    return decodeURIComponent(csrfCookie.split('=')[1] || '');
  };

  const getAgencyShareSlug = () => {
    if (typeof window === 'undefined') return null;
    const parts = window.location.pathname.split('/').filter(Boolean);
    const agencyIndex = parts.findIndex((part) => part === 'agency');
    if (agencyIndex === -1) return null;
    return parts[agencyIndex + 1] || null;
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PNG, JPEG, or SVG image.';
    }

    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      return 'File size must be less than 2MB.';
    }

    return null;
  };

  const uploadImage = useCallback(async (file: File) => {
    const validationError = validateFile(file);
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
      formData.append('file', file);
      formData.append('venueId', venueId);
      formData.append('chatbotType', chatbotType);
      const shareSlug = getAgencyShareSlug();
      if (isAgencyEmbed && shareSlug) {
        formData.append('shareSlug', shareSlug);
      }
      if (fieldKey) {
        formData.append('fieldKey', fieldKey);
      }

      const uploadEndpoint = isAgencyEmbed
        ? '/api/public/agency-portal/customisation/upload-icon'
        : '/api/app/chatbots/customisation/upload-icon';
      const csrfToken = isAgencyEmbed ? getAgencyCsrfToken() : null;
      const uploadHeaders = isAgencyEmbed
        ? (csrfToken ? { 'x-csrf-token': csrfToken } : {})
        : await getAuthHeaders();

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: uploadHeaders,
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      onChange(data.imageUrl);
      toast({
        title: "Image Uploaded",
        description: "Your custom icon has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [venueId, chatbotType, onChange, toast, fieldKey, getAuthHeaders, isAgencyEmbed]);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      uploadImage(files[0]);
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
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, []);

  const handleRemove = async () => {
    if (!value) return;

    try {
      const shareSlug = getAgencyShareSlug();
      const csrfToken = isAgencyEmbed ? getAgencyCsrfToken() : null;
      const deleteEndpoint = isAgencyEmbed
        ? '/api/public/agency-portal/customisation/upload-icon'
        : '/api/app/chatbots/customisation/upload-icon';
      const deleteHeaders = isAgencyEmbed
        ? {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          }
        : await getAuthHeaders({
            'Content-Type': 'application/json',
          });

      // Call API to delete the image
      const response = await fetch(deleteEndpoint, {
        method: 'DELETE',
        headers: deleteHeaders,
        credentials: 'include',
        body: JSON.stringify({
          imageUrl: value,
          venueId,
          chatbotType,
          ...(shareSlug ? { shareSlug } : {}),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete image');
      }

      onChange(null);
      toast({
        title: "Image Removed",
        description: "Your custom icon has been removed.",
      });
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast({
        title: "Remove Failed",
        description: error.message || "Failed to remove image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">{label}</Label>
      
      {value ? (
        // Show uploaded image with remove option
        <div className="relative group">
          <div className="w-full h-32 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 dark:border-input dark:bg-background">
            <img 
              src={value} 
              alt="Custom icon" 
              className="max-w-16 max-h-16 object-contain"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex-col items-center text-gray-400 dark:text-slate-400">
              <AlertCircle className="w-8 h-8 mb-2" />
              <span className="text-sm">Failed to load image</span>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            onClick={handleRemove}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        // Show upload area
        <div
          className={cn(
            "w-full h-32 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
            isDragOver 
              ? "border-slate-500 bg-neutral-800/40" 
              : "border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-input dark:bg-background dark:hover:bg-neutral-800",
            isUploading && "pointer-events-none opacity-50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-slate-400">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                <span className="text-sm">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Drop or click to upload</span>
                <span className="text-xs text-gray-400 mt-1 dark:text-slate-500">PNG, JPEG, SVG up to 2MB</span>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
} 