import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BlogPostsService } from '@/services/sanity/blog-posts.sanity';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

interface NewsArticle {
  title: string;
  description: string;
  content?: string;
  url: string;
  publishedAt: string;
  source: string;
}

interface GeneratedPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: 'crypto' | 'investments' | 'real-estate';
  tags: string[];
  featuredImage?: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const { trigger = 'manual', newsData } = await request.json();

    console.log(`Blog generation triggered: ${trigger}`);

    // Fetch news data
    const rawNewsArticles = newsData || await fetchCryptoNews();

    // Filter inappropriate content
    const newsArticles = filterNewsArticles(rawNewsArticles);

    if (!newsArticles || newsArticles.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No appropriate news data available after content filtering'
      });
    }

    // Generate blog posts using AI
    const generatedPosts = await generateBlogPosts(newsArticles);

    // Apply final content review
    const reviewedPosts = generatedPosts.filter(post => {
      if (finalContentReview(post)) {
        console.log(`Post passed final review: ${post.title}`);
        return true;
      } else {
        console.log(`Post failed final review: ${post.title}`);
        return false;
      }
    });

    if (reviewedPosts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No posts passed content review'
      });
    }

    // Save to Sanity CMS
    const savedPosts = await savePostsToSanity(reviewedPosts);

    return NextResponse.json({
      success: true,
      posts: savedPosts,
      count: savedPosts.length,
      trigger,
      stats: {
        articlesFetched: rawNewsArticles.length,
        articlesFiltered: newsArticles.length,
        postsGenerated: generatedPosts.length,
        postsReviewed: reviewedPosts.length,
        postsPublished: savedPosts.length
      }
    });

  } catch (error) {
    console.error('Blog generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Content filtering and validation
interface ContentFilter {
  allowedKeywords: string[];
  blockedKeywords: string[];
  requiredKeywords: string[];
  minRelevanceScore: number;
}

// Define strict content filters for each category
const CONTENT_FILTERS: Record<string, ContentFilter> = {
  crypto: {
    allowedKeywords: [
      'bitcoin', 'ethereum', 'cryptocurrency', 'crypto', 'blockchain', 'defi', 'nft',
      'digital asset', 'mining', 'wallet', 'exchange', 'token', 'coin', 'altcoin',
      'market cap', 'trading volume', 'price analysis', 'technical analysis'
    ],
    blockedKeywords: [
      'scam', 'rug pull', 'hack', 'exploit', 'theft', 'fraud', 'ponzi', 'pyramid',
      'illegal', 'dark web', 'money laundering', 'terrorism', 'drugs', 'weapons',
      'gambling', 'casino', 'porn', 'adult', 'violence', 'death', 'murder', 'suicide'
    ],
    requiredKeywords: ['crypto', 'blockchain', 'bitcoin', 'ethereum'],
    minRelevanceScore: 0.7
  },
  'real-estate': {
    allowedKeywords: [
      'property', 'real estate', 'housing', 'home', 'apartment', 'condo', 'mortgage',
      'rental', 'leasing', 'commercial property', 'residential', 'foreclosure',
      'market analysis', 'property value', 'investment property', 'rental yield',
      'home prices', 'housing market', 'construction', 'development'
    ],
    blockedKeywords: [
      'eviction', 'foreclosure fraud', 'squatting', 'illegal occupancy', 'drugs',
      'crime', 'violence', 'death', 'murder', 'suicide', 'porn', 'gambling',
      'terrorism', 'weapons', 'scam', 'fraud', 'illegal activities'
    ],
    requiredKeywords: ['property', 'real estate', 'housing', 'home'],
    minRelevanceScore: 0.6
  },
  investments: {
    allowedKeywords: [
      'investment', 'portfolio', 'diversification', 'asset allocation', 'risk management',
      'financial planning', 'retirement', 'savings', 'stocks', 'bonds', 'mutual funds',
      'etf', 'index funds', 'market analysis', 'economic indicators', 'inflation',
      'interest rates', 'federal reserve', 'market trends', 'investment strategy'
    ],
    blockedKeywords: [
      'get rich quick', 'guaranteed returns', 'high risk high reward', 'scam', 'fraud',
      'ponzi', 'pyramid', 'illegal', 'tax evasion', 'money laundering', 'gambling',
      'casino', 'drugs', 'weapons', 'terrorism', 'violence', 'porn', 'adult content'
    ],
    requiredKeywords: ['investment', 'finance', 'market', 'portfolio'],
    minRelevanceScore: 0.5
  }
};

// Validate content appropriateness
function validateContent(content: string, title: string, category: string): boolean {
  const filter = CONTENT_FILTERS[category];
  if (!filter) return false;

  const fullText = (content + ' ' + title).toLowerCase();

  // Check for blocked keywords
  const hasBlockedContent = filter.blockedKeywords.some(keyword =>
    fullText.includes(keyword.toLowerCase())
  );
  if (hasBlockedContent) {
    console.log(`Content blocked due to inappropriate keywords: ${title}`);
    return false;
  }

  // Check for required keywords
  const hasRequiredKeywords = filter.requiredKeywords.some(keyword =>
    fullText.includes(keyword.toLowerCase())
  );
  if (!hasRequiredKeywords) {
    console.log(`Content rejected - missing required keywords for ${category}: ${title}`);
    return false;
  }

  // Calculate relevance score
  const allowedKeywordMatches = filter.allowedKeywords.filter(keyword =>
    fullText.includes(keyword.toLowerCase())
  ).length;

  const relevanceScore = allowedKeywordMatches / filter.allowedKeywords.length;

  if (relevanceScore < filter.minRelevanceScore) {
    console.log(`Content rejected - low relevance score (${relevanceScore}) for ${category}: ${title}`);
    return false;
  }

  return true;
}

// Fetch crypto and financial news
async function fetchCryptoNews(): Promise<NewsArticle[]> {
  try {
    const allArticles: NewsArticle[] = [];

    // Fetch from CoinGecko (free)
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/news', {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const articles = data.map((item: any) => ({
          title: item.title,
          description: item.description || item.title,
          content: item.description,
          url: item.url,
          publishedAt: item.created_at,
          source: 'CoinGecko'
        }));
        allArticles.push(...articles.slice(0, 5)); // Limit to 5 articles
      }
    } catch (error) {
      console.log('CoinGecko API failed, continuing...');
    }

    // Add fallback content if no articles found
    if (allArticles.length === 0) {
      allArticles.push({
        title: 'Cryptocurrency Market Update',
        description: 'Latest trends in the cryptocurrency market',
        content: 'The cryptocurrency market continues to evolve with new developments and opportunities.',
        url: 'https://example.com',
        publishedAt: new Date().toISOString(),
        source: 'Market Analysis'
      });
    }

    return allArticles;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

