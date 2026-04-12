"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpCategory } from "@/lib/types";
import { HelpArticleCard } from "./HelpArticleCard";
import { useHelpArticles } from "@/hooks/app/useHelpArticles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  X, 
  Loader2,
  BookOpen
} from "lucide-react";

interface HelpCategoryPageProps {
  category: HelpCategory;
}

export function HelpCategoryPage({ category }: HelpCategoryPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { 
    articles, 
    tags, 
    isLoading, 
    error, 
    hasMore, 
    loadMore, 
    updateFilters 
  } = useHelpArticles({
    category: category.id,
  });

  // Update filters when search or filters change
  useEffect(() => {
    updateFilters({
      category: category.id,
      search: searchQuery || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
  }, [searchQuery, selectedTags, category.id, updateFilters]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0;

  const getCategoryGradient = (categoryId: string) => {
    const gradients: Record<string, string> = {
      'getting-started': 'from-green-500/10 to-emerald-500/10',
      'tours': 'from-blue-500/10 to-cyan-500/10',
      'chatbots': 'from-purple-500/10 to-violet-500/10',
      'analytics': 'from-orange-500/10 to-amber-500/10',
      'billing': 'from-pink-500/10 to-rose-500/10',
      'troubleshooting': 'from-red-500/10 to-orange-500/10'
    };
    return gradients[categoryId] || 'from-brand-blue/10 to-ai-pink/10';
  };

  if (error) {
    return (
      <div className="container py-16">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ Error loading help articles</div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`relative py-16 lg:py-24 bg-gradient-to-br ${getCategoryGradient(category.id)} dark:from-slate-900/50 dark:to-slate-800/30`}>
        <div className="container">
          {/* Back Button */}
          <div className="mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Help Centre
            </Button>
          </div>

          {/* Category Header */}
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-brand-blue/20 to-ai-pink/20 rounded-2xl">
              <span className="text-3xl" role="img" aria-label={category.name}>
                {category.icon}
              </span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
              {category.name}
            </h1>
            
            {category.description && (
              <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark max-w-2xl mx-auto mb-6">
                {category.description}
              </p>
            )}

            <Badge variant="secondary" className="text-sm">
              {category.article_count} {category.article_count === 1 ? 'article' : 'articles'}
            </Badge>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-12">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark" />
                <Input
                  type="text"
                  placeholder={`Search ${category.name.toLowerCase()} articles...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-3 border border-border-light dark:border-border-dark rounded-xl bg-bg-primary-light dark:bg-bg-primary-dark focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:focus:border-slate-600 dark:focus:ring-slate-600/30 transition-all duration-200"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {[searchQuery, ...selectedTags].filter(Boolean).length}
                  </Badge>
                )}
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="flex items-center space-x-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-brand-blue dark:hover:text-slate-100"
                >
                  <X className="w-4 h-4" />
                  <span>Clear filters</span>
                </Button>
              )}
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="p-6 border border-border-light dark:border-border-dark rounded-xl bg-bg-secondary-light dark:bg-bg-secondary-dark mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block text-text-primary-light dark:text-text-primary-dark">Tags</label>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 text-sm rounded-full border transition-all duration-200 ${
                          selectedTags.includes(tag)
                            ? "bg-brand-blue text-white border-brand-blue dark:border-slate-600 dark:bg-neutral-800 dark:text-slate-100"
                            : "bg-bg-primary-light dark:bg-bg-primary-dark text-text-secondary-light dark:text-text-secondary-dark border-border-light dark:border-border-dark hover:border-brand-blue hover:text-brand-blue dark:hover:border-slate-600 dark:hover:text-slate-100"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && articles.length === 0 && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-blue dark:text-slate-300" />
            </div>
          )}

          {/* No Results */}
          {!isLoading && articles.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">
                <BookOpen className="w-16 h-16 mx-auto text-text-tertiary-light dark:text-text-tertiary-dark" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                No articles found
              </h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                {hasActiveFilters 
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : `We're working on creating ${category.name.toLowerCase()} content for you. Check back soon!`
                }
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline">
                  Clear all filters
                </Button>
              )}
            </div>
          )}

          {/* Articles Grid */}
          {articles.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {articles.map((article) => (
                  <HelpArticleCard key={article.id} article={article} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center">
                  <Button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="px-8 py-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More Articles"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Navigation */}
          <div className="border-t border-border-light dark:border-border-dark pt-12 mt-12">
            <div className="text-center">
              <Link
                href="/app/help"
                className="text-brand-blue hover:text-brand-blue/80 transition-colors duration-200 dark:text-slate-300 dark:hover:text-slate-100"
              >
                ← Back to Help Centre
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 