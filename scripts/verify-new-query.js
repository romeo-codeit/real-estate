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
    address,
    bedrooms,
    bathrooms,
    isFeatured,
    area,
    propertyType->{
      title
    },
    mainImage{
      alt,
      asset
    }
  }
`;

client
  .fetch(query)
  .then((properties) => {
    console.log('=== FEATURED PROPERTIES (NEW QUERY) ===');
    console.log(`Found ${properties.length} properties\n`);
    properties.forEach((prop, idx) => {
      console.log(`[${idx + 1}] ${prop.title}`);
      console.log(`    Price: $${prop.price}`);
      console.log(`    mainImage exists: ${!!prop.mainImage}`);
      if (prop.mainImage) {
        console.log(`    mainImage.alt: ${prop.mainImage.alt}`);
        console.log(`    mainImage.asset exists: ${!!prop.mainImage.asset}`);
        if (prop.mainImage.asset) {
          console.log(`    URL: ${prop.mainImage.asset.url}`);
        }
      }
      console.log();
    });
  })
  .catch((err) => {
    console.error('Error fetching from Sanity:', err);
  });
