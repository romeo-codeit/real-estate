import { IAgent } from '@/lib/types';
import { groq } from 'next-sanity';
import { sanityClient } from './sanity-client';

// 1. Define the type for the Agent

// 2. Function to fetch agents with proper typing
export const getFeaturedAgents = async (): Promise<IAgent[]> => {
  const query = groq`
    *[_type== "agent"] | order(_createdAt asc){
      _id,
      _createdAt,
      profilePhotoUrl,
      name,
      title,
      numberOfProperties,
      email,
      phoneNumber,
    }
  `;

  try {
    const agents: IAgent[] = await sanityClient.fetch(query);
    return agents;
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return [];
  }
};