// Filter news articles for inappropriate content
function filterNewsArticles(articles: NewsArticle[]): NewsArticle[] {
  return articles.filter(article => {
    const fullText = (article.title + ' ' + article.description).toLowerCase();

    // Basic content checks
    const hasInappropriateContent = [
      'scam', 'fraud', 'hack', 'exploit', 'rug pull', 'ponzi', 'pyramid',
      'illegal', 'drugs', 'weapons', 'terrorism', 'violence', 'murder',
      'suicide', 'porn', 'gambling', 'casino', 'adult', 'nsfw'
    ].some(term => fullText.includes(term));

    if (hasInappropriateContent) {
      console.log(`Filtered out inappropriate article: ${article.title}`);
      return false;
    }

    // Must have financial/investment relevance
    const hasFinancialRelevance = [
      'crypto', 'bitcoin', 'ethereum', 'blockchain', 'investment', 'finance',
      'market', 'property', 'real estate', 'housing', 'portfolio', 'trading'
    ].some(term => fullText.includes(term));

    if (!hasFinancialRelevance) {
      console.log(`Filtered out non-financial article: ${article.title}`);
      return false;
    }

    // Title should not be clickbait or sensational
    const isClickbait = [
      'shocking', 'unbelievable', 'crazy', 'insane', 'explosive', 'breaking',
      'urgent', 'emergency', 'crisis', 'disaster', 'catastrophe'
    ].some(term => article.title.toLowerCase().includes(term));

    if (isClickbait) {
      console.log(`Filtered out clickbait article: ${article.title}`);
      return false;
    }

    return true;
  });
}

