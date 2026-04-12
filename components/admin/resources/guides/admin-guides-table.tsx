"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Globe,
  Target,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X
} from "lucide-react";
import { useAdminGuides } from "@/hooks/admin/useAdminGuides";
import { GuideEditorModal } from "./guide-editor-modal";
import { cn } from "@/lib/utils";
import { Guide } from "@/lib/types";

interface AdminGuidesTableProps {
  className?: string;
}

type SortField = 'title' | 'created_at' | 'published_at' | 'view_count' | 'reading_time_minutes' | 'difficulty_level';
type SortDirection = 'asc' | 'desc';

export function AdminGuidesTable({ className }: AdminGuidesTableProps) {
  const {
    guides,
    tags,
    isLoading,
    error,
    filters,
    selectedGuides,
    totalCount,
    refetch,
    updateFilters,
    clearFilters,
    selectGuide,
    selectAllGuides,
    clearSelection,
    bulkPublish,
    bulkUnpublish,
    bulkDelete,
    deleteGuide,
  } = useAdminGuides();

  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [guideToDelete, setGuideToDelete] = useState<Guide | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const sortedGuides = [...guides].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'created_at' || sortField === 'published_at') {
      aValue = new Date(aValue || 0).getTime();
      bValue = new Date(bValue || 0).getTime();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (guide: Guide) => {
    if (guide.is_published) {
      return (
        <Badge variant="default" className="bg-success-green text-white">
          <Globe className="h-3 w-3 mr-1" />
          Published
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Edit className="h-3 w-3 mr-1" />
        Draft
      </Badge>
    );
  };

  const getDifficultyBadge = (difficulty: string) => {
    const variants = {
      beginner: "bg-green-100 text-green-800 border-green-200",
      intermediate: "bg-yellow-100 text-yellow-800 border-yellow-200",
      advanced: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <Badge variant="outline" className={variants[difficulty as keyof typeof variants]}>
        <Target className="h-3 w-3 mr-1" />
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </Badge>
    );
  };

  const handleCreateGuide = () => {
    setEditingGuide(null);
    setIsEditorOpen(true);
  };

  const handleEditGuide = (guide: Guide) => {
    setEditingGuide(guide);
    setIsEditorOpen(true);
  };

  const handleDeleteGuide = (guide: Guide) => {
    setGuideToDelete(guide);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteGuide = async () => {
    if (guideToDelete) {
      await deleteGuide(guideToDelete.id);
      setDeleteDialogOpen(false);
      setGuideToDelete(null);
    }
  };

  const handleViewGuide = (guide: Guide) => {
    window.open(`/resources/guides/${guide.slug}`, '_blank');
  };

  const handleBulkDelete = () => {
    if (selectedGuides.length === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    await bulkDelete();
    setBulkDeleteDialogOpen(false);
  };

  const allSelected = guides.length > 0 && selectedGuides.length === guides.length;
  const partialSelected = selectedGuides.length > 0 && selectedGuides.length < guides.length;

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <BookOpen className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
              Failed to Load Guides
            </h3>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
              {error}
            </p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Guides ({totalCount})
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={refetch} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button 
                onClick={handleCreateGuide}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Guide
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search guides..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="shrink-0"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              {(filters.search || filters.tags?.length || filters.difficulty || filters.published !== undefined) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="shrink-0"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select 
                    value={filters.published === undefined ? 'all' : filters.published ? 'published' : 'draft'} 
                    onValueChange={(value) => updateFilters({ 
                      published: value === 'all' ? undefined : value === 'published' 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Guides</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Drafts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select 
                    value={filters.difficulty || 'all-levels'} 
                    onValueChange={(value) => updateFilters({ 
                      difficulty: value === 'all-levels' ? undefined : value as 'beginner' | 'intermediate' | 'advanced'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-levels">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <Select 
                    value={filters.tags?.length ? filters.tags[0] : 'all-tags'} 
                    onValueChange={(value) => updateFilters({ 
                      tags: value === 'all-tags' ? [] : [value] 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-tags">All Tags</SelectItem>
                      {tags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedGuides.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedGuides.length} guide(s) selected
              </span>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={bulkPublish}>
                  <Globe className="h-4 w-4 mr-2" />
                  Publish
                </Button>
                <Button size="sm" variant="outline" onClick={bulkUnpublish}>
                  <Edit className="h-4 w-4 mr-2" />
                  Unpublish
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading guides...</div>
            </div>
          ) : guides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No guides found</p>
              <p className="text-sm">Create your first guide to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectAllGuides();
                          } else {
                            clearSelection();
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-[300px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('title')}
                        className="h-auto p-0 font-medium"
                      >
                        Title
                        {getSortIcon('title')}
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('difficulty_level')}
                        className="h-auto p-0 font-medium"
                      >
                        Difficulty
                        {getSortIcon('difficulty_level')}
                      </Button>
                    </TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('view_count')}
                        className="h-auto p-0 font-medium"
                      >
                        Views
                        {getSortIcon('view_count')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('reading_time_minutes')}
                        className="h-auto p-0 font-medium"
                      >
                        Read Time
                        {getSortIcon('reading_time_minutes')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('created_at')}
                        className="h-auto p-0 font-medium"
                      >
                        Created
                        {getSortIcon('created_at')}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGuides.map((guide) => (
                    <TableRow key={guide.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedGuides.includes(guide.id)}
                          onCheckedChange={() => selectGuide(guide.id)}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium line-clamp-2">
                            {guide.title}
                          </div>
                          {guide.excerpt && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {guide.excerpt}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(guide)}
                      </TableCell>
                      
                      <TableCell>
                        {getDifficultyBadge(guide.difficulty_level)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {guide.tags?.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {guide.tags && guide.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{guide.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Eye className="h-3 w-3" />
                          {guide.view_count?.toLocaleString() || 0}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {guide.reading_time_minutes || 0} min
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(guide.created_at)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGuide(guide)}
                            className="h-8 w-8 p-0"
                            title="Edit guide"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {guide.is_published && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewGuide(guide)}
                              className="h-8 w-8 p-0"
                              title="View live"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGuide(guide)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete guide"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <GuideEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        guide={editingGuide}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{guideToDelete?.title}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteGuide}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Guide
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Guides</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedGuides.length} selected guide{selectedGuides.length > 1 ? 's' : ''}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedGuides.length} Guide{selectedGuides.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 