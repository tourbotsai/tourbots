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
  FileText, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Globe,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X
} from "lucide-react";
import { useAdminBlogs } from "@/hooks/admin/useAdminBlogs";
import { BlogEditorModal } from "./blog-editor-modal";
import { cn } from "@/lib/utils";
import { Blog } from "@/lib/types";

interface AdminBlogsTableProps {
  className?: string;
}

type SortField = 'title' | 'created_at' | 'published_at' | 'view_count' | 'reading_time_minutes';
type SortDirection = 'asc' | 'desc';

export function AdminBlogsTable({ className }: AdminBlogsTableProps) {
  const {
    blogs,
    tags,
    isLoading,
    error,
    filters,
    selectedBlogs,
    totalCount,
    refetch,
    updateFilters,
    clearFilters,
    selectBlog,
    selectAllBlogs,
    clearSelection,
    bulkPublish,
    bulkUnpublish,
    bulkDelete,
    deleteBlog,
  } = useAdminBlogs();

  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const getTimeRemaining = (scheduledDate: Date) => {
    const now = new Date();
    const diffMs = scheduledDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Due now';
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    if (diffMinutes > 0) return `in ${diffMinutes} min${diffMinutes > 1 ? 's' : ''}`;
    return 'Due now';
  };

  const getDateDisplay = (blog: Blog) => {
    if (blog.is_published && blog.published_at) {
      return (
        <div className="text-sm">
          <div className="font-medium">Published</div>
          <div className="text-muted-foreground">{formatDate(blog.published_at)}</div>
        </div>
      );
    }
    
    if (blog.is_scheduled && blog.scheduled_publish_at) {
      const scheduledDate = new Date(blog.scheduled_publish_at);
      const now = new Date();
      const isPastDue = scheduledDate <= now;
      const timeRemaining = getTimeRemaining(scheduledDate);
      
      return (
        <div className="text-sm">
          <div className={`font-medium flex items-center gap-1 ${isPastDue ? 'text-orange-600' : 'text-blue-600'}`}>
            <Calendar className="h-3 w-3" />
            {isPastDue ? 'Processing' : 'Scheduled'}
          </div>
          <div className="text-muted-foreground">{formatDate(blog.scheduled_publish_at)}</div>
          <div className={`text-xs ${isPastDue ? 'text-orange-500' : 'text-blue-500'}`}>
            {timeRemaining}
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-sm">
        <div className="font-medium">Created</div>
        <div className="text-muted-foreground">{formatDate(blog.created_at)}</div>
      </div>
    );
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

  const sortedBlogs = [...blogs].sort((a, b) => {
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

  const getStatusBadge = (blog: Blog) => {
    if (blog.is_published) {
      return (
        <Badge variant="default" className="bg-success-green text-white">
          <Globe className="h-3 w-3 mr-1" />
          Published
        </Badge>
      );
    }
    
    if (blog.is_scheduled && blog.scheduled_publish_at) {
      const scheduledDate = new Date(blog.scheduled_publish_at);
      const now = new Date();
      const isPastDue = scheduledDate <= now;
      const timeRemaining = getTimeRemaining(scheduledDate);
      
      return (
        <div className="space-y-1">
          <Badge 
            variant="outline" 
            className={`${isPastDue ? 'border-orange-500 text-orange-600' : 'border-blue-500 text-blue-600'}`}
          >
            <Calendar className="h-3 w-3 mr-1" />
            {isPastDue ? 'Processing' : 'Scheduled'}
          </Badge>
          <div className={`text-xs ${isPastDue ? 'text-orange-500' : 'text-blue-500'}`}>
            {timeRemaining}
          </div>
        </div>
      );
    }
    
    return (
      <Badge variant="secondary">
        <Edit className="h-3 w-3 mr-1" />
        Draft
      </Badge>
    );
  };

  const handleCreateBlog = () => {
    setEditingBlog(null);
    setIsEditorOpen(true);
  };

  const handleEditBlog = (blog: Blog) => {
    setEditingBlog(blog);
    setIsEditorOpen(true);
  };

  const handleDeleteBlog = (blog: Blog) => {
    setBlogToDelete(blog);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBlog = async () => {
    if (blogToDelete) {
      await deleteBlog(blogToDelete.id);
      setDeleteDialogOpen(false);
      setBlogToDelete(null);
    }
  };

  const handleViewBlog = (blog: Blog) => {
    window.open(`/resources/blogs/${blog.slug}`, '_blank');
  };

  const handleBulkDelete = () => {
    if (selectedBlogs.length === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    await bulkDelete();
    setBulkDeleteDialogOpen(false);
  };

  const allSelected = blogs.length > 0 && selectedBlogs.length === blogs.length;
  const partialSelected = selectedBlogs.length > 0 && selectedBlogs.length < blogs.length;

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
              Failed to Load Blogs
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
              <FileText className="h-5 w-5" />
              Blogs ({totalCount})
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
                onClick={handleCreateBlog}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Blog
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search blogs..."
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
              
              {(filters.search || filters.tags?.length || filters.published !== undefined) && (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select 
                    value={
                      filters.published === undefined 
                        ? 'all' 
                        : filters.published 
                          ? 'published' 
                          : filters.scheduled 
                            ? 'scheduled'
                            : 'draft'
                    } 
                    onValueChange={(value) => {
                      if (value === 'all') {
                        updateFilters({ published: undefined, scheduled: undefined });
                      } else if (value === 'published') {
                        updateFilters({ published: true, scheduled: undefined });
                      } else if (value === 'scheduled') {
                        updateFilters({ published: false, scheduled: true });
                      } else {
                        updateFilters({ published: false, scheduled: false });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Blogs</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="draft">Drafts</SelectItem>
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
          {selectedBlogs.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedBlogs.length} blog(s) selected
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
              <div className="text-muted-foreground">Loading blogs...</div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No blogs found</p>
              <p className="text-sm">Create your first blog to get started</p>
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
                            selectAllBlogs();
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
                  {sortedBlogs.map((blog) => (
                    <TableRow key={blog.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedBlogs.includes(blog.id)}
                          onCheckedChange={() => selectBlog(blog.id)}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium line-clamp-2">
                            {blog.title}
                          </div>
                          {blog.excerpt && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {blog.excerpt}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(blog)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {blog.tags?.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {blog.tags && blog.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{blog.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Eye className="h-3 w-3" />
                          {blog.view_count?.toLocaleString() || 0}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {blog.reading_time_minutes || 0} min
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getDateDisplay(blog)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditBlog(blog)}
                            className="h-8 w-8 p-0"
                            title="Edit blog"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {blog.is_published && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBlog(blog)}
                              className="h-8 w-8 p-0"
                              title="View live"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBlog(blog)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete blog"
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

      <BlogEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        blog={editingBlog}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{blogToDelete?.title}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteBlog}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Blog
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Blogs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedBlogs.length} selected blog{selectedBlogs.length > 1 ? 's' : ''}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedBlogs.length} Blog{selectedBlogs.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 