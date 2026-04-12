"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Home, 
  Video, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Shield,
  Bot,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useTheme } from "@/components/app/shared/theme-provider";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { useAuth } from "reactfire";

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

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { hasAdminAccess } = useAdminAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const auth = useAuth();

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

  const brandLogo = "/tourbots/TourBotsWebsiteLogo.png";
  const navBaseClass = "group flex items-center rounded-xl transition-all duration-200";

  return (
    <div className={cn(
      "relative flex h-screen flex-col overflow-visible backdrop-blur-xl transition-all duration-300 ease-in-out",
      isDarkMode
        ? "border-r border-input bg-background/95"
        : "border-r border-white/10 bg-[#020b2a]/95",
      isCollapsed ? "w-20" : "w-72"
    )}>
      {/* Header Section */}
      <div className={cn("flex h-20 items-center border-b px-4", isDarkMode ? "border-input" : "border-white/10")}>
        <div className={cn("w-full flex", isCollapsed ? "justify-center" : "justify-start")}>
          <Link href="/" className={cn("group", isCollapsed ? "" : "w-full")}>
            {!isCollapsed ? (
              <div className="rounded-xl py-1">
                <div className="relative h-[64px] w-[240px]">
                  <Image
                    src={brandLogo}
                    alt="TourBots AI"
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
              </div>
            ) : (
              <div className={cn(
                "relative h-11 w-11 overflow-hidden rounded-xl ring-1 ring-inset",
                isDarkMode ? "ring-input bg-background/80" : "ring-white/15 bg-[#031137]"
              )}>
                <Image
                  src="/tourbots/tourbots_icon_hd.png"
                  alt="TourBots AI"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            )}
          </Link>
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        className={cn(
          "absolute -right-4 top-10 z-10 h-8 w-8 -translate-y-1/2 rounded-full border backdrop-blur-xl transition-colors",
          isDarkMode
            ? "border-input bg-background text-slate-200 hover:bg-neutral-800"
            : "border-white/20 bg-[#020b2a]/95 text-slate-300 hover:bg-[#04143a] hover:text-white"
        )}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href) || false;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                navBaseClass,
                isCollapsed ? "justify-center px-3 py-3" : "px-3 py-2.5",
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
                "h-5 w-5 flex-shrink-0",
                isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3",
                isActive ? (isDarkMode ? "text-slate-100" : "text-white") : "text-slate-300"
              )} />
              
              {!isCollapsed && (
                <span className="font-medium truncate">{item.name}</span>
              )}
            </Link>
          );
        })}

        {/* Platform Admin Tab - Only show if user has admin access */}
        {hasAdminAccess && (
          <>
            <div className={cn("mx-1 my-4 border-t", isDarkMode ? "border-input" : "border-white/10")}></div>
            <Link
              href="/admin/dashboard"
              className={cn(
                navBaseClass,
                isCollapsed ? "justify-center px-3 py-3" : "px-3 py-2.5",
                pathname?.startsWith('/admin')
                  ? (isDarkMode
                      ? "bg-neutral-800 text-slate-100"
                      : "bg-white/10 text-white")
                  : (isDarkMode
                      ? "text-slate-300 hover:bg-neutral-800 hover:text-slate-100"
                      : "text-slate-300 hover:bg-white/5 hover:text-white")
              )}
            >
              <Shield className={cn(
                "h-5 w-5 flex-shrink-0",
                isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3",
                pathname?.startsWith('/admin') ? (isDarkMode ? "text-slate-100" : "text-white") : "text-slate-300"
              )} />
              
              {!isCollapsed && (
                <span className="font-medium truncate">Platform Admin</span>
              )}
            </Link>
          </>
        )}
      </nav>

      {/* User Profile Section */}
      {user && (
        <div className={cn("border-t p-3", isDarkMode ? "border-input" : "border-white/10")}>
          {!isCollapsed ? (
            <div className="space-y-3">
              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
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

              {/* Profile Info */}
              <div className={cn(
                "flex items-center space-x-3 rounded-xl p-2.5",
                isDarkMode ? "bg-neutral-900/70" : "bg-white/5"
              )}>
                <div className="relative">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border",
                    isDarkMode ? "border-input bg-background" : "border-white/10 bg-slate-900/70"
                  )}>
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
                  <div className={cn(
                    "absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 bg-success-green",
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
          ) : (
            <div className="space-y-3">
              {/* Collapsed Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className={cn(
                  "w-full justify-center rounded-xl p-2 text-slate-300 transition-colors",
                  isDarkMode ? "hover:bg-neutral-800 hover:text-slate-100" : "hover:bg-red-500/10 hover:text-red-300"
                )}
              >
                <LogOut className="w-4 h-4" />
              </Button>

              {/* Divider */}
              <div className={cn("border-t", isDarkMode ? "border-input" : "border-white/10")}></div>

              {/* Collapsed Profile */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border",
                    isDarkMode ? "border-input bg-background" : "border-white/10 bg-slate-900/70"
                  )}>
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
                  <div className={cn(
                    "absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 bg-success-green",
                    isDarkMode ? "border-background" : "border-slate-950"
                  )}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 