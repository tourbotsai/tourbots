import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import "@/app/globals.css";
import { cn } from "@/lib/utils";
import { MyFirebaseProvider } from "@/components/firebase-providers";
import { Toaster } from "@/components/ui/toaster";
import { getSiteMetadataBase, getSiteUrl } from "@/lib/site-url";
import { ReactNode } from "react";

const inter = Manrope({ subsets: ["latin"], variable: "--font-inter" });

export function generateMetadata(): Metadata {
  return {
    title: "TourBots.AI | AI Chatbots for VR Tours - White-Label Platform",
    description:
      "White-label AI chatbot platform for VR tour companies. Transform your £10/month hosting into £50/month with intelligent AI assistants that answer questions and navigate tours.",
    keywords: [
      "VR tour chatbots",
      "AI chatbots for tours", 
      "white-label VR platform",
      "Matterport AI integration",
      "virtual tour AI assistant",
      "tour recording platform",
      "VR tour hosting",
      "AI tour navigation",
      "virtual tour software",
      "B2B VR platform"
    ],
    authors: [{ name: "TourBots AI" }],
    creator: "TourBots AI",
    publisher: "TourBots AI",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_GB",
      url: "https://tourbots.ai",
      title: "TourBots.AI",
      description: "White-label AI chatbot platform for VR tour companies. Transform your £10/month hosting into £50/month with intelligent AI assistants.",
      siteName: "TourBots AI",
      images: [
        {
          url: "/tourbots/TourBotsAIWhite.png",
          width: 1200,
          height: 630,
          alt: "TourBots AI - AI Chatbots for VR Tours",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "TourBots.AI | AI Chatbots for VR Tours", 
      description: "White-label AI chatbot platform for VR tour recording companies. Intelligent AI assistants that navigate tours and run custom triggers.",
      creator: "@tourbotsai",
      images: ["/tourbots/TourBotsAIWhite.png"],
    },
    icons: {
      icon: [
        { url: "/tourbots/screenshots/blueicon.ico", type: "image/x-icon" },
      ],
      apple: [
        { url: "/tourbots/TourBotsAIWhite.png", sizes: "180x180", type: "image/png" },
      ],
      shortcut: "/tourbots/screenshots/blueicon.ico",
    },
    manifest: "/site.webmanifest",
    themeColor: "#020617",
    metadataBase: getSiteMetadataBase(),
    other: {
      google: "notranslate",
    },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const siteUrl = getSiteUrl();
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TourBots AI",
    url: siteUrl,
    logo: `${siteUrl}/tourbots/TourBotsAIWhite.png`,
    description:
      "White-label AI chatbot platform for VR tour companies, helping teams deploy guided tour experiences and grow recurring revenue.",
  };

  return (
    <html lang="en" translate="no" className="notranslate">
      <body className={cn(inter.className, inter.variable)}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-V92BCZ1FJM"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-V92BCZ1FJM');
          `}
        </Script>
        
        <MyFirebaseProvider>
          {children}
          <Toaster />
        </MyFirebaseProvider>
      </body>
    </html>
  );
}
