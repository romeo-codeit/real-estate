import { IArticle } from '@/lib/types';
import { groq } from 'next-sanity';
import { sanityClient } from './sanity-client';

export const getArticles = async (): Promise<IArticle[]> => {
  const query = groq`
    *[_type == "article"] | order(_createdAt desc) {
      _id,
      title,
      link,
      description,
      dateCreated,
      mainImage{
        asset->{
          url
        }
      }
    }
  `;

  try {
    const articles: IArticle[] = await sanityClient.fetch(query);
    return articles;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return [];
  }
};
