import { BlogPostsService } from '@/services/sanity/blog-posts.sanity';
import { BlogCard } from '@/components/home/BlogCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function BlogPage() {
  let blogPosts: any[] = [];

  try {
    blogPosts = await BlogPostsService.getRecentPosts(50); // Get more posts for the blog page
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    blogPosts = [];
  }

  // Group posts by category
  const postsByCategory = blogPosts.reduce((acc, post) => {
    if (!acc[post.category]) {
      acc[post.category] = [];
    }
    acc[post.category].push(post);
    return acc;
  }, {} as Record<string, typeof blogPosts>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Stay updated with the latest news and insights about crypto, investments, and real estate.
          All content is automatically generated using AI for fresh, relevant information.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {Object.keys(postsByCategory).map((category) => (
          <Badge key={category} variant="secondary" className="px-3 py-1">
            {category} ({postsByCategory[category].length})
          </Badge>
        ))}
      </div>

      {/* Featured Post */}
      {blogPosts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Latest Post</h2>
          <Card className="overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img
                  src="/images/blog-placeholder.jpg"
                  alt={blogPosts[0].title}
                  className="w-full h-64 md:h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder.svg';
                  }}
                />
              </div>
              <div className="md:w-1/2 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{blogPosts[0].category}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(blogPosts[0].publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-3">{blogPosts[0].title}</h3>
                <p className="text-muted-foreground mb-4">{blogPosts[0].excerpt}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {blogPosts[0].tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button asChild>
                  <Link href={`/blog/${blogPosts[0].slug}`}>Read More</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* All Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.slice(1).map((post) => (
            <BlogCard key={post._id} post={{
              _id: post._id || '',
              title: post.title,
              excerpt: post.excerpt,
              type: 'blog-post',
              publishedAt: post.publishedAt,
              category: post.category,
              tags: post.tags,
              slug: post.slug
            }} />
          ))}
        </div>      {blogPosts.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No blog posts yet</h3>
          <p className="text-muted-foreground">
            Blog posts will appear here once generated. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}