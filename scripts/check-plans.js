#!/usr/bin/env node
const { createClient } = require('@sanity/client');
require('dotenv').config();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || process.env.SANITY_API_VERSION || '2023-01-01';

if (!projectId || !dataset) {
  console.error('Missing SANITY project config. Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

(async function check() {
  try {
    const query = '*[_type == "plan"]{_id, name, _createdAt}';
    const items = await client.fetch(query);
    console.log(`Found ${items.length} plan(s).`);
    items.forEach((doc) => console.log(`${doc._id}: ${doc.name} (${doc._createdAt})`));
  } catch (e) {
    console.error('Failed to fetch plans:', e.message || e);
    process.exit(1);
  }
})();
