import { GuidePost } from "@/components/website/resources/guides/GuidePost";
import { getPublicGuideBySlug } from "@/lib/services/public-guide-service";
import { getSiteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface GuidePageProps {
  params: {
    slug: string;
  };
}

function withBrandSuffix(value: string) {
  const trimmed = value.trim();
  return /tourbots/i.test(trimmed)
    ? trimmed
    : `${trimmed} | TourBots AI`;
}

function resolveGuideImage(guide: NonNullable<Awaited<ReturnType<typeof getPublicGuideBySlug>>>) {
  return guide.header_image || guide.cover_image || "/tourbots/TourBotsAIWhite.png";
}

function toAbsoluteUrl(value: string, siteUrl: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

export default async function GuidePage({ params }: GuidePageProps) {
  const guide = await getPublicGuideBySlug(params.slug);

  if (!guide) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/resources/guides/${params.slug}`;
  const resolvedDescription =
    guide.meta_description || guide.excerpt || "Step-by-step implementation guide for AI virtual tours";
  const resolvedImage = toAbsoluteUrl(resolveGuideImage(guide), siteUrl);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: resolvedDescription,
    image: [resolvedImage],
    datePublished: guide.published_at || guide.created_at,
    dateModified: guide.updated_at || guide.published_at || guide.created_at,
    mainEntityOfPage: pageUrl,
    author: {
      "@type": "Organization",
      name: "TourBots AI",
    },
    publisher: {
      "@type": "Organization",
      name: "TourBots AI",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/tourbots/TourBotsAIWhite.png`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <GuidePost guide={guide} />
    </>
  );
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  let guide = null;
  try {
    guide = await getPublicGuideBySlug(params.slug);
  } catch (error) {
    console.error("Failed to load guide metadata:", error);
  }

  if (!guide) {
    return {
      title: "Guide | TourBots AI",
      description: "Step-by-step implementation guide for AI virtual tours",
      alternates: {
        canonical: `/resources/guides/${params.slug}`,
      },
      openGraph: {
        title: "Guide | TourBots AI",
        description: "Step-by-step implementation guide for AI virtual tours",
        url: `/resources/guides/${params.slug}`,
        type: "article",
        images: [
          {
            url: "/tourbots/TourBotsAIWhite.png",
            width: 1200,
            height: 630,
            alt: "TourBots AI",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Guide | TourBots AI",
        description: "Step-by-step implementation guide for AI virtual tours",
        images: ["/tourbots/TourBotsAIWhite.png"],
      },
    };
  }

  const resolvedTitle = withBrandSuffix(guide.meta_title || guide.title);
  const resolvedDescription =
    guide.meta_description || guide.excerpt || "Step-by-step implementation guide for AI virtual tours";
  const resolvedImage = resolveGuideImage(guide);

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: `/resources/guides/${params.slug}`,
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: `/resources/guides/${params.slug}`,
      type: 'article',
      images: [
        {
          url: resolvedImage,
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [resolvedImage],
    },
  };
} 