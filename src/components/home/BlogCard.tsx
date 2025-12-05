import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { truncateText } from '@/lib/helpers';
import { IArticle } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

interface BlogPost {
  id: number;
  image: string;
  data_ai_hint?: string;
  date: {
    day: string;
    month: string;
  };
  title: string;
  excerpt: string;
  href: string;
}

interface BlogCardProps {
  post: IArticle;
}

export function BlogCard({ post }: BlogCardProps) {
  const newDate = new Date(post.dateCreated);

  const day = newDate.getDate();
  const month = newDate.toLocaleString('en-US', { month: 'short' });

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="p-0 relative">
        <Link href={post.link}>
          <Image
            src={post.mainImage?.asset?.url || '/images/placeholder.svg'}
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
      </CardHeader>
      <CardContent className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold mb-2 flex-grow">
          <Link
            href={post.link}
            className="hover:text-primary transition-colors"
          >
            {post.title}
          </Link>
        </h3>
        <p className="text-muted-foreground text-sm mb-4 ">
          {truncateText(post.description, 180)}
        </p>
        <Button asChild variant="link" className="p-0 h-auto justify-start">
          <Link href={post.link} target="_blank">
            Read More
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
