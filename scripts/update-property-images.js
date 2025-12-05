// Update featured properties with realistic Unsplash images
const { createClient } = require('@sanity/client');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
const token = process.env.SANITY_API_TOKEN;

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

const propertyImages = [
  {
    title: 'Modern Family Villa',
    url: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80',
    alt: 'Modern Family Villa',
  },
  {
    title: 'Downtown Penthouse',
    url: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80',
    alt: 'Downtown Penthouse',
  },
  {
    title: 'Coastal Retreat',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    alt: 'Coastal Retreat',
  },
  {
    title: 'Suburban Dream Home',
    url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80',
    alt: 'Suburban Dream Home',
  },
  {
    title: 'Urban Loft',
    url: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
    alt: 'Urban Loft',
  },
  {
    title: 'Country Estate',
    url: 'https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?auto=format&fit=crop&w=800&q=80',
    alt: 'Country Estate',
  },
];

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

async function updateImages() {
  for (const propImg of propertyImages) {
    const property = await client.fetch(`*[_type == "property" && title == "${propImg.title}"][0]{_id}`);
    if (!property || !property._id) {
      console.log(`Property not found: ${propImg.title}`);
      continue;
    }
    const tempFile = path.join(__dirname, 'temp-image.jpg');
    try {
      console.log(`Downloading image for ${propImg.title}...`);
      await downloadImage(propImg.url, tempFile);
      console.log(`Uploading to Sanity...`);
      const asset = await uploadImageToSanity(tempFile, propImg.alt);
      console.log(`Updating property ${propImg.title} with new asset ref...`);
      await client.patch(property._id)
        .set({ mainImage: { alt: propImg.alt, asset: { _type: 'reference', _ref: asset._id } } })
        .commit();
      console.log(`Done: ${propImg.title}`);
    } catch (err) {
      console.error(`Error for ${propImg.title}:`, err.message);
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  }
  console.log('Image update complete.');
}

updateImages();
