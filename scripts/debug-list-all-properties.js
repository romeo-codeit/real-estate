const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'bw556xju',
  dataset: 'production',
  apiVersion: '2025-12-05',
  useCdn: false,
});

const query = `*[_type == "property"] | order(_createdAt desc)`;

client
  .fetch(query)
  .then((properties) => {
    console.log('=== ALL PROPERTIES ===');
    console.log(`Found ${properties.length} properties\n`);
    properties.forEach((prop, idx) => {
      console.log(`[${idx + 1}] ${prop.title} (isFeatured: ${prop.isFeatured})`);
    });
  })
  .catch((err) => {
    console.error('Error fetching from Sanity:', err);
  });
