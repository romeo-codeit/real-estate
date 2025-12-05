const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'bw556xju',
  dataset: 'production',
  apiVersion: '2025-12-05',
  useCdn: false,
});

const query = `
  *[_type == "property" && isFeatured == true] | order(_createdAt desc) [0...3] {
    _id,
    title,
    price,
    mainImage{
      alt,
      asset->{
        url
      }
    }
  }
`;

client
  .fetch(query)
  .then((properties) => {
    console.log('=== FEATURED PROPERTIES WITH ASSET REFERENCES ===');
    console.log(`Found ${properties.length} properties\n`);
    properties.forEach((prop, idx) => {
      console.log(`[${idx + 1}] ${prop.title}`);
      console.log(`    Price: $${prop.price}`);
      if (prop.mainImage) {
        console.log(`    Alt: ${prop.mainImage.alt}`);
        console.log(`    Asset URL: ${prop.mainImage.asset?.url || 'null'}`);
      }
      console.log();
    });
  })
  .catch((err) => {
    console.error('Error fetching from Sanity:', err);
  });
