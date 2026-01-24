
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@sanity/client';

// Load environment variables from .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function deleteOldBlog() {
    console.log('🗑️  Looking for oldest blog post to delete...\n');

    const client = createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        useCdn: false,
        apiVersion: '2024-01-01',
        token: process.env.SANITY_API_TOKEN,
    });

    try {
        // Fetch all posts ordered by published date (oldest first)
        // We want the oldest ones at the top of the list
        const query = `*[_type == "post"] | order(publishedAt asc) {
      _id,
      title,
      publishedAt
    }`;

        const posts = await client.fetch(query);
        console.log(`   Found ${posts.length} posts.`);

        if (posts.length < 2) {
            console.log('   ⚠️ Fewer than 2 posts found. To be safe, I will NOT delete the only post.');
            return;
        }

        const oldestPost = posts[0];
        console.log(`   identified Oldest Post:`);
        console.log(`   - Title: ${oldestPost.title}`);
        console.log(`   - ID: ${oldestPost._id}`);
        console.log(`   - Published: ${oldestPost.publishedAt}`);

        console.log('\n   Deleting...');
        await client.delete(oldestPost._id);
        console.log(`   ✅ Successfully deleted post: ${oldestPost.title} (${oldestPost._id})`);

    } catch (error: any) {
        console.error(`   ❌ Deletion Failed: ${error.message}`);
    }
}

deleteOldBlog().catch(console.error);
