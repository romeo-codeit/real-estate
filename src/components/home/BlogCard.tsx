import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { truncateText } from '@/lib/helpers';
import { IArticle } from '@/lib/types';
import { BlogPost } from '@/services/sanity/blog-posts.sanity';
import Image from 'next/image';
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

interface BlogCardProps {
  post: CommonContentItem;
}

export function BlogCard({ post }: BlogCardProps) {
  // Handle different date fields
  const dateField = post.dateCreated || post.publishedAt || '';
  const newDate = new Date(dateField);

  const day = newDate.getDate();
  const month = newDate.toLocaleString('en-US', { month: 'short' });

  // Handle different link fields
  const linkHref = post.type === 'article' ? (post.link || '#') : `/blog/${post.slug?.current || ''}`;

  // Handle different content fields
  const excerpt = post.excerpt;

  // Handle different image fields
  const imageUrl = post.mainImage?.asset?.url || '/images/blog-placeholder.jpg';

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="p-0 relative">
        <Link href={linkHref}>
          <Image
            src={imageUrl}
            alt={post.title}
            width={600}
            height={400}
            unoptimized={process.env.NODE_ENV === 'development'}
            className="w-full h-56 object-cover"
          />
        </Link>
        <div className="absolute top-4 left-4 bg-primary text-primary-foreground p-3 rounded-md text-center leading-none">
          <span className="text-2xl font-bold">{day}</span>
          <span className="text-xs font-semibold block">{month}</span>
        </div>
        {post.category && (
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-white/90 text-black">
              {post.category}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold mb-2 flex-grow">
          <Link
            href={linkHref}
            className="hover:text-primary transition-colors"
          >
            {post.title}
          </Link>
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          {truncateText(excerpt, 180)}
        </p>
        <Button asChild variant="link" className="p-0 h-auto justify-start">
          <Link href={linkHref} target={post.type === 'article' ? '_blank' : undefined}>
            Read More
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
