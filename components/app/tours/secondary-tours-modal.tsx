"use client";

import { useState, useEffect } from "react";
import { useUser as useFirebaseUser } from "reactfire";
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
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Camera, Save, X, Plus, Trash2, ExternalLink, Tag, Edit } from "lucide-react";
import { Tour } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { deleteSecondaryTour, updateTour } from "@/lib/tour-service";
import { useTheme } from "@/components/app/shared/theme-provider";

const secondaryTourSchema = z.object({
  title: z.string().min(1, "Tour name is required"),
  description: z.string().optional(),
  matterport_tour_id: z.string().min(1, "Matterport ID is required"),
  matterport_url: z.string().url("Please enter a valid URL").min(1, "Matterport URL is required"),
  navigation_keywords: z.string().optional(),
});

type SecondaryTourFormData = z.infer<typeof secondaryTourSchema>;

interface SecondaryToursModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
  primaryTour: Tour;
  allTours: Tour[];
  onRefresh: () => void;
  activeModelId: string | null;
  onSelectModel: (model: Tour) => void | Promise<void>;
}

export function SecondaryToursModal({ 
  isOpen, 
  onClose, 
  venueId,
  primaryTour,
  allTours,
  onRefresh,
  activeModelId,
  onSelectModel,
}: SecondaryToursModalProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const { data: authUser } = useFirebaseUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  
  const form = useForm<SecondaryTourFormData>({
    resolver: zodResolver(secondaryTourSchema),
    defaultValues: {
      title: "",
      description: "",
      matterport_tour_id: "",
      matterport_url: "",
      navigation_keywords: "",
    },
  });

  // Secondary models linked to this location.
  // Legacy rows without parent_tour_id are included only when there is one primary location.
  const primaryTourCount = allTours.filter(t => t.tour_type === 'primary' || !t.tour_type).length;
  const secondaryTours = allTours.filter(
    (t) =>
      t.tour_type === 'secondary' &&
      (t.parent_tour_id === primaryTour.id || (!t.parent_tour_id && primaryTourCount <= 1))
  );

  // Reset form when modal closes or editing changes
  useEffect(() => {
    if (!isOpen) {
      setShowAddForm(false);
      setEditingTour(null);
      form.reset();
    }
  }, [isOpen, form]);

  // Populate form when editing
  useEffect(() => {
    if (editingTour) {
      form.reset({
        title: editingTour.title || "",
        description: editingTour.description || "",
        matterport_tour_id: editingTour.matterport_tour_id || "",
        matterport_url: editingTour.matterport_url || "",
        navigation_keywords: editingTour.navigation_keywords?.join(', ') || "",
      });
      setShowAddForm(true);
    }
  }, [editingTour, form]);

  const extractMatterportId = (url: string) => {
    const match = url.match(/[?&]m=([^&]+)/);
    return match ? match[1] : "";
  };

  const handleUrlChange = (value: string) => {
    const id = extractMatterportId(value);
    if (id && !form.getValues("matterport_tour_id")) {
      form.setValue("matterport_tour_id", id);
    }
  };

  const handleSave = async (data: SecondaryTourFormData) => {
    if (!authUser || !venueId) return;

    setIsLoading(true);
    try {
      // Parse keywords from comma-separated string
      const keywords = data.navigation_keywords
        ? data.navigation_keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
        : [];

      if (editingTour) {
        // Update existing tour (primary or secondary)
        const tourData = {
          title: data.title,
          description: data.description || undefined,
          matterport_tour_id: data.matterport_tour_id,
          matterport_url: data.matterport_url,
          navigation_keywords: keywords,
          display_order: editingTour.display_order,
        };
        
        // Use generic updateTour function for both primary and secondary tours
        await updateTour(editingTour.id, tourData);
      } else {
        const token = await authUser.getIdToken();
        const response = await fetch('/api/app/tours', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            venueId,
            parentTourId: primaryTour.id,
            title: data.title,
            description: data.description || null,
            matterportTourId: data.matterport_tour_id,
            matterportUrl: data.matterport_url,
            tourType: 'secondary',
            navigationKeywords: keywords,
            displayOrder: secondaryTours.length + 2, // Primary starts at 1
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create model');
        }
      }

      // Refresh tours list
      onRefresh();
      
      // Reset form
      form.reset();
      setShowAddForm(false);
      setEditingTour(null);
    } catch (error: any) {
      console.error('Error saving secondary tour:', error);
      alert(error.message || 'Failed to save tour. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tourId: string) => {
    if (!authUser) return;
    
    if (!confirm('Are you sure you want to delete this secondary tour? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteSecondaryTour(tourId, venueId);
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting tour:', error);
      alert(error.message || 'Failed to delete tour. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (tour: Tour) => {
    setEditingTour(tour);
  };

  const handleCancelEdit = () => {
    setEditingTour(null);
    setShowAddForm(false);
    form.reset();
  };

  const handleLoadModel = async (model: Tour) => {
    if (activeModelId === model.matterport_tour_id) return;
    await onSelectModel(model);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={isDarkMode ? "sm:max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-700/80 bg-[#0f1117] text-slate-100" : "sm:max-w-3xl max-h-[90vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? "flex items-center text-slate-100" : "flex items-center"}>
            <Camera className={isDarkMode ? "w-5 h-5 mr-2 text-slate-300" : "w-5 h-5 mr-2 text-brand-blue"} />
            Manage Models in This Tour
          </DialogTitle>
          <DialogDescription className={isDarkMode ? "text-slate-400" : undefined}>
            Combine multiple Matterport models under one tour experience.
            The AI and on-tour buttons can switch visitors between models while keeping one shared embed and one shared chatbot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Primary Tour Display */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-text-primary-light dark:text-text-primary-dark">
              Primary Model
            </h3>
            <Card className="dark:border-slate-700/80 dark:bg-[#11141c]">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                        {primaryTour.title}
                      </h4>
                    </div>
                    {primaryTour.description && (
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
                        {primaryTour.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                      <span>Model: {primaryTour.matterport_tour_id}</span>
                      <a 
                        href={primaryTour.matterport_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center hover:text-brand-blue"
                      >
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingTour(primaryTour)}
                    className="dark:border-slate-700/80 dark:bg-[#11141c] dark:text-slate-100 dark:hover:bg-[#1a1e27]"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleLoadModel(primaryTour)}
                    disabled={isLoading || activeModelId === primaryTour.matterport_tour_id}
                    className="dark:border-slate-700/80 dark:bg-[#11141c] dark:text-slate-100 dark:hover:bg-[#1a1e27]"
                  >
                    {activeModelId === primaryTour.matterport_tour_id ? "Loaded" : "Load"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Tours List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                Additional Models ({secondaryTours.length})
              </h3>
              {!showAddForm && (
                <Button
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  className="dark:border-slate-700/80 dark:bg-[#11141c] dark:text-slate-100 dark:hover:bg-[#1a1e27]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Model
                </Button>
              )}
            </div>

            {secondaryTours.length === 0 && !showAddForm && (
              <Card className="dark:border-slate-700/80 dark:bg-[#11141c]">
                <CardContent className="p-8 text-center">
                  <Camera className="w-12 h-12 mx-auto mb-3 text-text-tertiary-light dark:text-text-tertiary-dark" />
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                    No additional models yet. Add another Matterport model to let visitors navigate between areas.
                  </p>
                </CardContent>
              </Card>
            )}

            {secondaryTours.map((tour) => (
              <Card key={tour.id} className="mb-2 dark:border-slate-700/80 dark:bg-[#11141c]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                          {tour.title}
                        </h4>
                        <Badge variant="outline" className="dark:border-slate-700/80 dark:bg-[#11141c] dark:text-slate-300">Additional model</Badge>
                      </div>
                      {tour.description && (
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
                          {tour.description}
                        </p>
                      )}
                      {tour.navigation_keywords && tour.navigation_keywords.length > 0 && (
                        <div className="flex items-start gap-2 mb-2">
                          <Tag className="w-3 h-3 mt-0.5 text-text-tertiary-light dark:text-text-tertiary-dark" />
                          <div className="flex flex-wrap gap-1">
                            {tour.navigation_keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs dark:bg-[#1a1e27] dark:text-slate-300">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                        <span>Model: {tour.matterport_tour_id}</span>
                        <a 
                          href={tour.matterport_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center hover:text-brand-blue"
                        >
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleLoadModel(tour)}
                        disabled={isLoading || activeModelId === tour.matterport_tour_id}
                        className="dark:border-slate-700/80 dark:bg-[#11141c] dark:text-slate-100 dark:hover:bg-[#1a1e27]"
                      >
                        {activeModelId === tour.matterport_tour_id ? "Loaded" : "Load"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(tour)}
                        disabled={isLoading}
                        className="dark:border-slate-700/80 dark:bg-[#11141c] dark:text-slate-100 dark:hover:bg-[#1a1e27]"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(tour.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <Card className="border-brand-blue border-2 dark:border-slate-700/80 dark:bg-[#11141c]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    {editingTour ? 'Edit Model' : 'Add New Model'}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="dark:text-slate-300 dark:hover:bg-[#1a1e27]"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

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
                          <FormDescription>
                            Paste the full URL from your Matterport tour
                          </FormDescription>
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
                          <FormDescription>
                            The unique ID from your Matterport URL (automatically extracted)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Main Hall & Bar, Accommodation Wing"
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe this location..."
                              rows={2}
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="navigation_keywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AI Navigation Keywords</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., cold hut, ice bath, sauna, recovery area"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Comma-separated keywords. When visitors mention these, the AI can switch to this model.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                        className="dark:border-slate-700/80 dark:bg-[#11141c] dark:text-slate-100 dark:hover:bg-[#1a1e27]"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="dark:border-slate-700/80 dark:bg-[#11141c] dark:text-slate-100 dark:hover:bg-[#1a1e27]"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {editingTour ? 'Update Model' : 'Add Model'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex items-center justify-end pt-4 border-t dark:border-slate-800">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="dark:border-slate-700/80 dark:bg-[#11141c] dark:text-slate-100 dark:hover:bg-[#1a1e27]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

