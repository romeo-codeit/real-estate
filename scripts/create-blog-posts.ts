import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@sanity/client';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const blogPosts = [
    {
        title: "Urban Apartment Investing: The Smart Choice for 2026",
        imageSource: 'urban-apartment-temp.png',
        imageName: 'urban-apartment-investing.jpg',
        category: 'investment',
        tags: ['urban', 'apartments', 'investment', 'city-living'],
        content: `Urban apartment buildings are becoming one of the most attractive investment opportunities in today's real estate market. With increasing urbanization and changing lifestyle preferences, multi-unit properties in city centers offer consistent returns and long-term value appreciation.

## Why Urban Apartments?

The shift toward urban living continues to accelerate. Young professionals, downsizing retirees, and remote workers are all seeking the convenience and amenities that city apartments provide. This demographic trend creates sustained demand and rental stability.

## Location Advantages

Urban apartments benefit from proximity to employment centers, entertainment districts, and public transportation. These location advantages translate to higher occupancy rates and the ability to command premium rents. Properties near transit hubs typically see 15-20% higher rental yields compared to suburban alternatives.

## Diversification Through Multi-Unit Properties

Unlike single-family homes, apartment buildings offer natural diversification. Multiple units mean multiple income streams, reducing the impact of vacancies. Even if one unit sits empty, the others continue generating revenue, providing a cushion that single-property investments lack.

## Appreciation Potential

Urban real estate historically appreciates faster than suburban properties. Limited land availability in city centers, combined with increasing demand, creates a supply-demand imbalance that drives prices upward. Investors who entered major urban markets a decade ago have seen returns exceeding 100% in many cities.

## Professional Management Options

The multi-unit nature of apartment buildings makes professional management economically viable. Property management companies can efficiently handle tenant relations, maintenance, and rent collection across multiple units, making this a truly passive investment for busy professionals.`
    },
    {
        title: "Luxury Penthouses: The Ultimate Real Estate Investment",
        imageSource: 'luxury-penthouse-temp.png',
        imageName: 'luxury-penthouse-investment.jpg',
        category: 'luxury',
        tags: ['luxury', 'penthouses', 'high-end', 'investment'],
        content: `Luxury penthouses represent the pinnacle of urban real estate, combining exclusivity, breathtaking views, and exceptional returns. For discerning investors, these trophy properties offer more than just financial gains—they provide prestige, lifestyle benefits, and a tangible store of wealth.

## The Luxury Market Advantage

The ultra-luxury real estate segment operates independently of typical market fluctuations. High-net-worth individuals view penthouses as both homes and investment vehicles, creating sustained demand even during economic uncertainties. This market resilience makes penthouses particularly attractive for wealth preservation.

## Architectural Excellence

Modern penthouses showcase cutting-edge design and premium materials. Floor-to-ceiling windows, private terraces, and custom finishes appeal to buyers seeking the extraordinary. These architectural features justify premium pricing and ensure the property stands out in any market condition.

## Scarcity Creates Value

True penthouses are inherently limited—each building has only one or two top-floor units. This scarcity, combined with high barriers to entry, creates an exclusive market where supply will always lag behind demand from affluent buyers.

## Rental Income Potential

When not owner-occupied, luxury penthouses command exceptional rental rates. Corporate executives, celebrities, and international visitors willingly pay premium prices for short-term and long-term stays. Annual rental yields of 4-6% are common, with the added benefit of personal use when desired.

## Long-Term Appreciation

Luxury pent houses in prime locations have demonstrated remarkable appreciation. Properties in gateway cities like New York, London, and Hong Kong have seen values double or triple over 10-15 year periods. For investors with a long-term horizon, penthouses offer both income and capital appreciation in a single, prestigious package.`
    }
];

async function createBlogPosts() {
    console.log('📝 Creating 2 unique blog posts...\n');

    const client = createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        useCdn: false,
        apiVersion: '2024-01-01',
        token: process.env.SANITY_API_TOKEN,
    });

    const fs = await import('fs');

    for (const [index, post] of blogPosts.entries()) {
        console.log(`\n${index + 1}. Creating: "${post.title}"`);

        // Optimize and save image
        console.log('   Optimizing image...');
        const sourcePath = path.resolve(__dirname, `../public/images/${post.imageSource}`);
        const outputPath = path.resolve(__dirname, `../public/images/${post.imageName}`);

        await sharp(sourcePath)
            .resize(1200, 800, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 85 })
            .toFile(outputPath);
        console.log(`   ✅ Image saved: ${post.imageName}`);

        // Upload to Sanity
        console.log('   Uploading to Sanity...');
        const imageBuffer = fs.readFileSync(outputPath);
        // @ts-ignore
        const asset = await client.assets.upload('image', imageBuffer, {
            filename: post.imageName
        });
        console.log(`   ✅ Image uploaded: ${asset._id}`);

        // Create content blocks
        const contentBlocks = post.content
            .split('\n\n')
            .filter(text => text.trim())
            .map(text => {
                const trimmed = text.trim();
                if (trimmed.startsWith('##')) {
                    return {
                        _type: 'block',
                        style: 'h2',
                        children: [{ _type: 'span', text: trimmed.replace('## ', '') }]
                    };
                } else {
                    return {
                        _type: 'block',
                        style: 'normal',
                        children: [{ _type: 'span', text: trimmed }]
                    };
                }
            });

        // Create post
        const slug = `${post.imageName.replace('.jpg', '')}-${Date.now()}`;
        const newPost = {
            _type: 'post',
            title: post.title,
            slug: { _type: 'slug', current: slug },
            content: contentBlocks,
            excerpt: post.content.substring(0, 150) + '...',
            category: post.category,
            tags: post.tags,
            publishedAt: new Date(Date.now() - index * 3600000).toISOString(), // Stagger times
            autoGenerated: true,
            source: 'bulk-generation-script',
            featuredImage: {
                _type: 'image',
                asset: {
                    _ref: asset._id
                }
            }
        };

        const savedPost = await client.create(newPost);
        console.log(`   ✅ Post created: ${savedPost._id}`);
    }

    console.log('\n✅ All blog posts created successfully!');
    console.log('Visit http://localhost:3000/blog to see them.');
}

createBlogPosts().catch(console.error);
