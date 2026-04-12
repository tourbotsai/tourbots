"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/shared/admin-sidebar";
import { AdminMobileSidebar } from "@/components/admin/shared/admin-mobile-sidebar";
import { ThemeProvider } from "@/components/app/shared/theme-provider";
import { PageErrorBoundary, SectionErrorBoundary } from "@/components/ui/error-boundary";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { hasAdminAccess, loading, authUser } = useAdminAuth();
  const router = useRouter();

  // Attach Firebase auth token automatically to all admin API calls.
  useEffect(() => {
    if (!authUser || typeof window === "undefined") return;

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const requestPathname = requestUrl.includes("://")
        ? new URL(requestUrl, window.location.origin).pathname
        : requestUrl;

      const isAdminApiRequest =
        requestPathname.startsWith("/api/admin/") ||
        requestPathname === "/api/health";

      if (!isAdminApiRequest) {
        return originalFetch(input, init);
      }

      const token = await authUser.getIdToken();
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      if (input instanceof Request) {
        return originalFetch(
          new Request(input, {
            ...init,
            headers,
          })
        );
      }

      return originalFetch(input, {
        ...init,
        headers,
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [authUser]);

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && !hasAdminAccess) {
      router.push('/app/dashboard');
    }
  }, [hasAdminAccess, loading, router]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("admin-sidebar-collapsed");
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapsed state to localStorage
  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("admin-sidebar-collapsed", JSON.stringify(newState));
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary-light dark:bg-bg-secondary-dark">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Don't render if no admin access
  if (!hasAdminAccess) {
    return null;
  }

  return (
    <PageErrorBoundary>
      <ThemeProvider>
        <div className="flex min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
          {/* Dark Theme Background Elements */}
          <div className="hidden dark:block absolute inset-0 bg-black/30"></div>
          
          {/* Subtle Radial Gradients for Dark Theme - TourBots indigo/cyan */}
          <div className="hidden dark:block absolute inset-0 opacity-[0.15]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.15),transparent_70%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.12),transparent_70%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(14,165,233,0.1),transparent_70%)]"></div>
          </div>

          {/* Desktop Sidebar */}
          <div className="sticky top-0 z-20 hidden h-screen overflow-visible lg:block">
            <SectionErrorBoundary>
              <AdminSidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
            </SectionErrorBoundary>
          </div>

          {/* Mobile Sidebar */}
          <SectionErrorBoundary>
            <AdminMobileSidebar 
              isOpen={isMobileOpen} 
              onClose={() => setIsMobileOpen(false)} 
            />
          </SectionErrorBoundary>

          {/* Main Content */}
          <div className="relative z-10 flex min-w-0 flex-1 flex-col lg:pl-2">
            {/* Mobile Header */}
            <SectionErrorBoundary>
              <div className="sticky top-0 z-20 lg:hidden bg-white dark:bg-black/30 dark:backdrop-blur-md border-b border-gray-200 dark:border-slate-700/60 px-4 h-16 flex items-center justify-center">
                <button
                  onClick={() => setIsMobileOpen(true)}
                  className="absolute left-4 p-2 -ml-2 text-gray-700 dark:text-gray-300 hover:text-brand-primary rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors"
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
              <div className="mx-auto w-full px-4 py-6 sm:px-5 lg:px-6 xl:px-8 2xl:px-10">
                <div className="min-h-full">
                  <SectionErrorBoundary>
                    {children}
                  </SectionErrorBoundary>
                </div>
              </div>
            </main>
          </div>
        </div>
      </ThemeProvider>
    </PageErrorBoundary>
  );
} 