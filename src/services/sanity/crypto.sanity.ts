// Your data fetching file (e.g., api/sanity-client.ts or wherever getArticles is)
import { ICrypto } from '@/lib/types'; // Import the new type
import { groq } from 'next-sanity';
import { sanityClient } from './sanity-client'; // Assuming you have this client

export const getCryptos = async (): Promise<ICrypto[]> => {
  const query = groq`
    *[_type == "crypto"] | order(marketCap desc) {
      _id,
      _createdAt,
      symbol,
      name,
      price,
      description,
      change24h,
      expectedROI,
      riskLevel,
      minInvestment,
      marketCap,
      // Custom projection to get the direct image URL and rename it
      "logoUrl": logo.asset->url,
    }
  `;

  try {
    // The 'await sanityClient.fetch(query)' will return data matching ICrypto[]
    const cryptos: ICrypto[] = await sanityClient.fetch(query);
    console.log('Fetched cryptos:', cryptos);
    return cryptos;
  } catch (error) {
    console.error('Failed to fetch crypto plans:', error);
    return [];
  }
};

export const getSingleCrypto = async (params: { id: string }) => {
  const query = groq`
    *[_type == "crypto" && _id == $id][0] {
      _id,
      _createdAt,
      symbol,
      name,
      price,
      description,
      change24h,
      expectedROI,
      riskLevel,
      minInvestment,
      marketCap,
      // Custom projection to get the direct image URL and rename it
      "logoUrl": logo.asset->url,
    }
  `;

  try {
    // The 'await sanityClient.fetch(query)' will return data matching ICrypto[]
    const crypto: ICrypto = await sanityClient.fetch(query, { id: params.id });
    return crypto;
  } catch (error) {
    console.error('Failed to fetch crypto plans:', error);
    return null;
  }
};
