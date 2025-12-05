// Fix Coastal Retreat image
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

const coastalImage = {
  title: 'Coastal Retreat',
  url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  alt: 'Coastal Beach House Retreat',
};

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

async function updateCoastal() {
  const property = await client.fetch(`*[_type == "property" && title == "${coastalImage.title}"][0]{_id}`);
  if (!property || !property._id) {
    console.log(`Property not found: ${coastalImage.title}`);
    return;
  }
  
  const tempFile = path.join(__dirname, 'temp-image.jpg');
  try {
    console.log(`Downloading Coastal Retreat image...`);
    await downloadImage(coastalImage.url, tempFile);
    console.log(`Uploading to Sanity...`);
    const asset = await uploadImageToSanity(tempFile, coastalImage.alt);
    console.log(`Updating property...`);
    await client.patch(property._id)
      .set({ mainImage: { alt: coastalImage.alt, asset: { _type: 'reference', _ref: asset._id } } })
      .commit();
    console.log(`✓ Done: Coastal Retreat`);
  } catch (err) {
    console.error(`✗ Error:`, err.message);
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

updateCoastal();
