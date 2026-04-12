"use client";

import { HelpCategory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface HelpCategoryCardProps {
  category: HelpCategory;
  onClick?: (categoryId: string) => void;
}

export function HelpCategoryCard({ category, onClick }: HelpCategoryCardProps) {
  const getCategoryGradient = (categoryId: string) => {
    const gradients: Record<string, string> = {
      'getting-started': 'from-green-500/20 to-emerald-500/20',
      'tours': 'from-blue-500/20 to-cyan-500/20',
      'chatbots': 'from-purple-500/20 to-violet-500/20',
      'analytics': 'from-orange-500/20 to-amber-500/20',
      'billing': 'from-pink-500/20 to-rose-500/20',
      'troubleshooting': 'from-red-500/20 to-orange-500/20'
    };
    return gradients[categoryId] || 'from-brand-blue/20 to-ai-pink/20';
  };

  const getCategoryBorderColor = (categoryId: string) => {
    const colors: Record<string, string> = {
      'getting-started': 'hover:border-green-500',
      'tours': 'hover:border-blue-500',
      'chatbots': 'hover:border-purple-500',
      'analytics': 'hover:border-orange-500',
      'billing': 'hover:border-pink-500',
      'troubleshooting': 'hover:border-red-500'
    };
    return colors[categoryId] || 'hover:border-brand-blue';
  };

  const handleClick = () => {
    if (onClick) {
      onClick(category.id);
    }
  };

  return (
    <div 
      className={`group relative bg-white dark:bg-bg-secondary-dark border border-border-light dark:border-border-dark rounded-2xl p-6 hover:shadow-lg transition-all duration-300 ${getCategoryBorderColor(category.id)} h-52 flex flex-col cursor-pointer`}
      onClick={handleClick}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(category.id)} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Icon and Arrow */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-blue/10 to-ai-pink/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <span className="text-2xl" role="img" aria-label={category.name}>
              {category.icon}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark group-hover:text-brand-blue group-hover:translate-x-1 transition-all duration-200" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 group-hover:text-brand-blue transition-colors duration-200 line-clamp-2">
          {category.name}
        </h3>

        {/* Description */}
        <div className="flex-1 mb-4">
          {category.description && (
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark line-clamp-3">
              {category.description}
            </p>
          )}
        </div>

        {/* Article Count */}
        <div className="flex items-center justify-start mt-auto">
          <Badge variant="secondary" className="text-xs">
            {category.article_count} {category.article_count === 1 ? 'article' : 'articles'}
          </Badge>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-current opacity-20 transition-all duration-300" />
    </div>
  );
} 