// Generate blog posts using Gemini AI
async function generateBlogPosts(articles: NewsArticle[]): Promise<GeneratedPost[]> {
  const posts: GeneratedPost[] = [];

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    for (const article of articles.slice(0, 3)) { // Generate max 3 posts per run
      // Skip if article doesn't pass initial validation
      if (!validateContent(article.description, article.title, 'crypto') &&
          !validateContent(article.description, article.title, 'real-estate') &&
          !validateContent(article.description, article.title, 'investments')) {
        console.log(`Skipping article due to content validation: ${article.title}`);
        continue;
      }

      const prompt = `You are a professional financial advisor writing for a real estate and cryptocurrency investment platform. Create a high-quality, informative blog post based on this news article.

IMPORTANT: Your content must be professional, accurate, and appropriate for investors. Focus on educational value and investment insights.

Article Title: ${article.title}
Article Description: ${article.description}
Source: ${article.source}

REQUIREMENTS:
1. Write in a professional, educational tone suitable for investors
2. Focus on investment implications and market analysis
3. Connect the news to real estate and/or cryptocurrency investment opportunities
4. Include practical insights and analysis
5. Avoid sensationalism, speculation, or unverified claims
6. Structure with clear headings and professional formatting

CONTENT STRUCTURE:
- Start with an engaging but professional title
- Provide context and analysis of the news
- Discuss investment implications
- Connect to real estate and crypto markets where relevant
- End with balanced, educational takeaways

Remember: This content will be published on a legitimate investment platform. Maintain the highest standards of professionalism and accuracy.`;

      const result = await model.generateContent(prompt);
      const aiContent = result.response.text();

      // Validate AI-generated content
      const post = parseAIResponse(aiContent, article);

      // Final content validation before adding to posts
      if (validateContent(post.content, post.title, post.category)) {
        posts.push(post);
        console.log(`Generated and validated post: ${post.title}`);
      } else {
        console.log(`AI-generated content failed validation: ${post.title}`);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('AI generation error:', error);
    // Fallback: create basic post structure
    posts.push(createFallbackPost(articles[0]));
  }

  return posts;
}

// Parse AI response into structured post
function parseAIResponse(aiContent: string, article: NewsArticle): GeneratedPost {
  const lines = aiContent.split('\n');
  const title = lines[0]?.replace(/^#+\s*/, '') || article.title;

  // Create slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Extract excerpt (first 150 characters)
  const excerpt = aiContent.substring(0, 150) + '...';

  // Determine category based on content
  const category = determineCategory(aiContent, article);

  // Generate tags
  const tags = generateTags(aiContent, article);

  return {
    title,
    slug: `${slug}-${Date.now()}`,
    content: aiContent,
    excerpt,
    category,
    tags,
    seoTitle: title,
    seoDescription: excerpt,
    publishedAt: new Date().toISOString()
  };
}

// Determine post category with enhanced logic
function determineCategory(content: string, article: NewsArticle): 'crypto' | 'investments' | 'real-estate' {
  const fullText = (content + ' ' + article.title + ' ' + article.description).toLowerCase();

  // Calculate relevance scores for each category
  const scores = {
    crypto: 0,
    'real-estate': 0,
    investments: 0
  };

  // Score based on keyword matches
  Object.entries(CONTENT_FILTERS).forEach(([category, filter]) => {
    const matches = filter.allowedKeywords.filter(keyword =>
      fullText.includes(keyword.toLowerCase())
    ).length;
    scores[category as keyof typeof scores] = matches / filter.allowedKeywords.length;
  });

  // Find the highest scoring category
  const bestCategory = Object.entries(scores).reduce((best, [category, score]) => {
    return score > scores[best as keyof typeof scores] ? category : best;
  }, 'investments');

  // Ensure minimum relevance threshold
  const bestScore = scores[bestCategory as keyof typeof scores];
  const filter = CONTENT_FILTERS[bestCategory];

  if (bestScore >= filter.minRelevanceScore) {
    return bestCategory as 'crypto' | 'investments' | 'real-estate';
  }

  // Default fallback
  return 'investments';
}

// Generate relevant tags with enhanced logic
function generateTags(content: string, article: NewsArticle): string[] {
  const tags = new Set<string>();
  const lowerContent = (content + ' ' + article.title + ' ' + article.description).toLowerCase();

  // Add category-specific tags
  const category = determineCategory(content, article);
  const filter = CONTENT_FILTERS[category];

  // Add relevant keywords as tags
  filter.allowedKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword.toLowerCase())) {
      // Convert to tag format (remove spaces, add hyphens)
      const tag = keyword.replace(/\s+/g, '-').toLowerCase();
      tags.add(tag);
    }
  });

  // Add core category tags
  tags.add('finance');
  tags.add('investment');
  tags.add(category);

  // Limit to maximum 8 tags
  return Array.from(tags).slice(0, 8);
}

