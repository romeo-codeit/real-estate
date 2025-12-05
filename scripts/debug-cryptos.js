const { createClient } = require('@sanity/client');
const client = createClient({
  projectId: 'bw556xju',
  dataset: 'production',
  apiVersion: '2025-12-05',
  useCdn: false,
});

const query = `*[_type == "crypto"] | order(marketCap desc)`;
client.fetch(query).then(items => {
  console.log('Found cryptos:', items.length);
  items.forEach((c, i) => console.log(`${i+1}: ${c.name} - logo ${!!c.logo}`));
});
