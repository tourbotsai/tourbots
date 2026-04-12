"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpArticle } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { useHelpArticle } from "@/hooks/app/useHelpArticle";
import { 
  ArrowLeft, 
  Clock, 
  Eye, 
  Share2,
  BookOpen
} from "lucide-react";

interface HelpArticlePostProps {
  article: HelpArticle;
}

export function HelpArticlePost({ article: initialArticle }: HelpArticlePostProps) {
  const router = useRouter();
  const { article } = useHelpArticle(initialArticle.slug);
  
  // Use the hook's article if available, otherwise use initial
  const currentArticle = article || initialArticle;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentArticle.title,
          text: currentArticle.excerpt || '',
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <article className="min-h-screen">
      {/* Header Image */}
      {currentArticle.header_image && (
        <div className="relative w-full h-80 lg:h-96 bg-gradient-to-br from-brand-blue/10 to-ai-pink/10">
          <Image
            src={currentArticle.header_image}
            alt={currentArticle.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Back Button */}
          <div className="absolute top-6 left-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="bg-white/90 backdrop-blur-sm border-white/20 hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className="container max-w-4xl mx-auto py-12 lg:py-16">
        {/* Back Button (if no header image) */}
        {!currentArticle.header_image && (
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
        )}

        {/* Article Header */}
        <header className="mb-12">
          {/* Category */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="outline" className="text-sm">
              {getCategoryIcon(currentArticle.category)} {currentArticle.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6 leading-tight">
            {currentArticle.title}
          </h1>

          {/* Excerpt */}
          {currentArticle.excerpt && (
            <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark mb-8 leading-relaxed">
              {currentArticle.excerpt}
            </p>
          )}

          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-text-tertiary-light dark:text-text-tertiary-dark">
            {currentArticle.reading_time_minutes && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{currentArticle.reading_time_minutes} min read</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>{currentArticle.view_count} views</span>
            </div>

            {currentArticle.published_at && (
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Published {formatDate(currentArticle.published_at)}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {currentArticle.tags && currentArticle.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {currentArticle.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-sm border border-slate-200 bg-slate-100 text-slate-700 dark:border-input dark:bg-background dark:text-slate-300"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>

        {/* Article Content */}
        <div className="mb-12">
          <MarkdownRenderer 
            content={currentArticle.content}
            className="prose-headings:scroll-mt-16"
          />
        </div>

        {/* Additional Images */}
        {currentArticle.additional_images && currentArticle.additional_images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {currentArticle.additional_images.map((image, index) => (
              <div key={index} className="relative w-full h-64 rounded-xl overflow-hidden">
                <Image
                  src={image}
                  alt={`${currentArticle.title} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        )}

        {/* Share Section */}
        <div className="border-t border-border-light dark:border-border-dark pt-12">
          <div className="bg-gradient-to-br from-brand-blue/5 to-ai-pink/5 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-8 text-center dark:border dark:border-input">
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
              Found this helpful?
            </h3>
            
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
              Share this article with others who might find it useful.
            </p>

            <Button
              onClick={handleShare}
              className="bg-brand-blue hover:bg-brand-blue/90 text-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Article
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t border-border-light dark:border-border-dark pt-12 mt-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href={`/app/help/category/${currentArticle.category}`}
              className="text-brand-blue hover:text-brand-blue/80 transition-colors duration-200 dark:text-slate-300 dark:hover:text-slate-100"
            >
              ← More {currentArticle.category.replace('-', ' ')} articles
            </Link>
            
            <Link
              href="/app/help"
              className="text-brand-blue hover:text-brand-blue/80 transition-colors duration-200 dark:text-slate-300 dark:hover:text-slate-100"
            >
              Back to Help Centre →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
} 