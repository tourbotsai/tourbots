"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, Loader2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";

interface LogoUploadProps {
  value?: string | null;
  onChange: (imageUrl: string | null) => void;
  venueId: string;
  tourId: string;
  label?: string;
  className?: string;
}

export function LogoUpload({ 
  value, 
  onChange, 
  venueId, 
  tourId,
  label = "Logo Image", 
  className 
}: LogoUploadProps) {
  const { toast } = useToast();
  const { getAuthHeaders } = useAuthHeaders();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PNG, JPEG, SVG, or WebP image.';
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
      formData.append('tourId', tourId);

      const response = await fetch('/api/app/tours/menu/upload-logo', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      onChange(data.imageUrl);
      toast({
        title: "Logo Uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [venueId, tourId, onChange, toast, getAuthHeaders]);

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
      // Call API to delete the image
      const response = await fetch('/api/app/tours/menu/upload-logo', {
        method: 'DELETE',
        headers: await getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          imageUrl: value,
          venueId,
          tourId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete image');
      }

      onChange(null);
      toast({
        title: "Logo Removed",
        description: "Your logo has been removed.",
      });
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast({
        title: "Remove Failed",
        description: error.message || "Failed to remove logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label className="text-sm font-medium dark:text-gray-200">{label}</Label>}
      
      {value ? (
        // Show uploaded image with remove option
        <div className="relative group">
          <div className="w-full h-40 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-neutral-800">
            <img 
              src={value} 
              alt="Menu logo" 
              className="max-w-full max-h-32 object-contain p-2"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex-col items-center text-gray-400 dark:text-gray-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <span className="text-sm">Failed to load image</span>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full p-0"
            onClick={handleRemove}
            type="button"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        // Show upload area
        <div
          className={cn(
            "w-full h-40 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
            isDragOver 
              ? "border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10" 
              : "border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-750",
            isUploading && "pointer-events-none opacity-50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 mb-2 animate-spin text-brand-blue" />
                <span className="text-sm font-medium">Uploading...</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Drop or click to upload logo</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPEG, SVG, WebP • Max 2MB</span>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}

