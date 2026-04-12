"use client";

import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const footerLinkClass =
    "text-sm font-medium text-slate-300 transition-colors duration-200 hover:text-white";
  const footerIconLinkClass =
    "p-1 text-slate-400 transition-colors duration-200 hover:text-white";

  return (
    <footer className="border-t border-border-dark/20 bg-slate-950/95 backdrop-blur-xl">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-3 pb-1 pt-3 md:flex-row md:items-center">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="relative h-11 w-44 transition-transform duration-200 group-hover:scale-105 md:h-12 md:w-48">
                <Image
                  src="/tourbots/TourBotsAIWhite.png"
                  alt="TourBots AI"
                  fill
                  className="origin-left scale-110 object-contain object-left"
                />
              </div>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-start gap-x-6 gap-y-2 text-left md:justify-center md:text-left">
            <Link 
              href="/features" 
              className={footerLinkClass}
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className={footerLinkClass}
            >
              Pricing
            </Link>
            <Link 
              href="/partners" 
              className={footerLinkClass}
            >
              Partners
            </Link>
            <Link 
              href="/contact" 
              className={footerLinkClass}
            >
              Contact
            </Link>
            <Link 
              href="/legal" 
              className={footerLinkClass}
            >
              Legal
            </Link>
          </nav>
        </div>

        <div className="flex flex-col-reverse items-start justify-between gap-1 pb-3 pt-0 md:flex-row md:items-center">
            {/* Copyright */}
            <div className="pl-5 text-xs text-slate-400 md:pl-0">
              © {new Date().getFullYear()} TourBots AI Ltd. All rights reserved.
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center space-x-4">
              <a 
                href="https://www.instagram.com/tourbotsai/" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={footerIconLinkClass}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://www.facebook.com/tourbotsai/" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Facebook"
                className={footerIconLinkClass}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://www.linkedin.com/company/tour-bots-ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className={footerIconLinkClass}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a 
                href="https://x.com/tourbotsai" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="X"
                className={footerIconLinkClass}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 300 301">
                  <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66" />
                </svg>
              </a>
            </div>
        </div>
      </div>
    </footer>
  );
}