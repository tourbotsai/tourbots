"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Home, 
  Users,
  CreditCard,
  X,
  LogOut,
  User,
  Target,
  BookOpen,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { useAuth } from "reactfire";
import Image from "next/image";

const adminNavigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
  },
  {
    name: "Accounts",
    href: "/admin/accounts",
    icon: Users,
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    name: "Outbound",
    href: "/admin/outbound",
    icon: Target,
  },
  {
    name: "Help Centre",
    href: "/admin/help",
    icon: HelpCircle,
  },
  {
    name: "Resources",
    href: "/admin/resources",
    icon: BookOpen,
  },
];

interface AdminMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminMobileSidebar({ isOpen, onClose }: AdminMobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAdminAuth();
  const auth = useAuth();
  const [viewportHeight, setViewportHeight] = useState(0);
  const brandLogo = "/tourbots/TourBotsWebsiteLogo.png";

  // Calculate actual viewport height on mount and resize
  useEffect(() => {
    const calculateViewportHeight = () => {
      // Use window.innerHeight which excludes browser UI
      const vh = window.innerHeight;
      setViewportHeight(vh);
      // Also set CSS custom property for use in styles
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
    };

    calculateViewportHeight();
    window.addEventListener('resize', calculateViewportHeight);
    window.addEventListener('orientationchange', calculateViewportHeight);

    return () => {
      window.removeEventListener('resize', calculateViewportHeight);
      window.removeEventListener('orientationchange', calculateViewportHeight);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear any local storage/session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error("Error signing out:", error);
      // Still redirect even if signOut fails
      router.push('/');
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 border-r border-white/10 bg-[#020b2a]/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:hidden",
        "w-72",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      style={{
        height: viewportHeight > 0 ? `${viewportHeight}px` : 'calc(var(--vh, 1vh) * 100)',
        maxHeight: viewportHeight > 0 ? `${viewportHeight}px` : 'calc(var(--vh, 1vh) * 100)'
      }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex h-20 items-center justify-between border-b border-white/10 p-4">
            <Link href="/admin/dashboard" className="flex items-center">
              <div className="rounded-xl py-1">
                <div className="relative h-8 w-[9.5rem] overflow-visible">
                  <div className="pointer-events-none absolute left-0 top-1/2 h-[4.25rem] w-[17rem] -translate-y-1/2">
                    <Image
                      src={brandLogo}
                      alt="TourBots AI Admin"
                      fill
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                </div>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-300 hover:bg-white/5 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    // Small delay to allow navigation to start before closing sidebar
                    setTimeout(() => onClose(), 100);
                  }}
                  className={cn(
                    "group flex items-center rounded-xl border p-3 transition-colors duration-200",
                    isActive
                      ? "border-brand-primary/35 bg-brand-primary/12 text-white"
                      : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-white" : "text-slate-300"
                  )} />
                  <span className="font-medium truncate">{item.name}</span>
                </Link>
              );
            })}

            {/* User Dashboard Link */}
            <div className="my-4 border-t border-white/10"></div>
            <Link
              href="/app/dashboard"
              onClick={() => {
                // Small delay to allow navigation to start before closing sidebar
                setTimeout(() => onClose(), 100);
              }}
              className={cn(
                "group flex items-center rounded-xl border p-3 transition-colors duration-200",
                "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
              )}
            >
              <Home className="mr-3 h-5 w-5 flex-shrink-0 text-slate-300" />
              <span className="font-medium truncate">User Dashboard</span>
            </Link>
          </nav>

          {/* User Profile Section */}
          {user && (
            <div 
              className="border-t border-white/10 p-4"
              style={{
                // More reasonable bottom spacing now that viewport calculation works
                paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 16px))',
                marginBottom: 'env(safe-area-inset-bottom, 8px)'
              }}
            >
              <div className="space-y-3">
                {/* Logout Button - First like desktop */}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-slate-300 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>

                {/* Divider */}
                <div className="border-t border-white/10"></div>

                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-900/70">
                      {user.profile_image_url ? (
                        <img 
                          src={user.profile_image_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-success-green"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      Platform Administrator
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 