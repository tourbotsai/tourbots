"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Home, 
  Video, 
  Bot, 
  Settings, 
  X,
  LogOut,
  User,
  Shield,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useTheme } from "@/components/app/shared/theme-provider";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { useAuth } from "reactfire";
import Image from "next/image";

const navigation = [
  {
    name: "Dashboard",
    href: "/app/dashboard",
    icon: Home,
  },
  {
    name: "Tours", 
    href: "/app/tours",
    icon: Video,
  },
  {
    name: "Chatbot",
    href: "/app/chatbots",
    icon: Bot,
  },
  {
    name: "Help Centre",
    href: "/app/help",
    icon: HelpCircle,
  },
  {
    name: "Settings",
    href: "/app/settings",
    icon: Settings,
  },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { hasAdminAccess } = useAdminAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const auth = useAuth();
  const [viewportHeight, setViewportHeight] = useState(0);
  const brandLogo = "/tourbots/TourBotsWebsiteLogo.png";
  const navBaseClass = "group flex items-center rounded-xl px-3 py-2.5 transition-all duration-200";

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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:hidden",
        isDarkMode ? "border-r border-input bg-background/95" : "border-r border-white/10 bg-[#020b2a]/95",
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
          <div className={cn("flex h-20 items-center justify-between border-b px-4", isDarkMode ? "border-input" : "border-white/10")}>
            <Link href="/" className="flex items-center">
              <div className="rounded-xl py-1">
                <div className="relative h-8 w-[9.5rem] overflow-visible">
                  <div className="pointer-events-none absolute left-0 top-1/2 h-[4.25rem] w-[17rem] -translate-y-1/2">
                    <Image
                      src={brandLogo}
                      alt="TourBots AI"
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
              className={cn(
                "rounded-xl text-slate-300 transition-colors",
                isDarkMode ? "hover:bg-neutral-800 hover:text-slate-100" : "hover:bg-white/5 hover:text-white"
              )}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname?.startsWith(item.href) || false;
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
                    navBaseClass,
                    isActive
                      ? (isDarkMode
                          ? "bg-neutral-800 text-slate-100"
                          : "bg-white/10 text-white")
                      : (isDarkMode
                          ? "text-slate-300 hover:bg-neutral-800 hover:text-slate-100"
                          : "text-slate-300 hover:bg-white/5 hover:text-white")
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

            {/* Platform Admin Tab - Only show if user has admin access */}
            {hasAdminAccess && (
              <>
                <div className={cn("mx-1 my-4 border-t", isDarkMode ? "border-input" : "border-white/10")}></div>
                <Link
                  href="/admin/dashboard"
                  onClick={() => {
                    // Small delay to allow navigation to start before closing sidebar
                    setTimeout(() => onClose(), 100);
                  }}
                  className={cn(
                    navBaseClass,
                    pathname?.startsWith('/admin')
                      ? (isDarkMode
                          ? "bg-neutral-800 text-slate-100"
                          : "bg-amber-500/12 text-amber-300")
                      : (isDarkMode
                          ? "text-slate-300 hover:bg-neutral-800 hover:text-slate-100"
                          : "text-slate-300 hover:bg-white/5 hover:text-amber-300")
                  )}
                >
                  <Shield className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    pathname?.startsWith('/admin') ? "text-amber-300" : "text-slate-300"
                  )} />
                  <span className="font-medium truncate">Platform Admin</span>
                </Link>
              </>
            )}
          </nav>

          {/* User Profile Section */}
          {user && (
            <div 
              className={cn("border-t p-3", isDarkMode ? "border-input" : "border-white/10")}
              style={{
                // More reasonable bottom spacing now that viewport calculation works
                paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 16px))',
                marginBottom: 'env(safe-area-inset-bottom, 8px)'
              }}
            >
              <div className="space-y-3">
                {/* Logout Button */}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className={cn(
                    "w-full justify-start rounded-xl text-slate-300 transition-colors",
                    isDarkMode ? "hover:bg-neutral-800 hover:text-slate-100" : "hover:bg-red-500/10 hover:text-red-300"
                  )}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>

                {/* Divider */}
                <div className={cn("border-t", isDarkMode ? "border-input" : "border-white/10")}></div>

                {/* User Info */}
                <div className={cn(
                  "flex items-center space-x-3 rounded-xl p-2.5",
                  isDarkMode ? "bg-neutral-900/70" : "bg-white/5"
                )}>
                  <div className="relative">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border",
                      isDarkMode ? "border-input bg-background" : "border-white/10 bg-slate-900/70"
                    )}>
                      <User className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 bg-success-green",
                      isDarkMode ? "border-background" : "border-slate-950"
                    )}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user.role === 'platform_admin' ? 'Platform Admin' : 'Account User'}
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