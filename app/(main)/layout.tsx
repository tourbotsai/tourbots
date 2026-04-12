import { Header } from "@/components/website/shared/Header";
import { Footer } from "@/components/website/shared/Footer";
import { TourFullscreenProvider } from "@/lib/contexts/TourFullscreenContext";
import { PageErrorBoundary, SectionErrorBoundary } from "@/components/ui/error-boundary";
import { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  const isComingSoonEnabled = process.env.COMING_SOON?.toLowerCase() === "true";

  return (
    <PageErrorBoundary>
      <TourFullscreenProvider>
        <div className="relative flex min-h-screen flex-col bg-slate-950">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.08),transparent_50%)]" />
          
          {/* Content */}
          <div className="relative z-10 flex min-h-screen flex-col">
            {!isComingSoonEnabled && (
              <SectionErrorBoundary>
                <Header />
              </SectionErrorBoundary>
            )}
            <main className="flex-1">
              <SectionErrorBoundary>
                {children}
              </SectionErrorBoundary>
            </main>
            {!isComingSoonEnabled && (
              <SectionErrorBoundary>
                <Footer />
              </SectionErrorBoundary>
            )}
          </div>
        </div>
      </TourFullscreenProvider>
    </PageErrorBoundary>
  );
}
