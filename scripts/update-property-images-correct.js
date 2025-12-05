// Update featured properties with CORRECT realistic Unsplash images
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

// CORRECT property images that actually match the property type
const propertyImages = [
  {
    title: 'Modern Family Villa',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    alt: 'Modern Family Villa with pool',
  },
  {
    title: 'Downtown Penthouse',
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    alt: 'Luxury Downtown Penthouse',
  },
  {
    title: 'Coastal Retreat',
    url: 'https://images.unsplash.com/photo-1499209974033-bc90558a9a7c?auto=format&fit=crop&w=800&q=80',
    alt: 'Coastal Beach House',
  },
  {
    title: 'Suburban Dream Home',
    url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
    alt: 'Suburban Family Home',
  },
  {
    title: 'Urban Loft',
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    alt: 'Modern Urban Loft Apartment',
  },
  {
    title: 'Country Estate',
    url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
    alt: 'Luxury Country Estate Mansion',
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
      console.log(`✓ Done: ${propImg.title}`);
    } catch (err) {
      console.error(`✗ Error for ${propImg.title}:`, err.message);
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  }
  console.log('\nImage update complete.');
}

updateImages();
