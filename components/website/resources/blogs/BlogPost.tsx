import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Blog } from "@/lib/types";
import { ResourceViewTracker } from "@/components/website/resources/shared/ResourceViewTracker";

interface BlogPostProps {
  blog: Blog;
}

export function BlogPost({ blog }: BlogPostProps) {
  const formattedDate = blog.published_at 
    ? new Date(blog.published_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long', 
        year: 'numeric'
      })
    : new Date(blog.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

  return (
    <article className="min-h-screen">
      <ResourceViewTracker resourceId={blog.id} resourceType="blogs" />
      {blog.header_image && (
        <div className="relative h-64 w-full overflow-hidden md:h-96 lg:h-[460px]">
          <Image
            src={blog.header_image}
            alt={blog.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        </div>
      )}

      <div className="container pb-16 pt-8 md:pb-20 md:pt-10 lg:pb-24 lg:pt-12">
        <div className="mb-8">
          <Link href="/resources/blogs">
            <Button
              variant="ghost"
              className="text-slate-300 hover:bg-slate-900/70 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to all articles
            </Button>
          </Link>
        </div>

        <header className="mx-auto mb-10 max-w-4xl">
          <h1 className="mb-6 text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="mb-8 text-lg leading-relaxed text-slate-300 md:text-xl">
              {blog.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 border-y border-slate-700/70 py-4 text-sm text-slate-400">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              {formattedDate}
            </div>
            {blog.reading_time_minutes && (
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                {blog.reading_time_minutes} min read
              </div>
            )}
            {blog.view_count > 0 && (
              <div className="flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                {blog.view_count} views
              </div>
            )}
          </div>
        </header>

        <div className="mx-auto mb-12 max-w-4xl rounded-2xl border border-slate-700/70 bg-slate-900/50 p-6 shadow-[0_18px_44px_rgba(2,6,23,0.28)] md:p-10">
          <div className="prose prose-invert prose-slate max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className="mt-10 border-t border-slate-700/70 pt-8 text-2xl font-semibold tracking-tight text-white first:mt-0 first:border-t-0 first:pt-0 md:text-3xl">
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
              }}
            >
              {blog.content}
            </ReactMarkdown>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-slate-700/70 bg-slate-900/50 p-8 text-center shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
          <h3 className="mb-3 text-2xl font-semibold text-white">
            Ready to apply this in your own tour workflow?
          </h3>
          <p className="mb-6 text-slate-300">
            Book a demo and see how TourBots can support your rollout and growth model.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button className="bg-white px-8 py-3 font-semibold text-slate-900 hover:bg-slate-200">
                Book a Demo
              </Button>
            </Link>
            <Link href="/resources/blogs">
              <Button
                variant="outline"
                className="border-white/25 bg-transparent px-8 py-3 text-white hover:bg-white/10 hover:text-white"
              >
                Read More Articles
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
} 