import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HelpArticlePost } from '@/components/app/help/HelpArticlePost';
import { getHelpArticleBySlug } from '@/lib/services/help-service';

interface HelpArticlePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: HelpArticlePageProps): Promise<Metadata> {
  try {
    const article = await getHelpArticleBySlug(params.slug);
    
    if (!article) {
      return {
        title: 'Article not found - TourBots AI Help Centre',
        description: 'The help article you are looking for could not be found.',
      };
    }

    return {
      title: `${article.title} - TourBots AI Help Centre`,
      description: article.meta_description || article.excerpt || `Learn about ${article.title} in our comprehensive help centre.`,
      keywords: article.tags || [],
      openGraph: {
        title: article.meta_title || article.title,
        description: article.meta_description || article.excerpt || '',
        type: 'article',
        images: article.cover_image ? [article.cover_image] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: article.meta_title || article.title,
        description: article.meta_description || article.excerpt || '',
        images: article.cover_image ? [article.cover_image] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Error - TourBots AI Help Centre',
      description: 'An error occurred while loading the help article.',
    };
  }
}

export default async function HelpArticlePage({ params }: HelpArticlePageProps) {
  try {
    const article = await getHelpArticleBySlug(params.slug);
    
    if (!article) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-bg-primary-light dark:bg-bg-primary-dark">
        <HelpArticlePost article={article} />
      </div>
    );
  } catch (error) {
    console.error('Error loading help article:', error);
    notFound();
  }
} 