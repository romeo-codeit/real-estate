#!/usr/bin/env node
// scripts/seed-sanity.js
// Seed some sample 'plan' documents into Sanity using a write token.
// Usage: Set SANITY_PROJECT_ID, SANITY_DATASET, and SANITY_API_TOKEN in environment, then run:
//   node scripts/seed-sanity.js

const { createClient } = require('@sanity/client');
require('dotenv').config();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || process.env.SANITY_API_VERSION || '2023-01-01';
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset) {
  console.error('Missing SANITY project config. Please set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET (or SANITY_PROJECT_ID and SANITY_DATASET) in your environment.');
  process.exit(1);
}

if (!token) {
  console.error('Missing SANITY_API_TOKEN. Set SANITY_API_TOKEN in your environment to create documents.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

(async function seed() {
  try {
    const plans = [
      {
        _type: 'plan',
        name: 'Starter',
        priceRange: { minPrice: 1000, maxPrice: 5000 },
        features: ['Basic listing', 'Email support', '1 user'],
        popular: false,
      },
      {
        _type: 'plan',
        name: 'Growth',
        priceRange: { minPrice: 5000, maxPrice: 20000 },
        features: ['Featured listing', 'Priority support', '5 users'],
        popular: true,
      },
      {
        _type: 'plan',
        name: 'Enterprise',
        priceRange: { minPrice: 20000, maxPrice: 100000 },
        features: ['Custom features', 'Dedicated support', 'Unlimited users'],
        popular: false,
      },
    ];

    for (const plan of plans) {
      // Derive an ID-safe document ID
      const docId = `plan-${plan.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const doc = {
        _id: docId,
        ...plan,
      };
      // Create or replace ensures you can re-run safely
      await client.createOrReplace(doc);
      console.log(`Created/updated plan '${plan.name}' (id: ${docId})`);
    }

    console.log('Seeding complete. Please publish documents in Sanity Studio if necessary.');
  } catch (error) {
    console.error('Seeding failed:', error.message || error);
    process.exit(1);
  }
})();
