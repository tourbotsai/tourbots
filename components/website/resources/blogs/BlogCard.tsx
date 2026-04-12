import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { Blog } from "@/lib/types";

interface BlogCardProps {
  blog: Blog;
}

export function BlogCard({ blog }: BlogCardProps) {
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
    <article className="h-full overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)] transition-colors duration-200 hover:bg-slate-900/62">
      <Link href={`/resources/blogs/${blog.slug}`} className="flex h-full flex-col">
        <div className="relative h-48 overflow-hidden md:h-56">
          {blog.cover_image ? (
            <Image
              src={blog.cover_image}
              alt={blog.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-800/60">
              <div className="text-sm text-slate-400">No cover image</div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <h3 className="mb-3 line-clamp-2 text-xl font-semibold text-white">
            {blog.title}
          </h3>

          {blog.excerpt && (
            <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-300 md:text-base">
              {blog.excerpt}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-slate-700/70 pt-4 text-xs text-slate-400 md:text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {formattedDate}
              </div>
              {blog.reading_time_minutes && (
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {blog.reading_time_minutes} min read
                </div>
              )}
            </div>
            {blog.view_count > 0 && (
              <div>
                {blog.view_count} views
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
} 