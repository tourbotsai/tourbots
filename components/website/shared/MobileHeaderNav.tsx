"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X, Menu, ChevronDown } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
};

type MobileHeaderMenuProps = {
  navItems: NavItem[];
  isActivePage: (path: string) => boolean;
  isResourcesActive: () => boolean;
  isMobileMenuOpen: boolean;
  isMobileResourcesOpen: boolean;
  onToggleResources: () => void;
  onCloseMobileMenu: () => void;
};

type MobileHeaderToggleProps = {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
};

export function MobileHeaderToggle({
  isMobileMenuOpen,
  onToggleMobileMenu,
}: MobileHeaderToggleProps) {
  return (
    <div className="ml-auto lg:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleMobileMenu}
        className="h-10 w-10 rounded-xl border border-white/15 bg-white/5 p-0 text-white transition-colors duration-200 hover:bg-white/12 hover:text-white"
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}

export function MobileHeaderMenu({
  navItems,
  isActivePage,
  isResourcesActive,
  isMobileMenuOpen,
  isMobileResourcesOpen,
  onToggleResources,
  onCloseMobileMenu,
}: MobileHeaderMenuProps) {
  if (!isMobileMenuOpen) {
    return null;
  }

  return (
    <div className="border-t border-white/10 bg-slate-950/95 backdrop-blur-xl lg:hidden">
      <div className="container space-y-4 py-4">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobileMenu}
              className={`block rounded-xl px-4 py-3 text-base font-medium transition-colors duration-200 ${
                isActivePage(item.href)
                  ? "border border-brand-primary/35 bg-brand-primary/12 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div>
            <button
              onClick={onToggleResources}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors duration-200 ${
                isResourcesActive()
                  ? "border border-brand-primary/35 bg-brand-primary/12 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>Resources</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isMobileResourcesOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isMobileResourcesOpen && (
              <div className="mt-2 space-y-2 pl-4">
                <Link
                  href="/resources/blogs"
                  onClick={onCloseMobileMenu}
                  className="block rounded-lg px-4 py-2 text-sm text-slate-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
                >
                  Blogs
                </Link>
                <Link
                  href="/resources/guides"
                  onClick={onCloseMobileMenu}
                  className="block rounded-lg px-4 py-2 text-sm text-slate-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
                >
                  Guides
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="flex flex-col space-y-3 border-t border-white/10 pt-4">
          <Link href="/login" onClick={onCloseMobileMenu}>
            <Button
              variant="outline"
              className="w-full border-white/25 bg-transparent text-white transition-colors duration-200 hover:bg-white/10 hover:text-white"
            >
              Account
            </Button>
          </Link>
          <Link href="/demo" onClick={onCloseMobileMenu}>
            <Button className="w-full bg-white font-semibold text-slate-900 transition-colors duration-200 hover:bg-slate-200">
              Book a Demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
