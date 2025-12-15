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

// Function to fetch a single agent by ID
export const getAgentById = async (id: string): Promise<IAgent | null> => {
  const query = groq`
    *[_type == "agent" && _id == $id][0]{
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
    const agent: IAgent | null = await sanityClient.fetch(query, { id });
    return agent;
  } catch (error) {
    console.error('Failed to fetch agent:', error);
    return null;
  }
};
