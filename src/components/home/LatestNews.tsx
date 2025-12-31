import { getArticles } from '@/services/sanity/articles.sanity';
import { BlogPostsService } from '@/services/sanity/blog-posts.sanity';
import { BlogCard } from './BlogCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Common interface for both article and blog post
interface CommonContentItem {
  _id: string;
  title: string;
  excerpt: string;
  type: 'article' | 'blog-post';
  dateCreated?: string;
  publishedAt?: string;
  category?: string;
  tags?: string[];
  link?: string;
  slug?: {
    _type: 'slug';
    current: string;
  };
  mainImage?: {
    asset: {
      url: string;
    };
  };
}

export async function LatestNews() {
  let articles: any[] = [];
  let blogPosts: any[] = [];

  try {
    articles = await getArticles();
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    articles = [];
  }

  try {
    blogPosts = await BlogPostsService.getRecentPosts(3); // Fetch only 3 posts
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    blogPosts = [];
  }

  const allContent: CommonContentItem[] = [
    ...articles.map(article => ({
      _id: article._id,
      title: article.title,
      excerpt: article.description,
      type: 'article' as const,
      dateCreated: article.dateCreated,
      link: article.link,
      mainImage: article.mainImage,
    })),
    ...blogPosts.map(post => ({
      _id: post._id || `blog-${post.slug?.current}`,
      title: post.title,
      excerpt: post.excerpt,
      type: 'blog-post' as const,
      publishedAt: post.publishedAt,
      category: post.category,
      tags: post.tags,
      slug: post.slug,
      mainImage: post.mainImage,
    })),
  ].sort((a, b) => {
    const getDate = (item: CommonContentItem): string => {
      if (item.type === 'article') {
        return item.dateCreated || '';
      }
      return item.publishedAt || '';
    };

    const dateA = new Date(getDate(a) || 0).getTime();
    const dateB = new Date(getDate(b) || 0).getTime();
    return dateB - dateA;
  });

  const latestContent = allContent.slice(0, 3); // Display only 3 items

  if (latestContent.length === 0) {
    return (
      <section className="py-20 sm:py-28 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Latest News & Articles</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay informed with our latest insights and updates from the real estate world.
          </p>
          <p className="mt-8 text-muted-foreground">Content will be available soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Latest News & Articles</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay informed with our latest insights and updates from the real estate world.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestContent.map((item) => (
            <BlogCard key={item._id} post={item} />
          ))}
        </div>
        <div className="text-center mt-16">
          <Button asChild size="lg" variant="outline">
            <Link href="/blog">View All Articles</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
