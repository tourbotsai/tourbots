"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Home, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  CreditCard,
  Users,
  BookOpen,
  HelpCircle,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { useAuth } from "reactfire";

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

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function AdminSidebar({ isCollapsed = false, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAdminAuth();
  const auth = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      router.push('/');
    } catch (error) {
      console.error("Error signing out:", error);
      router.push('/');
    }
  };

  const brandLogo = "/tourbots/TourBotsWebsiteLogo.png";

  return (
    <div className={cn(
      "relative flex h-screen flex-col overflow-visible border-r border-white/10 bg-[#020b2a]/95 backdrop-blur-xl transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-72"
    )}>
      {/* Header Section */}
      <div className="flex h-20 items-center border-b border-white/10 p-4">
        <div className={cn("w-full flex", isCollapsed ? "justify-center" : "justify-start")}>
          <Link href="/admin/dashboard" className={cn("group", isCollapsed ? "" : "w-full")}>
            {!isCollapsed ? (
              <div className="rounded-xl py-1">
                <div className="relative h-[58px] w-[220px]">
                  <Image
                    src={brandLogo}
                    alt="TourBots AI Admin"
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
              </div>
            ) : (
              <div className="relative h-11 w-11 overflow-hidden rounded-xl">
                <Image
                  src="/tourbots/tourbots_icon_hd.png"
                  alt="TourBots AI Admin"
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
        className="absolute -right-4 top-10 z-10 h-8 w-8 -translate-y-1/2 rounded-full border border-white/20 bg-[#020b2a]/95 text-slate-200 backdrop-blur-xl hover:bg-[#04143a]"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {adminNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-xl border transition-colors duration-200",
                isCollapsed ? "p-3 justify-center" : "p-3",
                isActive
                  ? "border-brand-primary/35 bg-brand-primary/12 text-white"
                  : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3",
                isActive ? "text-white" : "text-slate-300"
              )} />
              
              {!isCollapsed && (
                <span className="font-medium truncate">{item.name}</span>
              )}
            </Link>
          );
        })}

        {/* User Dashboard - Special Section */}
        <div className="my-4 border-t border-white/10"></div>
        <Link
          href="/app/dashboard"
          className={cn(
            "group flex items-center rounded-xl border transition-colors duration-200",
            isCollapsed ? "p-3 justify-center" : "p-3",
            "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
          )}
        >
          <Home className={cn(
            "h-5 w-5 flex-shrink-0",
            isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3",
            "text-slate-300"
          )} />
          
          {!isCollapsed && (
            <span className="font-medium truncate">User Dashboard</span>
          )}
        </Link>
      </nav>

      {/* User Profile Section */}
      {user && (
        <div className="p-4 border-t border-white/10">
          {!isCollapsed ? (
            <div className="space-y-3">
              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-slate-300 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>

              {/* Divider */}
              <div className="border-t border-white/10"></div>

              {/* Profile Info */}
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
          ) : (
            <div className="space-y-3">
              {/* Collapsed Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-center p-2 text-slate-300 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
              </Button>

              {/* Divider */}
              <div className="border-t border-white/10"></div>

              {/* Collapsed Profile */}
              <div className="flex justify-center">
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
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 