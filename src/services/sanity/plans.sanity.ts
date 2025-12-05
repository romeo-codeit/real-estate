import { groq } from 'next-sanity';
import { sanityClient } from './sanity-client';

export const getPlans = async () => {
  const query = groq`
    *[_type == "plan"] | order(_createdAt asc) {
      _id,
      _createdAt,
      name,
      priceRange {
        minPrice,
        maxPrice
      },
      features[]
    }
  `;

  try {
    const plans = await sanityClient.fetch(query);
    return plans;
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    return [];
  }
};
