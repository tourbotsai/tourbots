"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  MobileHeaderMenu,
  MobileHeaderToggle,
} from "@/components/website/shared/MobileHeaderNav";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileResourcesOpen, setIsMobileResourcesOpen] = useState(false);

  const isActivePage = (path: string) => {
    return pathname === path;
  };

  const isResourcesActive = () => {
    return pathname?.startsWith('/resources') || false;
  };

  const navItems = [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/partners", label: "Partners" },
    { href: "/contact", label: "Contact" },
  ];

  const desktopNavClass = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors duration-150 ease-out ${
      isActive
        ? "text-white"
        : "text-slate-300 hover:text-white"
    }`;

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen((prevOpen) => {
      const nextOpen = !prevOpen;
      if (!nextOpen) {
        setIsMobileResourcesOpen(false);
      }
      return nextOpen;
    });
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileResourcesOpen(false);
  };

  // Ensure mobile menu state resets on route changes (logo tap, nav links, etc.)
  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  const handleLogoNavigation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    closeMobileMenu();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="container relative flex h-16 items-center gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
        {/* Desktop Logo */}
        <div className="hidden items-center lg:flex">
          <Link href="/" onClick={handleLogoNavigation} className="flex items-center space-x-3">
            <div className="relative h-10 w-48 flex-shrink-0 sm:h-11 sm:w-52 md:h-12 md:w-56">
              <Image
                src="/tourbots/TourBotsWebsiteLogo.png"
                alt="TourBots AI"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Mobile Brand - centred group */}
        <Link
          href="/"
          onClick={handleLogoNavigation}
          className="flex items-center rounded-xl px-2 py-1 lg:hidden"
        >
          <div className="relative h-10 w-56 overflow-visible sm:w-60">
            <div className="pointer-events-none absolute left-0 top-1/2 h-20 w-72 -translate-y-1/2 sm:w-80">
              <Image
                src="/tourbots/TourBotsWebsiteLogo.png"
                alt="TourBots AI"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center justify-center space-x-1 lg:flex lg:justify-self-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={desktopNavClass(isActivePage(item.href))}
            >
              {item.label}
            </Link>
          ))}
          
          {/* Resources Dropdown */}
          <div className="relative group">
            <button
              className={`flex items-center space-x-1 ${desktopNavClass(isResourcesActive())}`}
            >
              <span>Resources</span>
              <ChevronDown className="h-4 w-4 opacity-85 transition-opacity duration-150 group-hover:opacity-100" />
            </button>
            
            {/* Dropdown Menu */}
            <div className="invisible absolute left-0 top-full z-50 mt-2 w-48 rounded-xl border border-white/15 bg-slate-900/95 opacity-0 shadow-xl shadow-black/20 transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="py-2">
                <Link
                  href="/resources/blogs"
                  className="block rounded-lg px-4 py-2 text-sm text-slate-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
                >
                  Blogs
                </Link>
                <Link
                  href="/resources/guides"
                  className="block rounded-lg px-4 py-2 text-sm text-slate-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
                >
                  Guides
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="ml-auto hidden items-center space-x-3 md:flex lg:ml-0 lg:justify-self-end">
          <Link href="/login">
            <Button 
              variant="outline" 
              size="sm"
              className="border-white/25 bg-transparent text-white transition-colors duration-200 hover:bg-white/10 hover:text-white"
            >
              Account
            </Button>
          </Link>
          <Link href="/demo">
            <Button 
              size="sm" 
              className="bg-white text-slate-900 transition-colors duration-200 hover:bg-slate-200"
            >
              Book a Demo
            </Button>
          </Link>
        </div>

        <MobileHeaderToggle
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={handleToggleMobileMenu}
        />
      </div>

      <MobileHeaderMenu
        navItems={navItems}
        isActivePage={isActivePage}
        isResourcesActive={isResourcesActive}
        isMobileMenuOpen={isMobileMenuOpen}
        isMobileResourcesOpen={isMobileResourcesOpen}
        onToggleResources={() =>
          setIsMobileResourcesOpen((prevOpen) => !prevOpen)
        }
        onCloseMobileMenu={closeMobileMenu}
      />
    </header>
  );
}