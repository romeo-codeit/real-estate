import { getArticles } from '@/services/sanity/articles.sanity';
import { BlogPostsService } from '@/services/sanity/blog-posts.sanity';
import { BlogCard } from './BlogCard';

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
  // Fetch both articles and blog posts with error handling
  let articles: any[] = [];
  let blogPosts: any[] = [];

  try {
    articles = await getArticles();
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    articles = [];
  }

  try {
    blogPosts = await BlogPostsService.getRecentPosts(6); // Get 6 recent posts
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    blogPosts = [];
  }

  // If no content is available, return empty section
  if (articles.length === 0 && blogPosts.length === 0) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-primary font-semibold">Our blogs</h2>
            <p className="text-3xl md:text-4xl font-bold mt-2">
              Latest News & Articles
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Content will be available soon.</p>
          </div>
        </div>
      </section>
    );
  }

  // Combine and sort by date
  const allContent: CommonContentItem[] = [
    ...articles.map(article => ({
      _id: article._id,
      title: article.title,
      excerpt: article.description, // Map description to excerpt
      type: 'article' as const,
      dateCreated: article.dateCreated,
      link: article.link,
      mainImage: article.mainImage
    })),
    ...blogPosts.map(post => ({
      _id: post._id || `blog-${post.slug?.current}`,
      title: post.title,
      excerpt: post.excerpt,
      type: 'blog-post' as const,
      publishedAt: post.publishedAt,
      category: post.category,
      tags: post.tags,
      slug: post.slug
    }))
  ].sort((a, b) => {
    const getDate = (item: CommonContentItem) => {
      if (item.type === 'article') {
        return item.dateCreated || '';
      } else {
        return item.publishedAt || '';
      }
    };
    const dateA = getDate(a);
    const dateB = getDate(b);
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  // Take the 6 most recent items
  const latestContent = allContent.slice(0, 6);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-primary font-semibold">Our blogs</h2>
          <p className="text-3xl md:text-4xl font-bold mt-2">
            Latest News & Articles
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestContent.map((item) => (
            <BlogCard key={item._id} post={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
