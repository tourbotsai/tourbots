"use client";

import { BlogCard } from "./BlogCard";
import { useBlogs } from "@/hooks/resources/useBlogs";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";

export function BlogGrid() {
  const { blogs, isLoading, error, hasMore, loadMore, updateFilters } = useBlogs();
  const [query, setQuery] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: query.trim() || undefined });
  };

  if (error) {
    return (
      <div className="container py-12">
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-6 text-center">
          <div className="mb-2 text-red-300">Unable to load articles</div>
          <p className="text-sm text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="pb-16 pt-1 md:pb-20 md:pt-2 lg:pb-24 lg:pt-3">
      <div className="container">
        <div className="mx-auto mb-8 max-w-3xl md:mb-10">
          <form onSubmit={onSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search blog articles..."
              className="h-11 w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
            <Button type="submit" className="h-11 bg-white text-slate-900 hover:bg-slate-200">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {isLoading && blogs.length === 0 && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-brand-primary" />
          </div>
        )}

        {!isLoading && blogs.length === 0 && (
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 py-12 text-center">
            <h3 className="mb-2 text-xl font-semibold text-white">
              No articles found
            </h3>
            <p className="mx-auto max-w-lg text-sm text-slate-300 md:text-base">
              We are publishing new content soon. Try a different search term or check back shortly.
            </p>
          </div>
        )}

        {blogs.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 text-center">
                <Button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="bg-white px-8 text-slate-900 hover:bg-slate-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
      </div>
    </section>
  );
} 