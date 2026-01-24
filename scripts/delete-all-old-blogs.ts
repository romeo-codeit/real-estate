import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@sanity/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function deleteAllOldBlogs() {
    console.log('🗑️  Deleting all blogs except the newest one...\n');

    const client = createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        useCdn: false,
        apiVersion: '2024-01-01',
        token: process.env.SANITY_API_TOKEN,
    });

    try {
        const query = `*[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      publishedAt
    }`;

        const posts = await client.fetch(query);
        console.log(`   Found ${posts.length} total posts.`);

        if (posts.length <= 1) {
            console.log('   ✅ Only 1 or fewer posts. Nothing to delete.');
            return;
        }

        // Keep the first (newest), delete the rest
        const postsToDelete = posts.slice(1);
        console.log(`   Will delete ${postsToDelete.length} old posts...\n`);

        for (const post of postsToDelete) {
            console.log(`   Deleting: ${post.title} (${post._id})`);
            await client.delete(post._id);
        }

        console.log(`\n   ✅ Successfully deleted ${postsToDelete.length} old posts`);
        console.log(`   ✅ Kept newest post: ${posts[0].title}`);

    } catch (error: any) {
        console.error(`   ❌ Deletion Failed: ${error.message}`);
    }
}

deleteAllOldBlogs().catch(console.error);
