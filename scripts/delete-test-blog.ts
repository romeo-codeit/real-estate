
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@sanity/client';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function deleteTestPost() {
    console.log('🗑️ Cleaning up test blog post...');

    try {
        const client = createClient({
            projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
            dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
            useCdn: false,
            apiVersion: '2024-01-01',
            token: process.env.SANITY_API_TOKEN,
        });

        // Find the post by source field we added
        const query = '*[_type == "post" && source == "verification-script"]';
        const posts = await client.fetch(query);

        if (posts.length === 0) {
            console.log('   ℹ️ No test posts found to delete.');
            return;
        }

        console.log(`   Found ${posts.length} test post(s). Deleting...`);

        for (const post of posts) {
            await client.delete(post._id);
            console.log(`   ✅ Deleted post: ${post.title} (${post._id})`);
        }

    } catch (error: any) {
        console.error(`   ❌ Failed to delete post: ${error.message}`);
        process.exit(1);
    }
}

deleteTestPost().catch(console.error);
