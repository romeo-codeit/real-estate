import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { truncateText } from '@/lib/helpers';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

interface CommonContentItem {
  _id: string;
  title: string;
  excerpt: string;
  type: 'article' | 'blog-post';
  dateCreated?: string;
  publishedAt?: string;
  category?: string;
  link?: string;
  slug?: { current: string };
  mainImage?: { asset: { url: string } };
}

interface BlogCardProps {
  post: CommonContentItem;
}

export function BlogCard({ post }: BlogCardProps) {
  const dateField = post.dateCreated || post.publishedAt;
  const displayDate = dateField ? format(new Date(dateField), 'MMMM d, yyyy') : 'Date not available';
  const linkHref = post.type === 'article' ? (post.link || '#') : `/blog/${post.slug?.current || ''}`;
  const imageUrl = post.mainImage?.asset?.url || '/images/blog-placeholder.jpg';

  return (
    <Card className="group overflow-hidden bg-card border border-border/50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      <CardHeader className="p-0">
        <Link href={linkHref} target={post.type === 'article' ? '_blank' : undefined}>
          <div className="relative overflow-hidden h-56">
            <Image
              src={imageUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <div className="mb-4">
          {post.category && (
            <Badge variant="secondary" className="mr-2">{post.category}</Badge>
          )}
          <span className="text-sm text-muted-foreground">{displayDate}</span>
        </div>
        <h3 className="text-xl font-semibold mb-3 leading-snug">
          <Link href={linkHref} target={post.type === 'article' ? '_blank' : undefined} className="hover:text-primary transition-colors">
            {truncateText(post.title, 60)}
          </Link>
        </h3>
        <p className="text-muted-foreground text-base">
          {truncateText(post.excerpt, 100)}
        </p>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild variant="link" className="p-0 h-auto text-primary">
          <Link href={linkHref} target={post.type === 'article' ? '_blank' : undefined}>
            Read More <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
