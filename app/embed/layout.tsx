import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/app/shared/theme-provider';

export const metadata: Metadata = {
  title: 'TourBots AI - Chat Widget',
  robots: 'noindex, nofollow',
  other: {
    google: 'notranslate',
  },
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      {/* Ensure iframe html/body have proper height for h-full to work */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .notranslate {
            translate: no;
          }
          html, body {
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
          }
          #__next {
            min-height: 100% !important;
          }
        `
      }} />
      <div className="min-h-full w-full notranslate" translate="no">
        {children}
      </div>
    </ThemeProvider>
  );
} 