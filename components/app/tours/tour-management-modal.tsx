"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Camera, Save, X } from "lucide-react";
import { Tour } from "@/lib/types";

const tourSchema = z.object({
  title: z.string().min(1, "Tour name is required"),
  description: z.string().optional(),
  matterport_tour_id: z.string().min(1, "Matterport ID is required"),
  matterport_url: z.string().url("Please enter a valid URL").min(1, "Matterport URL is required"),
});

type TourFormData = z.infer<typeof tourSchema>;

interface TourManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour?: Tour | null;
  onSave: (tourData: TourFormData) => Promise<boolean>;
  isLoading?: boolean;
}

export function TourManagementModal({ 
  isOpen, 
  onClose, 
  tour, 
  onSave, 
  isLoading = false 
}: TourManagementModalProps) {
  const form = useForm<TourFormData>({
    resolver: zodResolver(tourSchema),
    defaultValues: {
      title: "",
      description: "",
      matterport_tour_id: "",
      matterport_url: "",
    },
  });

  // Reset form when tour changes or modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: tour?.title || "",
        description: tour?.description || "",
        matterport_tour_id: tour?.matterport_tour_id || "",
        matterport_url: tour?.matterport_url || "",
      });
    }
  }, [isOpen, tour, form]);

  const handleSave = async (data: TourFormData) => {
    const success = await onSave(data);
    if (success) {
      onClose();
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const extractMatterportId = (url: string) => {
    const match = url.match(/[?&]m=([^&]+)/);
    return match ? match[1] : "";
  };

  const handleUrlChange = (value: string) => {
    // Auto-extract Matterport ID from URL
    const id = extractMatterportId(value);
    if (id && !form.getValues("matterport_tour_id")) {
      form.setValue("matterport_tour_id", id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg dark:border-input dark:bg-[#121923]/96">
        <DialogHeader>
          <DialogTitle className="flex items-center dark:text-slate-100">
            <Camera className="w-5 h-5 mr-2 text-brand-blue dark:text-slate-300" />
            {tour ? "Edit" : "Add"} Your Matterport Tour
          </DialogTitle>
          <DialogDescription>
            {tour 
              ? "Update your existing Matterport 3D tour details."
              : "Add your own Matterport 3D tour to get started with our AI-powered features."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="matterport_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Matterport URL *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://my.matterport.com/show/?m=abc123xyz"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleUrlChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                    Paste the full URL from your Matterport tour
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="matterport_tour_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matterport ID *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., abc123xyz"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                    The unique ID from your Matterport URL (automatically extracted)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tour Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Complete venue tour"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tour Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what areas are included in this tour..."
                      rows={3}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-slate-900 text-white hover:bg-slate-800 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {tour ? "Update Tour" : "Add Tour"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 