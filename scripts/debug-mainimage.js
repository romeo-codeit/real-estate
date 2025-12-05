const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'bw556xju',
  dataset: 'production',
  apiVersion: '2025-12-05',
  useCdn: false, // Use API for latest data
});

const query = `
  *[_type == "property" && isFeatured == true] | order(_createdAt desc) [0...1] {
    _id,
    title,
    mainImage
  }
`;

client
  .fetch(query)
  .then((properties) => {
    console.log('=== FULL MAINIMAGE STRUCTURE ===');
    console.log(JSON.stringify(properties[0], null, 2));
  })
  .catch((err) => {
    console.error('Error fetching from Sanity:', err);
  });
