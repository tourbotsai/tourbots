"use client";

import { type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LogoCropModalProps {
  open: boolean;
  imageSrc: string | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: (blob: Blob) => Promise<void>;
}

async function createCroppedBlob(image: HTMLImageElement, cropAreaPixels: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const cropWidth = Math.max(1, Math.round(cropAreaPixels.width * scaleX));
  const cropHeight = Math.max(1, Math.round(cropAreaPixels.height * scaleY));
  const cropX = Math.round(cropAreaPixels.x * scaleX);
  const cropY = Math.round(cropAreaPixels.y * scaleY);

  canvas.width = cropWidth;
  canvas.height = cropHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to prepare image crop");
  }

  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to generate cropped image"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

export function LogoCropModal({
  open,
  imageSrc,
  isSaving,
  onOpenChange,
  onCancel,
  onSave,
}: LogoCropModalProps) {
  const { toast } = useToast();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: "%", x: 5, y: 5, width: 90, height: 90 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  const hasImage = useMemo(() => Boolean(imageSrc), [imageSrc]);

  useEffect(() => {
    if (!open) return;
    setCrop({ unit: "%", x: 5, y: 5, width: 90, height: 90 });
    setCompletedCrop(null);
  }, [open, imageSrc]);

  const handleImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    imageRef.current = image;
    setCrop({ unit: "%", x: 5, y: 5, width: 90, height: 90 });
    setCompletedCrop({
      unit: "px",
      x: Math.round(image.width * 0.05),
      y: Math.round(image.height * 0.05),
      width: Math.round(image.width * 0.9),
      height: Math.round(image.height * 0.9),
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!imageRef.current || !completedCrop) return;

    try {
      const blob = await createCroppedBlob(imageRef.current, completedCrop);
      await onSave(blob);
    } catch (error: any) {
      console.error("Logo crop failed:", error);
      toast({
        title: "Crop failed",
        description: "Unable to save crop for this image. Please re-upload and try again.",
        variant: "destructive",
      });
    }
  }, [completedCrop, onSave, toast]);

  const handleCancel = useCallback(() => {
    if (isSaving) return;
    setCrop({ unit: "%", x: 5, y: 5, width: 90, height: 90 });
    setCompletedCrop(null);
    imageRef.current = null;
    onCancel();
  }, [isSaving, onCancel]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crop logo</DialogTitle>
          <DialogDescription>
            Drag the edges or corners to crop each side exactly as you want.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative max-h-[420px] overflow-auto rounded-lg border bg-black/80 p-2">
            {hasImage ? (
              <ReactCrop
                crop={crop}
                onChange={(nextCrop) => setCrop(nextCrop)}
                onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                keepSelection
                ruleOfThirds
              >
                <img
                  src={imageSrc || undefined}
                  alt="Crop logo"
                  crossOrigin="anonymous"
                  className="max-h-[380px] w-auto max-w-full object-contain"
                  onLoad={handleImageLoad}
                />
              </ReactCrop>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!completedCrop || completedCrop.width < 1 || completedCrop.height < 1 || isSaving}
          >
            {isSaving ? "Saving..." : "Save crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

