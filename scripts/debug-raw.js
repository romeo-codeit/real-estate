const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'bw556xju',
  dataset: 'production',
  apiVersion: '2025-12-05',
  useCdn: false,
});

const query = `*[_type == "property" && isFeatured == true] | order(_createdAt desc) [0...1]`;

client
  .fetch(query)
  .then((result) => {
    console.log('Raw property object:');
    console.log(JSON.stringify(result[0], null, 2));
  })
  .catch((err) => console.error('Error:', err));
