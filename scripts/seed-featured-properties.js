#!/usr/bin/env node
// scripts/seed-featured-properties.js
// Seed 6 featured properties into Sanity using a write token.
// Usage: Set SANITY_API_TOKEN and project env vars, then run:
//   node scripts/seed-featured-properties.js

const { createClient } = require('@sanity/client');
require('dotenv').config();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || process.env.SANITY_API_VERSION || '2023-01-01';
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset) {
  console.error('Missing SANITY project config. Please set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET.');
  process.exit(1);
}
if (!token) {
  console.error('Missing SANITY_API_TOKEN. Set SANITY_API_TOKEN in your environment.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

const featuredProperties = [
  {
    _type: 'property',
    title: 'Modern Family Villa',
    price: 850000,
    address: '123 Palm Drive, Beverly Hills, CA',
    bedrooms: 5,
    bathrooms: 4,
    area: 4200,
    isFeatured: true,
    description: 'A luxurious modern villa with a pool and garden in Beverly Hills.',
    amenities: ['Pool', 'Garden', 'Garage', 'Home Theater'],
    mainImage: {
      asset: {
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      },
      alt: 'Modern Family Villa',
    },
  },
  {
    _type: 'property',
    title: 'Downtown Penthouse',
    price: 1200000,
    address: '88 Sky Tower, New York, NY',
    bedrooms: 3,
    bathrooms: 3,
    area: 2500,
    isFeatured: true,
    description: 'A stunning penthouse with skyline views and luxury amenities.',
    amenities: ['Rooftop Deck', 'Gym', 'Concierge'],
    mainImage: {
      asset: {
        url: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80',
      },
      alt: 'Downtown Penthouse',
    },
  },
  {
    _type: 'property',
    title: 'Coastal Retreat',
    price: 650000,
    address: '456 Ocean Ave, Malibu, CA',
    bedrooms: 4,
    bathrooms: 3,
    area: 3200,
    isFeatured: true,
    description: 'A beautiful retreat steps from the beach with ocean views.',
    amenities: ['Beach Access', 'Fireplace', 'Deck'],
    mainImage: {
      asset: {
        url: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80',
      },
      alt: 'Coastal Retreat',
    },
  },
  {
    _type: 'property',
    title: 'Suburban Dream Home',
    price: 480000,
    address: '789 Maple Lane, Austin, TX',
    bedrooms: 5,
    bathrooms: 4,
    area: 3500,
    isFeatured: true,
    description: 'Spacious home in a quiet neighborhood with a large backyard.',
    amenities: ['Backyard', 'Playroom', '2-Car Garage'],
    mainImage: {
      asset: {
        url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80',
      },
      alt: 'Suburban Dream Home',
    },
  },
  {
    _type: 'property',
    title: 'Urban Loft',
    price: 540000,
    address: '101 City Center, Chicago, IL',
    bedrooms: 2,
    bathrooms: 2,
    area: 1800,
    isFeatured: true,
    description: 'Chic loft in the heart of the city with modern finishes.',
    amenities: ['Open Floor Plan', 'Balcony', 'Pet Friendly'],
    mainImage: {
      asset: {
        url: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
      },
      alt: 'Urban Loft',
    },
  },
  {
    _type: 'property',
    title: 'Country Estate',
    price: 990000,
    address: '202 Green Acres, Nashville, TN',
    bedrooms: 6,
    bathrooms: 5,
    area: 6000,
    isFeatured: true,
    description: 'Expansive estate with rolling hills, stables, and privacy.',
    amenities: ['Stables', 'Barn', 'Private Lake'],
    mainImage: {
      asset: {
        url: 'https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?auto=format&fit=crop&w=800&q=80',
      },
      alt: 'Country Estate',
    },
  },
];

(async function seed() {
  try {
    for (let i = 0; i < featuredProperties.length; i++) {
      const doc = {
        ...featuredProperties[i],
        _id: `featured-property-${i + 1}`,
      };
      await client.createOrReplace(doc);
      console.log(`Created/updated: ${doc.title}`);
    }
    console.log('Seeding complete. You may need to upload images and publish in Sanity Studio.');
  } catch (error) {
    console.error('Seeding failed:', error.message || error);
    process.exit(1);
  }
})();