// Create fallback post if AI fails
function createFallbackPost(article: NewsArticle): GeneratedPost {
  const title = `Market Update: ${article.title}`;
  const content = `## ${article.title}

${article.description}

### Key Insights
- Market conditions are evolving
- Stay informed about investment opportunities
- Consider diversifying your portfolio

### Investment Considerations
This development in the financial markets presents both opportunities and challenges for investors. As always, thorough research and professional advice are recommended before making investment decisions.

### Real Estate Connection
Market trends like these often correlate with real estate investment opportunities. Consider exploring our platform for real estate investment options that align with current market conditions.`;

  return {
    title,
    slug: `market-update-${Date.now()}`,
    content,
    excerpt: article.description.substring(0, 150) + '...',
    category: 'investments',
    tags: ['market-update', 'investment', 'finance'],
    seoTitle: title,
    seoDescription: article.description.substring(0, 160),
    publishedAt: new Date().toISOString()
  };
}

// Final content review before publishing
function finalContentReview(post: GeneratedPost): boolean {
  const fullContent = (post.title + ' ' + post.content + ' ' + post.excerpt).toLowerCase();

  // Comprehensive blocked content check
  const comprehensiveBlocks = [
    // Financial scams and fraud
    'guaranteed returns', 'get rich quick', 'high risk high reward', 'double your money',
    'risk-free investment', 'guaranteed profit', '100% return', 'overnight millionaire',

    // Illegal activities
    'money laundering', 'tax evasion', 'insider trading', 'market manipulation',
    'illegal activities', 'unlawful', 'criminal', 'felony',

    // Harmful content
    'suicide', 'self-harm', 'eating disorder', 'mental illness', 'depression', 'anxiety',
    'death', 'murder', 'violence', 'assault', 'abuse', 'trauma',

    // Inappropriate content
    'porn', 'adult', 'nsfw', 'explicit', 'sexual', 'nude', 'naked',
    'gambling', 'casino', 'betting', 'lottery', 'jackpot',

    // Sensationalism
    'shocking', 'unbelievable', 'crazy', 'insane', 'explosive', 'breaking news',
    'urgent', 'emergency', 'crisis', 'disaster', 'catastrophe', 'apocalypse',

    // Unverified claims
    'secret strategy', 'hidden knowledge', 'insider information', 'confidential',
    'exclusive opportunity', 'limited time offer', 'act now'
  ];

  const hasBlockedContent = comprehensiveBlocks.some(term =>
    fullContent.includes(term)
  );

  if (hasBlockedContent) {
    console.log(`Content failed final review - blocked terms detected: ${post.title}`);
    return false;
  }

  // Ensure content has substantial value
  const wordCount = post.content.split(/\s+/).length;
  if (wordCount < 150) {
    console.log(`Content too short (${wordCount} words): ${post.title}`);
    return false;
  }

  // Check for balanced, professional tone
  const professionalIndicators = [
    'analysis', 'consider', 'evaluate', 'research', 'professional', 'advisor',
    'investment', 'portfolio', 'strategy', 'market', 'economic', 'financial'
  ];

  const hasProfessionalTone = professionalIndicators.some(term =>
    fullContent.includes(term)
  );

  if (!hasProfessionalTone) {
    console.log(`Content lacks professional tone: ${post.title}`);
    return false;
  }

  return true;
}

// Save posts to Sanity CMS
async function savePostsToSanity(posts: GeneratedPost[]): Promise<any[]> {
  try {
    // Convert to Sanity format
    const sanityPosts = posts.map(post => ({
      title: post.title,
      slug: {
        _type: 'slug' as const,
        current: post.slug
      },
      content: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: post.content
            }
          ]
        }
      ],
      excerpt: post.excerpt,
      category: post.category,
      tags: post.tags,
      publishedAt: post.publishedAt,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      autoGenerated: true,
      source: 'ai-blog-generator'
    }));

    // Save to Sanity
    const savedPosts = await BlogPostsService.createPosts(sanityPosts);

    console.log(`Successfully saved ${savedPosts.length} blog posts to Sanity`);
    return savedPosts;

  } catch (error) {
    console.error('Error saving to Sanity:', error);
    throw error;
  }
}