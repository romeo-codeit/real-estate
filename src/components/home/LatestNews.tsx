import { getArticles } from '@/services/sanity/articles.sanity';
import { BlogCard } from './BlogCard';

export async function LatestNews() {
  const blogPosts = await getArticles();

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
          {blogPosts.map((post) => (
            <BlogCard key={post._id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
