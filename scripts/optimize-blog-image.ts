import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function optimizeImage() {
    const inputPath = path.resolve(__dirname, '../public/images/blog-placeholder.jpg');
    const outputPath = path.resolve(__dirname, '../public/images/blog-placeholder-optimized.jpg');

    console.log('Optimizing blog image...');

    await sharp(inputPath)
        .resize(1200, 800, {
            fit: 'cover',
            position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

    console.log(`✅ Optimized image saved to: ${outputPath}`);

    // Replace the original with the optimized version
    const fs = await import('fs');
    fs.renameSync(outputPath, inputPath);
    console.log('✅ Original image replaced with optimized version');
}

optimizeImage().catch(console.error);
