# Sanity Plan schema

Copy this schema to your Sanity Studio's `schemas` folder and import it into your schema config.

```js
// schemas/plan.js
export default {
  name: 'plan',
  title: 'Plan',
  type: 'document',
  fields: [
    { name: 'name', title: 'Name', type: 'string' },
    {
      name: 'priceRange',
      title: 'Price Range',
      type: 'object',
      fields: [
        { name: 'minPrice', title: 'Min Price', type: 'number' },
        { name: 'maxPrice', title: 'Max Price', type: 'number' },
      ],
    },
    { name: 'features', title: 'Features', type: 'array', of: [{ type: 'string' }] },
    { name: 'popular', title: 'Popular', type: 'boolean', initialValue: false },
  ],
};
```

Once you add this schema to your Sanity Studio and run it, you can create `plan` documents from the Studio UI. If you also want the seed script to create them, make sure `SANITY_API_TOKEN` is set and run:

```bash
npm run sanity:seed
```
