#!/usr/bin/env node
// scripts/seed-agents.js
// Seed sample agent documents into Sanity
// Usage: Set SANITY_PROJECT_ID, SANITY_DATASET, and SANITY_API_TOKEN in environment, then run:
//   node scripts/seed-agents.js

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

(async function seedAgents() {
  try {
    const agents = [
      {
        _type: 'agent',
        name: 'Sarah Johnson',
        title: 'Senior Real Estate Agent',
        email: 'sarah.johnson@realvest.com',
        phoneNumber: '+1 (555) 123-4567',
        numberOfProperties: 45,
        profilePhotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
      },
      {
        _type: 'agent',
        name: 'Michael Chen',
        title: 'Luxury Property Specialist',
        email: 'michael.chen@realvest.com',
        phoneNumber: '+1 (555) 234-5678',
        numberOfProperties: 32,
        profilePhotoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
      },
      {
        _type: 'agent',
        name: 'Emily Rodriguez',
        title: 'Commercial Real Estate Agent',
        email: 'emily.rodriguez@realvest.com',
        phoneNumber: '+1 (555) 345-6789',
        numberOfProperties: 28,
        profilePhotoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      },
      {
        _type: 'agent',
        name: 'David Thompson',
        title: 'First-Time Homebuyer Specialist',
        email: 'david.thompson@realvest.com',
        phoneNumber: '+1 (555) 456-7890',
        numberOfProperties: 38,
        profilePhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      },
      {
        _type: 'agent',
        name: 'Lisa Park',
        title: 'Investment Property Expert',
        email: 'lisa.park@realvest.com',
        phoneNumber: '+1 (555) 567-8901',
        numberOfProperties: 41,
        profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
      },
      {
        _type: 'agent',
        name: 'James Wilson',
        title: 'Residential Sales Agent',
        email: 'james.wilson@realvest.com',
        phoneNumber: '+1 (555) 678-9012',
        numberOfProperties: 35,
        profilePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
      }
    ];

    for (const agent of agents) {
      // Derive an ID-safe document ID
      const docId = `agent-${agent.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const doc = {
        _id: docId,
        ...agent,
      };
      // Create or replace ensures you can re-run safely
      await client.createOrReplace(doc);
      console.log(`Created/updated agent '${agent.name}' (id: ${docId})`);
    }

    console.log('Agent seeding complete. Please publish documents in Sanity Studio if necessary.');
  } catch (error) {
    console.error('Agent seeding failed:', error.message || error);
    process.exit(1);
  }
})();