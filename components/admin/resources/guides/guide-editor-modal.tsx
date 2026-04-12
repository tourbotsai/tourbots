"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Save, 
  Upload, 
  X, 
  Image as ImageIcon, 
  BookOpen, 
  Settings,
  Tag,
  Eye,
  Loader2,
  Target
} from "lucide-react";
import { useAdminGuides } from "@/hooks/admin/useAdminGuides";
import { useImageUpload } from "@/hooks/admin/useImageUpload";
import { Guide } from "@/lib/types";
import Image from "next/image";

interface GuideEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  guide?: Guide | null;
}

interface GuideFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  header_image: string;
  additional_images: string[];
  meta_title: string;
  meta_description: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_published: boolean;
  reading_time_minutes: number;
}

const defaultFormData: GuideFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  header_image: '',
  additional_images: [],
  meta_title: '',
  meta_description: '',
  tags: [],
  difficulty_level: 'beginner',
  is_published: false,
  reading_time_minutes: 0,
};

export function GuideEditorModal({ isOpen, onClose, guide }: GuideEditorModalProps) {
  const { createGuide, updateGuide } = useAdminGuides();
  const { uploadImage, isUploading } = useImageUpload();
  
  const [formData, setFormData] = useState<GuideFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!guide;

  useEffect(() => {
    if (isOpen) {
      if (guide) {
        setFormData({
          title: guide.title || '',
          slug: guide.slug || '',
          excerpt: guide.excerpt || '',
          content: guide.content || '',
          cover_image: guide.cover_image || '',
          header_image: guide.header_image || '',
          additional_images: guide.additional_images || [],
          meta_title: guide.meta_title || '',
          meta_description: guide.meta_description || '',
          tags: guide.tags || [],
          difficulty_level: guide.difficulty_level || 'beginner',
          is_published: guide.is_published || false,
          reading_time_minutes: guide.reading_time_minutes || 0,
        });
      } else {
        setFormData(defaultFormData);
      }
      setErrors({});
      setActiveTab("content");
    }
  }, [isOpen, guide]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      meta_title: prev.meta_title || title,
    }));
  };

  const handleImageUpload = async (
    file: File, 
    imageType: 'cover' | 'header' | 'additional'
  ) => {
    try {
      const imageUrl = await uploadImage(file, 'guides', imageType, guide?.id);
      
      if (imageType === 'additional') {
        setFormData(prev => ({
          ...prev,
          additional_images: [...prev.additional_images, imageUrl]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [`${imageType}_image`]: imageUrl
        }));
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const handleRemoveImage = (imageType: 'cover' | 'header', url?: string) => {
    if (imageType === 'cover') {
      setFormData(prev => ({ ...prev, cover_image: '' }));
    } else if (imageType === 'header') {
      setFormData(prev => ({ ...prev, header_image: '' }));
    }
  };

  const handleRemoveAdditionalImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additional_images: prev.additional_images.filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    }

    if (!formData.difficulty_level) {
      newErrors.difficulty_level = "Difficulty level is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setActiveTab("content");
      return;
    }

    setIsSubmitting(true);

    try {
      const guideData = {
        ...formData,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        reading_time_minutes: formData.reading_time_minutes || undefined,
      };

      if (isEditing && guide) {
        await updateGuide(guide.id, guideData);
      } else {
        await createGuide(guideData);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save guide:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    const icons = {
      beginner: "🌱",
      intermediate: "🚀",
      advanced: "⚡",
    };
    return icons[difficulty as keyof typeof icons] || "🎯";
  };

  const ImageUploadSection = ({ 
    type, 
    label, 
    currentImage, 
    onRemove 
  }: { 
    type: 'cover' | 'header' | 'additional';
    label: string;
    currentImage?: string;
    onRemove?: () => void;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {currentImage ? (
        <div className="relative">
          <div className="relative w-full h-32 rounded-lg overflow-hidden">
            <Image
              src={currentImage}
              alt={label}
              fill
              className="object-cover"
            />
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <label className="cursor-pointer block text-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, type);
              }}
              disabled={isUploading}
            />
            <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isUploading ? "Uploading..." : "Click to upload image"}
            </p>
          </label>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {isEditing ? 'Edit Guide' : 'Create New Guide'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter guide title..."
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="guide-url-slug"
                  className={errors.slug ? "border-red-500" : ""}
                />
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level *</Label>
              <Select 
                value={formData.difficulty_level}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  difficulty_level: value as 'beginner' | 'intermediate' | 'advanced' 
                }))}
              >
                <SelectTrigger className={errors.difficulty_level ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    <div className="flex items-center gap-2">
                      <span>{getDifficultyIcon('beginner')}</span>
                      <span>Beginner</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="intermediate">
                    <div className="flex items-center gap-2">
                      <span>{getDifficultyIcon('intermediate')}</span>
                      <span>Intermediate</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="flex items-center gap-2">
                      <span>{getDifficultyIcon('advanced')}</span>
                      <span>Advanced</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.difficulty_level && (
                <p className="text-sm text-red-500">{errors.difficulty_level}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief description of the guide..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your guide content in Markdown..."
                rows={15}
                className={`font-mono text-sm ${errors.content ? "border-red-500" : ""}`}
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content}</p>
              )}
              <p className="text-xs text-muted-foreground">
                You can use Markdown formatting. Images, links, headers, and code blocks are supported.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  <Tag className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-6 mt-6">
            <ImageUploadSection
              type="cover"
              label="Cover Image"
              currentImage={formData.cover_image}
              onRemove={() => handleRemoveImage('cover')}
            />

            <ImageUploadSection
              type="header"
              label="Header Image"
              currentImage={formData.header_image}
              onRemove={() => handleRemoveImage('header')}
            />

            <div className="space-y-2">
              <Label>Additional Images</Label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.additional_images.map((image, index) => (
                  <div key={index} className="relative">
                    <div className="relative w-full h-24 rounded-lg overflow-hidden">
                      <Image
                        src={image}
                        alt={`Additional ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={() => handleRemoveAdditionalImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg h-24 flex items-center justify-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'additional');
                      }}
                      disabled={isUploading}
                    />
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                value={formData.meta_title}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                placeholder="SEO title for search engines..."
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 50-60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                placeholder="SEO description for search engines..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 150-160 characters
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Published</Label>
                <p className="text-sm text-muted-foreground">
                  Make this guide visible to the public
                </p>
              </div>
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reading_time">Reading Time (minutes)</Label>
              <Input
                id="reading_time"
                type="number"
                min="0"
                value={formData.reading_time_minutes}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  reading_time_minutes: parseInt(e.target.value) || 0 
                }))}
                placeholder="Estimated reading time..."
              />
              <p className="text-xs text-muted-foreground">
                Leave as 0 to auto-calculate based on content length
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Difficulty Level Guidelines
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">🌱 Beginner:</span> No prior knowledge required, basic concepts
                </div>
                <div>
                  <span className="font-medium">🚀 Intermediate:</span> Some experience needed, builds on basics
                </div>
                <div>
                  <span className="font-medium">⚡ Advanced:</span> Significant experience required, complex topics
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex items-center gap-2">
            {formData.is_published && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/resources/guides/${formData.slug}`, '_blank')}
                disabled={!formData.slug}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditing ? 'Update Guide' : 'Create Guide'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 