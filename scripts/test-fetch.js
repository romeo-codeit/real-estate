// Test fetch cryptos from Sanity
require('dotenv').config();

const { createClient } = require('@sanity/client');

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-01-01',
});

async function testFetch() {
  const query = `*[_type == "crypto"] | order(marketCap desc) {
    _id,
    _createdAt,
    symbol,
    name,
    price,
    description,
    change24h,
    expectedROI,
    riskLevel,
    minInvestment,
    marketCap,
    "logoUrl": logo.url,
  }`;

  try {
    const cryptos = await sanity.fetch(query);
    console.log('Fetched cryptos:', cryptos);
  } catch (error) {
    console.error('Error fetching:', error);
  }
}

testFetch();