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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  HelpCircle, 
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
  X,
  Hash
} from "lucide-react";
import { useAdminHelp } from "@/hooks/admin/useAdminHelp";
import { HelpEditorModal } from "./help-editor-modal";
import { cn } from "@/lib/utils";
import { HelpArticle } from "@/lib/types";

interface AdminHelpTableProps {
  className?: string;
}

type SortField = 'title' | 'created_at' | 'published_at' | 'view_count' | 'reading_time_minutes' | 'priority';
type SortDirection = 'asc' | 'desc';

const categoryLabels = {
  'getting-started': 'Getting Started',
  'tours': 'Tours',
  'chatbots': 'Chatbots',
  'analytics': 'Analytics',
  'billing': 'Billing',
  'troubleshooting': 'Troubleshooting',
};

export function AdminHelpTable({ className }: AdminHelpTableProps) {
  const {
    articles,
    tags,
    isLoading,
    error,
    filters,
    selectedArticles,
    totalCount,
    refetch,
    updateFilters,
    clearFilters,
    selectArticle,
    selectAllArticles,
    clearSelection,
    bulkPublish,
    bulkUnpublish,
    bulkDelete,
    deleteArticle,
  } = useAdminHelp();

  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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
      setSortDirection(field === 'priority' ? 'desc' : 'desc');
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

  const sortedArticles = [...articles].sort((a, b) => {
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

  const getStatusBadge = (article: HelpArticle) => {
    if (article.is_published) {
      return (
        <Badge variant="default" className="bg-success-green text-white">
          <Globe className="h-3 w-3 mr-1" />
          Published
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Edit className="h-3 w-3 mr-1" />
        Draft
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      'getting-started': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'tours': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'chatbots': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'analytics': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'billing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'troubleshooting': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    return (
      <Badge variant="outline" className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {categoryLabels[category as keyof typeof categoryLabels] || category}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 80) {
      return (
        <Badge variant="destructive">
          High ({priority})
        </Badge>
      );
    } else if (priority >= 50) {
      return (
        <Badge variant="default" className="bg-yellow-500 text-white">
          Medium ({priority})
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          Low ({priority})
        </Badge>
      );
    }
  };

  const handleCreateArticle = () => {
    setEditingArticle(null);
    setIsEditorOpen(true);
  };

  const handleEditArticle = (article: HelpArticle) => {
    setEditingArticle(article);
    setIsEditorOpen(true);
  };

  const handleDeleteArticle = async (article: HelpArticle) => {
    if (window.confirm(`Are you sure you want to delete "${article.title}"?`)) {
      await deleteArticle(article.id);
    }
  };

  const handleViewArticle = (article: HelpArticle) => {
    window.open(`/app/help/article/${article.slug}`, '_blank');
  };

  const handleBulkDelete = async () => {
    if (selectedArticles.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedArticles.length} selected help article(s)?`)) {
      await bulkDelete();
    }
  };

  const allSelected = articles.length > 0 && selectedArticles.length === articles.length;
  const partialSelected = selectedArticles.length > 0 && selectedArticles.length < articles.length;

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <HelpCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
              Failed to Load Help Articles
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
              <HelpCircle className="h-5 w-5" />
              Help Articles ({totalCount})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button onClick={handleCreateArticle}>
                <Plus className="h-4 w-4 mr-2" />
                New Article
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search help articles..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
              {(filters.search || filters.category || (filters.tags && filters.tags.length > 0)) && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="shrink-0"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select
                    value={filters.category || 'all'}
                    onValueChange={(value) => updateFilters({ category: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <Select
                    value={filters.tags && filters.tags.length > 0 ? filters.tags.join(',') : 'all'}
                    onValueChange={(value) => updateFilters({ tags: value === 'all' ? [] : [value] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {tags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedArticles.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <span className="text-sm font-medium">
                {selectedArticles.length} selected
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={bulkPublish}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Publish
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={bulkUnpublish}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Unpublish
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllArticles();
                        } else {
                          clearSelection();
                        }
                      }}
                      ref={(el) => {
                        if (el && 'indeterminate' in el) {
                          (el as any).indeterminate = partialSelected;
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-2">
                      Title
                      {getSortIcon('title')}
                    </div>
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center gap-2">
                      Priority
                      {getSortIcon('priority')}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('view_count')}
                  >
                    <div className="flex items-center gap-2">
                      Views
                      {getSortIcon('view_count')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Created
                      {getSortIcon('created_at')}
                    </div>
                  </TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading help articles...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedArticles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-center">
                        <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          {filters.search || filters.category || (filters.tags && filters.tags.length > 0)
                            ? 'No help articles found matching your filters'
                            : 'No help articles found'
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedArticles.includes(article.id)}
                          onCheckedChange={() => selectArticle(article.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium line-clamp-2">
                            {article.title}
                          </div>
                          {article.excerpt && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {article.excerpt}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(article.category)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(article.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(article)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {article.view_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(article.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewArticle(article)}
                            title="View article"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditArticle(article)}
                            title="Edit article"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArticle(article)}
                            title="Delete article"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Load More */}
          {articles.length < totalCount && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => updateFilters({ 
                  limit: (filters.limit || 50) + 25 
                })}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load More Articles
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isEditorOpen && (
        <HelpEditorModal
          article={editingArticle}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingArticle(null);
          }}
          onSave={() => {
            setIsEditorOpen(false);
            setEditingArticle(null);
            refetch();
          }}
        />
      )}
    </>
  );
} 