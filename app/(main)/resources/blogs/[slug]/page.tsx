import { BlogPost } from "@/components/website/resources/blogs/BlogPost";
import { getPublicBlogBySlug } from "@/lib/services/public-blog-service";
import { getSiteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface BlogPageProps {
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

function resolveBlogImage(blog: NonNullable<Awaited<ReturnType<typeof getPublicBlogBySlug>>>) {
  return blog.header_image || blog.cover_image || "/tourbots/TourBotsAIWhite.png";
}

function toAbsoluteUrl(value: string, siteUrl: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

export default async function BlogPage({ params }: BlogPageProps) {
  const blog = await getPublicBlogBySlug(params.slug);

  if (!blog) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/resources/blogs/${params.slug}`;
  const resolvedDescription =
    blog.meta_description ||
    blog.excerpt ||
    "Read practical insights on AI virtual tours and partner-led growth strategies.";
  const resolvedImage = toAbsoluteUrl(resolveBlogImage(blog), siteUrl);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: resolvedDescription,
    image: [resolvedImage],
    datePublished: blog.published_at || blog.created_at,
    dateModified: blog.updated_at || blog.published_at || blog.created_at,
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
      <BlogPost blog={blog} />
    </>
  );
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  let blog = null;
  try {
    blog = await getPublicBlogBySlug(params.slug);
  } catch (error) {
    console.error("Failed to load blog metadata:", error);
  }

  if (!blog) {
    return {
      title: "Article Not Found | TourBots AI",
      description: "The requested article could not be found.",
      alternates: {
        canonical: `/resources/blogs/${params.slug}`,
      },
      openGraph: {
        title: "Article Not Found | TourBots AI",
        description: "The requested article could not be found.",
        url: `/resources/blogs/${params.slug}`,
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
        title: "Article Not Found | TourBots AI",
        description: "The requested article could not be found.",
        images: ["/tourbots/TourBotsAIWhite.png"],
      },
    };
  }

  const resolvedTitle = withBrandSuffix(blog.meta_title || blog.title);
  const resolvedDescription =
    blog.meta_description ||
    blog.excerpt ||
    "Read practical insights on AI virtual tours and partner-led growth strategies.";
  const resolvedImage = resolveBlogImage(blog);

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: `/resources/blogs/${params.slug}`,
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: `/resources/blogs/${params.slug}`,
      type: "article",
      images: [
        {
          url: resolvedImage,
          width: 1200,
          height: 630,
          alt: blog.title,
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