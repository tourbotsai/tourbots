import { Metadata } from 'next';
import { AppTitle } from '@/components/shared/app-title';
import { HelpCenterTabs } from '@/components/app/help/help-center-tabs';

export const metadata: Metadata = {
  title: 'Help Centre - TourBots AI',
  description: 'Use the platform documentation hub to access practical guides, and contact support when needed.',
  keywords: ['help centre', 'support', 'documentation hub', 'guides', 'tour setup', 'chatbot', 'virtual tours'],
  openGraph: {
    title: 'Help Centre - TourBots AI',
    description: 'Find answers to your questions and get the most out of TourBots AI.',
    type: 'website',
  },
};

export default function HelpCenterPage() {
  return (
    <div className="w-full space-y-8 dark:rounded-2xl dark:border dark:border-slate-800/70 dark:bg-[#12161f]/88 dark:p-4 dark:[--background:220_18%_8%] dark:[--card:220_15%_11%] dark:[--popover:220_15%_11%] dark:[--muted:220_10%_18%] dark:[--muted-foreground:220_8%_70%] dark:[--border:220_9%_24%] dark:[--input:220_9%_24%] dark:[--ring:220_10%_70%]">
      <AppTitle 
        title="Help Centre" 
        description="Read platform guides or contact support directly from your workspace."
      />
      <HelpCenterTabs />
    </div>
  );
} 