"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Save, 
  Eye, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Trash2,
  Plus,
  Hash
} from "lucide-react";
import { useAdminHelp } from "@/hooks/admin/useAdminHelp";
import { HelpArticle } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HelpEditorModalProps {
  article: HelpArticle | null;
  onClose: () => void;
  onSave: () => void;
}

const categoryOptions = [
  { value: 'getting-started', label: 'Getting Started' },
  { value: 'tours', label: 'Tours' },
  { value: 'chatbots', label: 'Chatbots' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'billing', label: 'Billing' },
  { value: 'troubleshooting', label: 'Troubleshooting' },
];

export function HelpEditorModal({ article, onClose, onSave }: HelpEditorModalProps) {
  const { createArticle, updateArticle } = useAdminHelp();
  const [activeTab, setActiveTab] = useState("content");
  const [isLoading, setIsLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState<{[key: string]: boolean}>({});

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    header_image: '',
    additional_images: [] as string[],
    meta_title: '',
    meta_description: '',
    tags: [] as string[],
    category: 'getting-started' as 'getting-started' | 'tours' | 'chatbots' | 'analytics' | 'billing' | 'troubleshooting',
    priority: 0,
    is_published: false,
    reading_time_minutes: null as number | null,
  });

  const [newTag, setNewTag] = useState('');

  // Initialize form data
  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        slug: article.slug || '',
        excerpt: article.excerpt || '',
        content: article.content || '',
        cover_image: article.cover_image || '',
        header_image: article.header_image || '',
        additional_images: Array.isArray(article.additional_images) ? article.additional_images : [],
        meta_title: article.meta_title || '',
        meta_description: article.meta_description || '',
        tags: Array.isArray(article.tags) ? article.tags : [],
        category: article.category || 'getting-started',
        priority: article.priority || 0,
        is_published: article.is_published || false,
        reading_time_minutes: article.reading_time_minutes || null,
      });
    } else {
      // Reset form for new article
      setFormData({
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
        category: 'getting-started',
        priority: 0,
        is_published: false,
        reading_time_minutes: null,
      });
    }
  }, [article]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!article && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, article]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (file: File, type: 'cover' | 'header' | 'additional') => {
    try {
      setImageUploading(prev => ({ ...prev, [type]: true }));

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', type);
      if (article) {
        formDataUpload.append('articleId', article.id);
      }

      const response = await fetch('/api/admin/help/upload/images', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      if (type === 'additional') {
        setFormData(prev => ({
          ...prev,
          additional_images: [...prev.additional_images, data.imageUrl]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [`${type}_image`]: data.imageUrl
        }));
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Failed to upload image');
    } finally {
      setImageUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleRemoveAdditionalImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      additional_images: prev.additional_images.filter(url => url !== imageUrl)
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Validate required fields
      if (!formData.title.trim()) {
        alert('Title is required');
        setActiveTab('content');
        return;
      }

      if (!formData.content.trim()) {
        alert('Content is required');
        setActiveTab('content');
        return;
      }

      if (!formData.category) {
        alert('Category is required');
        setActiveTab('settings');
        return;
      }

      // Prepare data for submission
      const submitData = {
        ...formData,
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt.trim() || null,
        content: formData.content.trim(),
        cover_image: formData.cover_image || null,
        header_image: formData.header_image || null,
        additional_images: formData.additional_images,
        meta_title: formData.meta_title.trim() || null,
        meta_description: formData.meta_description.trim() || null,
        tags: formData.tags,
        priority: formData.priority,
      };

      let result;
      if (article) {
        result = await updateArticle(article.id, submitData);
      } else {
        result = await createArticle(submitData);
      }

      if (result) {
        onSave();
      }
    } catch (error: any) {
      console.error('Error saving article:', error);
      alert(error.message || 'Failed to save article');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    if (article) {
      window.open(`/app/help/article/${article.slug}`, '_blank');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {article ? 'Edit Help Article' : 'Create New Help Article'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter article title..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="article-url-slug"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be used in the URL
                  </p>
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    placeholder="Brief description of the article..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="reading_time">Reading Time (minutes)</Label>
                  <Input
                    id="reading_time"
                    type="number"
                    value={formData.reading_time_minutes || ''}
                    onChange={(e) => handleInputChange('reading_time_minutes', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Auto-calculated if left empty"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority (0-100)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher priority articles appear first
                  </p>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Write your article content here... (Supports Markdown)"
                rows={15}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can use Markdown formatting
              </p>
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cover Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Cover Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.cover_image ? (
                    <div className="space-y-4">
                      <img
                        src={formData.cover_image}
                        alt="Cover"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('cover_image', '')}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload a cover image for your article
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'cover');
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={imageUploading.cover}
                        />
                        <Button disabled={imageUploading.cover}>
                          <Upload className="h-4 w-4 mr-2" />
                          {imageUploading.cover ? 'Uploading...' : 'Upload Image'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Header Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Header Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.header_image ? (
                    <div className="space-y-4">
                      <img
                        src={formData.header_image}
                        alt="Header"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('header_image', '')}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload a header image for your article
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'header');
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={imageUploading.header}
                        />
                        <Button disabled={imageUploading.header}>
                          <Upload className="h-4 w-4 mr-2" />
                          {imageUploading.header ? 'Uploading...' : 'Upload Image'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Additional Images */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Additional Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {formData.additional_images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Additional ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveAdditionalImage(imageUrl)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload additional images for your article
                  </p>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => handleImageUpload(file, 'additional'));
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={imageUploading.additional}
                    />
                    <Button disabled={imageUploading.additional}>
                      <Upload className="h-4 w-4 mr-2" />
                      {imageUploading.additional ? 'Uploading...' : 'Upload Images'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => handleInputChange('meta_title', e.target.value)}
                  placeholder="SEO title for search engines"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended length: 50-60 characters. Leave empty to use article title.
                </p>
              </div>

              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  placeholder="SEO description for search engines"
                  rows={3}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended length: 150-160 characters. Leave empty to use excerpt.
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">SEO Preview</h4>
                <div className="space-y-2">
                  <div className="text-blue-600 text-lg font-medium line-clamp-1">
                    {formData.meta_title || formData.title || 'Article Title'}
                  </div>
                  <div className="text-green-600 text-sm">
                    example.com/app/help/article/{formData.slug || 'article-slug'}
                  </div>
                  <div className="text-gray-600 text-sm line-clamp-2">
                    {formData.meta_description || formData.excerpt || 'Article description will appear here...'}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Published Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this article visible to users
                  </p>
                </div>
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => handleInputChange('is_published', checked)}
                />
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-4">Article Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <div className="font-medium">
                      {categoryOptions.find(opt => opt.value === formData.category)?.label || formData.category}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Priority:</span>
                    <div className="font-medium">{formData.priority}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tags:</span>
                    <div className="font-medium">
                      {formData.tags.length > 0 ? formData.tags.join(', ') : 'None'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="font-medium">
                      {formData.is_published ? 'Published' : 'Draft'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            {article && (
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : article ? 'Update Article' : 'Create Article'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 