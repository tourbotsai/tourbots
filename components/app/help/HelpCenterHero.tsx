"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, HelpCircle, BookOpen, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHelpArticles } from "@/hooks/app/useHelpArticles";

export function HelpCenterHero() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { categories } = useHelpArticles();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/app/help/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const quickLinks = [
    {
      title: "Getting Started",
      description: "New to TourBots? Start here",
      icon: Zap,
      href: "/app/help/category/getting-started",
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "Virtual Tours", 
      description: "Create and manage your tours",
      icon: BookOpen,
      href: "/app/help/category/tours",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "AI Chatbots",
      description: "Set up intelligent chatbots",
      icon: Users,
      href: "/app/help/category/chatbots", 
      color: "text-purple-600 dark:text-purple-400"
    }
  ];

  return (
    <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-brand-blue/5 to-transparent dark:from-brand-blue/10">
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-brand-blue/20 to-ai-pink/20 rounded-2xl">
              <HelpCircle className="w-8 h-8 text-brand-blue" />
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
              How can we help you?
            </h1>
            
            <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark max-w-2xl mx-auto">
              Find answers to your questions and get the most out of TourBots with our comprehensive help centre.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-12">
            <div className="relative max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark" />
                <Input
                  type="text"
                  placeholder="Search for articles, guides, or ask a question..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-24 py-4 text-lg border-2 border-border-light dark:border-border-dark rounded-2xl bg-white dark:bg-bg-secondary-dark focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all duration-200"
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl transition-all duration-200"
                >
                  Search
                </Button>
              </div>
            </div>
          </form>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.title}
                  href={link.href}
                  className="group p-6 bg-white dark:bg-bg-secondary-dark border border-border-light dark:border-border-dark rounded-2xl hover:border-brand-blue dark:hover:border-brand-blue hover:shadow-lg hover:shadow-brand-blue/10 transition-all duration-200"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 mb-4 bg-gradient-to-br from-brand-blue/10 to-ai-pink/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Icon className={`w-6 h-6 ${link.color}`} />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 group-hover:text-brand-blue transition-colors duration-200">
                      {link.title}
                    </h3>
                    
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {link.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-brand-blue/20 to-ai-pink/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-ai-pink/20 to-brand-blue/20 rounded-full blur-3xl opacity-30" />
      </div>
    </section>
  );
} 