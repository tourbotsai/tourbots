import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface UseImageUploadReturn {
  uploadImage: (
    file: File, 
    resourceType: 'blogs' | 'guides' | 'ebooks', 
    imageType: 'cover' | 'header' | 'additional',
    resourceId?: string
  ) => Promise<string>;
  isUploading: boolean;
  uploadProgress: number;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadImage = useCallback(async (
    file: File,
    resourceType: 'blogs' | 'guides' | 'ebooks',
    imageType: 'cover' | 'header' | 'additional',
    resourceId?: string
  ): Promise<string> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload PNG, JPEG, JPG, or WebP images only.');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Please upload images smaller than 5MB.');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resourceType', resourceType);
      formData.append('imageType', imageType);
      if (resourceId) {
        formData.append('resourceId', resourceId);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Upload to API
      const response = await fetch('/api/admin/resources/upload/images', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload image');
      }

      toast({
        title: "Image Uploaded",
        description: "Image has been uploaded successfully.",
      });

      return data.imageUrl;

    } catch (error: any) {
      console.error('Image upload error:', error);
      
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [toast]);

  return {
    uploadImage,
    isUploading,
    uploadProgress,
  };
} 