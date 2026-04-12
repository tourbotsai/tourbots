import Link from "next/link";
import { ArrowRight, Calendar, Clock, FileText } from "lucide-react";
import { Guide } from "@/lib/types";

interface GuideCardProps {
  guide: Guide;
}

export function GuideCard({ guide }: GuideCardProps) {
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

  const difficulty = guide.difficulty_level || "General";

  return (
    <article className="overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/40 transition-colors duration-200 hover:border-slate-500 hover:bg-slate-900/70">
      <Link href={`/resources/guides/${guide.slug}`} className="flex h-full flex-col p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-600/80 bg-slate-800/80 text-slate-300">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <span className="rounded-full border border-brand-primary/35 bg-brand-primary/12 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-100">
                {difficulty}
              </span>
            </div>
            <h3 className="mb-2 line-clamp-2 text-xl font-semibold text-white">
              {guide.title}
            </h3>
            {guide.excerpt && (
              <p className="line-clamp-2 text-sm leading-relaxed text-slate-300 md:text-base">
                {guide.excerpt}
              </p>
            )}
          </div>
          <ArrowRight className="mt-1 h-5 w-5 flex-shrink-0 text-slate-500" />
        </div>

        {guide.tags && guide.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {guide.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-800/55 px-2.5 py-1 text-xs font-medium text-slate-300"
              >
                {tag}
              </span>
            ))}
            {guide.tags.length > 3 && (
              <span className="text-xs text-slate-400">
                +{guide.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-slate-700/70 pt-4 text-xs text-slate-400 md:text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              {formattedDate}
            </div>
            {guide.reading_time_minutes && (
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                {guide.reading_time_minutes} min read
              </div>
            )}
          </div>
          {guide.view_count > 0 && (
            <div>
              {guide.view_count} views
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}