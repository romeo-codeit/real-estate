# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

### Seeding Sanity (optional)

If you have a Sanity dataset and write token configured, you can seed sample plan documents with the following (useful for local development):

1. Add a write token in your `.env.local` file:

```
SANITY_API_TOKEN=your-write-token-here
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=your_dataset
NEXT_PUBLIC_SANITY_API_VERSION=2023-01-01
```

2. Run the seeding script:

```bash
npm run sanity:seed
```

3. Seed will create a few basic `plan` documents. If you also use Sanity Studio, open it and publish any un-published documents.

If you don't have a Sanity project or Studio, you can still test the UI locally — the `PricingPlans` component falls back to showing sample plan cards when no plans are found.
