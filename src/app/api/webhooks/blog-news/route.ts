import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, articles, secret } = body;

    // Basic security check (you should use a proper secret)
    const expectedSecret = process.env.WEBHOOK_SECRET || 'your-webhook-secret';
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Webhook received from ${source} with ${articles?.length || 0} articles`);

    // Validate the news data
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid articles provided'
      });
    }

    // Transform webhook data to our format
    const newsData = articles.map((article: any) => ({
      title: article.title || article.headline,
      description: article.description || article.summary || article.title,
      content: article.content || article.description,
      url: article.url || article.link,
      publishedAt: article.publishedAt || article.pubDate || new Date().toISOString(),
      source: source || 'webhook'
    }));

    // Trigger blog post generation
    const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-blog-posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger: `webhook-${source}`,
        newsData
      })
    });

    const result = await generateResponse.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Generated ${result.count} blog posts from ${source} webhook`,
        posts: result.posts
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to generate blog posts',
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    }, { status: 500 });
  }
}

// Handle different HTTP methods
export async function GET() {
  return NextResponse.json({
    message: 'Blog Webhook Endpoint',
    usage: 'POST with { source, articles, secret }',
    example: {
      source: 'crypto-news-api',
      secret: 'your-webhook-secret',
      articles: [
        {
          title: 'Bitcoin hits new high',
          description: 'Bitcoin reaches $100k',
          url: 'https://example.com/news',
          publishedAt: '2025-12-06T10:00:00Z'
        }
      ]
    }
  });
}