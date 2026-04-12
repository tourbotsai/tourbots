"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/app/shared/sidebar";
import { MobileSidebar } from "@/components/app/shared/mobile-sidebar";
import { ThemeProvider } from "@/components/app/shared/theme-provider";
import { PageErrorBoundary, SectionErrorBoundary } from "@/components/ui/error-boundary";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapsed state to localStorage
  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
  };

  return (
    <PageErrorBoundary>
      <ThemeProvider>
        <div className="flex min-h-screen bg-white dark:bg-gradient-to-br dark:from-[#0d1117] dark:via-[#111827] dark:to-[#0d1117] relative">
          {/* Dark Theme Background Elements */}
          <div className="hidden dark:block absolute inset-0 bg-black/35"></div>
          
          {/* Subtle neutral patterning for dark mode depth */}
          <div className="hidden dark:block absolute inset-0 opacity-[0.18]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(148,163,184,0.14),transparent_68%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(71,85,105,0.14),transparent_68%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_85%,rgba(51,65,85,0.12),transparent_72%)]"></div>
          </div>

          {/* Desktop Sidebar */}
          <div className="sticky top-0 z-20 hidden h-screen lg:block">
            <SectionErrorBoundary>
              <Sidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
            </SectionErrorBoundary>
          </div>

          {/* Mobile Sidebar */}
          <SectionErrorBoundary>
            <MobileSidebar 
              isOpen={isMobileOpen} 
              onClose={() => setIsMobileOpen(false)} 
            />
          </SectionErrorBoundary>

          {/* Main Content */}
          <div className="relative z-10 flex min-w-0 flex-1 flex-col lg:pl-2">
            {/* Mobile Header */}
            <SectionErrorBoundary>
              <div className="sticky top-0 z-20 lg:hidden bg-white dark:bg-black/30 dark:backdrop-blur-md border-b border-border-light dark:border-neutral-700/60 px-4 h-16 flex items-center justify-center">
                <button
                  onClick={() => setIsMobileOpen(true)}
                  className="absolute left-4 p-2 -ml-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-brand-blue rounded-lg hover:bg-bg-secondary-light dark:hover:bg-neutral-800/60 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="relative h-11 w-56">
                  <Image
                    src="/tourbots/TourBotsWebsiteBlackLogo.png"
                    alt="TourBots AI"
                    fill
                    className="object-contain object-center dark:hidden"
                    priority
                  />
                  <Image
                    src="/tourbots/TourBotsWebsiteLogoWhite.png"
                    alt="TourBots AI"
                    fill
                    className="hidden object-contain object-center dark:block"
                    priority
                  />
                </div>
              </div>
            </SectionErrorBoundary>

            {/* Main Content Area */}
            <main className="flex-1 bg-white dark:bg-transparent">
              {/* Content Container */}
              <div className="mx-auto w-full px-4 py-6 sm:px-5 lg:px-6 xl:px-8 2xl:px-10">
                <SectionErrorBoundary>
                  {children}
                </SectionErrorBoundary>
              </div>
            </main>
          </div>
        </div>
      </ThemeProvider>
    </PageErrorBoundary>
  );
} 