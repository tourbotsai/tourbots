import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import Link from 'next/link';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-lg prose-gray dark:prose-invert max-w-none
      prose-headings:text-text-primary-light dark:prose-headings:text-text-primary-dark
      prose-p:text-text-secondary-light dark:prose-p:text-text-secondary-dark
      prose-strong:text-text-primary-light dark:prose-strong:text-text-primary-dark
      prose-a:text-brand-blue prose-a:no-underline hover:prose-a:underline
      prose-blockquote:border-l-brand-blue prose-blockquote:text-text-secondary-light dark:prose-blockquote:text-text-secondary-dark
      prose-code:text-brand-blue prose-code:bg-brand-blue/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
      prose-pre:bg-bg-secondary-light dark:prose-pre:bg-bg-secondary-dark
      prose-img:rounded-xl prose-img:shadow-lg
      prose-hr:border-border-light dark:prose-hr:border-border-dark
      prose-table:overflow-hidden prose-table:rounded-lg prose-table:border prose-table:border-border-light dark:prose-table:border-border-dark
      prose-thead:bg-bg-secondary-light dark:prose-thead:bg-bg-secondary-dark
      prose-th:text-text-primary-light dark:prose-th:text-text-primary-dark
      prose-td:text-text-secondary-light dark:prose-td:text-text-secondary-dark
      ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom link component for better styling and security
          a: ({ href, children, ...props }) => {
            // Check if it's an external link
            const isExternal = href?.startsWith('http') || href?.startsWith('https');
            const isInternal = href?.startsWith('/') || href?.startsWith('#');
            
            if (isInternal) {
              return (
                <Link href={href || '#'} className="text-brand-blue hover:underline">
                  {children}
                </Link>
              );
            }
            
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-brand-blue hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          // Custom image component with Next.js Image optimization
          img: ({ src, alt, ...props }) => {
            if (!src) return null;
            
            // Check if it's a relative URL (from Supabase storage)
            const isRelative = !src.startsWith('http');
            const imageSrc = isRelative ? src : src;
            
            return (
              <div className="relative w-full h-64 md:h-96 my-8 rounded-xl overflow-hidden">
                <Image
                  src={imageSrc}
                  alt={alt || 'Image'}
                  fill
                  className="object-cover"
                />
              </div>
            );
          },
          // Custom blockquote styling
          blockquote: ({ children, ...props }) => (
            <blockquote 
              className="border-l-4 border-brand-blue bg-brand-blue/5 p-4 my-6 rounded-r-lg"
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Custom code block styling
          pre: ({ children, ...props }) => (
            <pre 
              className="bg-bg-secondary-light dark:bg-bg-secondary-dark p-4 rounded-lg overflow-x-auto my-6 border border-border-light dark:border-border-dark"
              {...props}
            >
              {children}
            </pre>
          ),
          // Custom inline code styling
          code: ({ children, className, ...props }) => {
            // Check if it's a code block (has language class)
            const isCodeBlock = className?.includes('language-');
            
            if (isCodeBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            
            return (
              <code 
                className="text-brand-blue bg-brand-blue/10 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Custom table styling
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-8">
              <table 
                className="min-w-full border border-border-light dark:border-border-dark rounded-lg overflow-hidden"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          // Custom heading with anchor links
          h1: ({ children, ...props }) => (
            <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mt-12 mb-6 first:mt-0" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mt-10 mb-4" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mt-8 mb-3" {...props}>
              {children}
            </h3>
          ),
          // Custom list styling
          ul: ({ children, ...props }) => (
            <ul className="list-disc pl-6 my-4 space-y-2" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal pl-6 my-4 space-y-2" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-text-secondary-light dark:text-text-secondary-dark" {...props}>
              {children}
            </li>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 