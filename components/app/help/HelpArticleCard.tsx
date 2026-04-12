"use client";

import Link from "next/link";
import Image from "next/image";
import { HelpArticle } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye } from "lucide-react";

interface HelpArticleCardProps {
  article: HelpArticle;
}

export function HelpArticleCard({ article }: HelpArticleCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'getting-started': '🚀',
      'tours': '🏃‍♂️',
      'chatbots': '🤖',
      'analytics': '📊',
      'billing': '💳',
      'troubleshooting': '🔧'
    };
    return icons[category] || '📝';
  };

  return (
    <Link href={`/app/help/article/${article.slug}`}>
      <article className="group relative bg-white border border-border-light rounded-2xl overflow-hidden hover:border-brand-blue hover:shadow-lg hover:shadow-brand-blue/10 transition-all duration-300 dark:border-input dark:bg-background dark:hover:border-slate-600 dark:hover:shadow-none">
        {/* Cover Image */}
        {article.cover_image && (
          <div className="relative w-full h-48 bg-gradient-to-br from-brand-blue/10 to-ai-pink/10">
            <Image
              src={article.cover_image}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Category */}
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="text-xs">
              {getCategoryIcon(article.category)} {article.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 group-hover:text-brand-blue transition-colors duration-200 line-clamp-2">
            {article.title}
          </h3>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4 line-clamp-3">
              {article.excerpt}
            </p>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {article.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs border border-slate-200 bg-slate-100 text-slate-700 dark:border-input dark:bg-background dark:text-slate-300"
                >
                  {tag}
                </Badge>
              ))}
              {article.tags.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs border border-slate-200 bg-slate-100 text-slate-700 dark:border-input dark:bg-background dark:text-slate-300"
                >
                  +{article.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border-light dark:border-input">
            <div className="flex items-center space-x-4 text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
              {article.reading_time_minutes && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{article.reading_time_minutes} min read</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{article.view_count}</span>
              </div>
            </div>

            {article.published_at && (
              <span className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                {formatDate(article.published_at)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
} 