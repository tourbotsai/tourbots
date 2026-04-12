import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Tag, ArrowLeft, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Guide } from "@/lib/types";
import { ResourceViewTracker } from "@/components/website/resources/shared/ResourceViewTracker";

interface GuidePostProps {
  guide: Guide;
}

export function GuidePost({ guide }: GuidePostProps) {
  const formattedDate = guide.published_at 
    ? new Date(guide.published_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long', 
        year: 'numeric'
      })
    : new Date(guide.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

  return (
    <article className="min-h-screen">
      <ResourceViewTracker resourceId={guide.id} resourceType="guides" />
      <div className="container py-12 lg:py-16">
        <div className="mb-8">
          <Link href="/resources/guides">
            <Button 
              variant="ghost" 
              className="text-slate-300 hover:bg-slate-800/80 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to all guides
            </Button>
          </Link>
        </div>

        <header className="mx-auto mb-8 max-w-5xl rounded-2xl border border-slate-700/70 bg-slate-900/45 p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-brand-primary/25 bg-brand-primary/12 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-100">
              <FileText className="mr-1.5 h-3 w-3" />
              Guide
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-800/55 px-3 py-1.5 text-xs font-medium text-slate-200">
              {guide.difficulty_level || "General"} level
            </span>
          </div>

          {guide.tags && guide.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {guide.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-800/55 px-3 py-1.5 text-sm font-medium text-slate-300"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="mb-4 text-3xl font-bold leading-tight text-white md:text-4xl">
            {guide.title}
          </h1>

          {guide.excerpt && (
            <p className="mb-6 text-lg leading-relaxed text-slate-300 md:text-xl">
              {guide.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 border-t border-slate-700/70 pt-4 text-sm text-slate-400">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {formattedDate}
            </div>
            {guide.reading_time_minutes && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {guide.reading_time_minutes} min read
              </div>
            )}
            {guide.view_count > 0 && (
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                {guide.view_count} views
              </div>
            )}
          </div>
        </header>

        {guide.header_image && (
          <div className="mx-auto mb-8 max-w-5xl overflow-hidden rounded-2xl border border-slate-700/70">
            <div className="relative h-52 w-full md:h-72">
              <Image
                src={guide.header_image}
                alt={guide.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        <div className="mb-12 mx-auto max-w-5xl rounded-2xl border border-slate-700/70 bg-slate-900/50 p-6 shadow-[0_18px_44px_rgba(2,6,23,0.28)] md:p-10">
          <div className="max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className="mt-10 border-t border-slate-700/70 pt-8 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-8 text-xl font-semibold text-slate-100 md:text-2xl">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mt-4 text-base leading-8 text-slate-100 md:text-lg">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-100 marker:text-slate-300">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-100 marker:font-semibold marker:text-slate-300">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="pl-1 leading-8">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                blockquote: ({ children }) => (
                  <blockquote className="mt-6 border-l-4 border-brand-primary/80 bg-slate-800/40 px-5 py-4 italic text-slate-100">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="font-medium text-sky-300 underline underline-offset-4 transition-colors hover:text-sky-200"
                    target={href?.startsWith("http") ? "_blank" : undefined}
                    rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    {children}
                  </a>
                ),
                hr: () => <hr className="my-10 border-slate-700/80" />,
                code: ({ children }) => (
                  <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sm text-sky-200">{children}</code>
                ),
              }}
            >
              {guide.content}
            </ReactMarkdown>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-5xl rounded-2xl border border-slate-700/70 bg-slate-900/50 p-8 text-center shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
          <h3 className="mb-4 text-2xl font-semibold text-white">
            Need help applying this in your rollout?
          </h3>
          <p className="mb-6 text-slate-300">
            Book a walkthrough and we will map this guide into your current setup.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button className="bg-white px-8 py-3 font-semibold text-slate-900 hover:bg-slate-200">
                Book a Demo
              </Button>
            </Link>
            <Link href="/resources/guides">
              <Button 
                variant="outline" 
                className="border-slate-600 bg-transparent px-8 py-3 font-medium text-slate-100 hover:bg-slate-800"
              >
                More Guides
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
} 