#!/usr/bin/env node
const { createClient } = require('@sanity/client');
const { groq } = require('next-sanity');
require('dotenv').config();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || process.env.SANITY_API_VERSION || '2023-01-01';
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset) {
  console.error('Missing SANITY project config.');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: true });

(async function check() {
  try {
    const query = groq`*[_type == "property" && isFeatured == true] | order(_createdAt desc) { _id, title, mainImage }`;
    const props = await client.fetch(query);
    if (!props || props.length === 0) {
      console.log('No featured properties found.');
      return;
    }
    console.log(`Found ${props.length} featured properties:`);
    props.forEach((p) => {
      console.log(p.title, '->', JSON.stringify(p.mainImage));
    });
  } catch (e) {
    console.error('Error fetching featured properties via direct client:', e);
  }
})();
