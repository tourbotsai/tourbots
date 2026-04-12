import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HelpCategoryPage } from '@/components/app/help/HelpCategoryPage';
import { getHelpCategories } from '@/lib/services/help-service';

interface HelpCategoryPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: HelpCategoryPageProps): Promise<Metadata> {
  try {
    const categories = await getHelpCategories();
    const category = categories.find(cat => cat.slug === params.slug);
    
    if (!category) {
      return {
        title: 'Category not found - TourBots AI Help Centre',
        description: 'The help category you are looking for could not be found.',
      };
    }

    return {
      title: `${category.name} - TourBots AI Help Centre`,
      description: category.description || `Find help articles about ${category.name.toLowerCase()} in our comprehensive help centre.`,
      openGraph: {
        title: `${category.name} Help Articles - TourBots AI`,
        description: category.description || `Find help articles about ${category.name.toLowerCase()}.`,
        type: 'website',
      },
    };
  } catch (error) {
    return {
      title: 'Error - TourBots AI Help Centre',
      description: 'An error occurred while loading the help category.',
    };
  }
}

export default async function CategoryPage({ params }: HelpCategoryPageProps) {
  try {
    const categories = await getHelpCategories();
    const category = categories.find(cat => cat.slug === params.slug);
    
    if (!category) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-bg-primary-light dark:bg-bg-primary-dark">
        <HelpCategoryPage category={category} />
      </div>
    );
  } catch (error) {
    console.error('Error loading help category:', error);
    notFound();
  }
} 