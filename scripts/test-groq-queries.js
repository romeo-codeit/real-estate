const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'bw556xju',
  dataset: 'production',
  apiVersion: '2025-12-05',
  useCdn: false,
});

// Test different query approaches
const queries = [
  {
    name: 'With explicit asset projection',
    query: `
      *[_type == "property" && isFeatured == true] | order(_createdAt desc) [0...3] {
        _id,
        title,
        price,
        mainImage {
          alt,
          asset-> {
            url
          }
        }
      }
    `,
  },
  {
    name: 'Direct mainImage access',
    query: `
      *[_type == "property" && isFeatured == true] | order(_createdAt desc) [0...3] {
        _id,
        title,
        mainImage {
          alt,
          "imageUrl": asset->url
        }
      }
    `,
  },
];

async function testQueries() {
  for (const test of queries) {
    try {
      console.log(`\n=== Testing: ${test.name} ===`);
      const result = await client.fetch(test.query);
      console.log(`Success! Got ${result.length} results`);
      console.log(JSON.stringify(result[0], null, 2));
    } catch (err) {
      console.error(`Failed: ${err.message}`);
    }
  }
}

testQueries();
