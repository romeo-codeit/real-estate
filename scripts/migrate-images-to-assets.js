// Automatically migrate Unsplash image URLs to Sanity image assets for featured properties
// Usage: node scripts/migrate-images-to-assets.js

const { createClient } = require('@sanity/client');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset || !token) {
  console.error('Missing Sanity credentials.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

async function downloadImage(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(arrayBuffer));
}

async function uploadImageToSanity(filePath, alt) {
  const asset = await client.assets.upload('image', fs.createReadStream(filePath), {
    filename: path.basename(filePath),
    label: alt,
  });
  return asset;
}

async function migrate() {
  const properties = await client.fetch(`*[_type == "property" && isFeatured == true]{_id, title, mainImage}`);
  for (const prop of properties) {
    const url = prop.mainImage?.asset?.url;
    const alt = prop.mainImage?.alt || prop.title;
    if (!url) {
      console.log(`Skipping ${prop.title}: no image URL.`);
      continue;
    }
    const tempFile = path.join(__dirname, 'temp-image.jpg');
    try {
      console.log(`Downloading image for ${prop.title}...`);
      await downloadImage(url, tempFile);
      console.log(`Uploading to Sanity...`);
      const asset = await uploadImageToSanity(tempFile, alt);
      console.log(`Updating property ${prop.title} with new asset ref...`);
      await client.patch(prop._id)
        .set({ mainImage: { alt, asset: { _type: 'reference', _ref: asset._id } } })
        .commit();
      console.log(`Done: ${prop.title}`);
    } catch (err) {
      console.error(`Error for ${prop.title}:`, err.message);
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  }
  console.log('Migration complete.');
}

migrate();
