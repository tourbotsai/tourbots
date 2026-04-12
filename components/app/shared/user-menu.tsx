"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  Settings, 
  User, 
  Moon, 
  Sun, 
  ChevronDown,
  Building2,
  CreditCard
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  isCollapsed?: boolean;
}

export function UserMenu({ isCollapsed = false }: UserMenuProps) {
  const { user, authUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  if (isCollapsed) {
    return (
      <div className="space-y-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full p-3 text-text-secondary-light dark:text-text-secondary-dark hover:text-brand-blue"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full p-3 text-text-secondary-light dark:text-text-secondary-dark hover:text-brand-blue"
            >
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/app/settings/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/app/settings")}>
              <Building2 className="mr-2 h-4 w-4" />
              Venue settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/app/settings")}>
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll need to sign in again to access your dashboard.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="bg-error hover:bg-error/90"
                  >
                    {isLoggingOut ? "Logging out..." : "Log out"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Theme Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Theme
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-text-secondary-light dark:text-text-secondary-dark hover:text-brand-blue"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-3 h-auto text-left hover:bg-bg-secondary-light dark:hover:bg-bg-secondary-dark"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-blue/20 to-ai-pink/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-brand-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark truncate">
                  {user.first_name}
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Account settings
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" className="w-64 mb-2">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {user.email}
              </p>
              {user.venue && (
                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                  {user.venue.name}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/app/settings/profile")}>
            <User className="mr-2 h-4 w-4" />
            Profile Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/app/settings")}>
            <Building2 className="mr-2 h-4 w-4" />
            Venue settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/app/settings")}>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing & Subscription
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/app/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            All Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll need to sign in again to access your dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bg-error hover:bg-error/90"
                >
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 