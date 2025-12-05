import { groq } from 'next-sanity';
import { sanityClient } from './sanity-client';
// Assuming this is the correct path to your client

type GetSinglePropertyParams = {
  id: string; // The _id of the property you want to fetch
};

export const getPropertiesFeatured = async () => {
  const query = groq`
    *[_type == "property" && isFeatured == true] | order(_createdAt desc) [0...3] {
      _id,
      title,
      price,
    address,
      bedrooms,
      bathrooms,
      isFeatured,
      agent->{
        _id, // This is the agent's ID, which is the same as the reference's _ref
        name,
        title,
        profilePhoto{
          asset->{
            url
          }
        }
      },
      area,
      propertyType->{
        title
      },
      mainImage{
        alt,
        asset->{
          url
        }
      }
    }
  `;

  try {
    const properties = await sanityClient.fetch(query);
    return properties;
  } catch (error) {
    console.error('Failed to fetch featured properties:', error);
    return [];
  }
};



export const getAllProperties = async () => {
  const query = groq`
    *[_type == "property"] | order(_createdAt desc) {
      _id,
      title,
      price,
    address,
      bedrooms,
      bathrooms,
      isFeatured,
      agent->{
        _id, // This is the agent's ID, which is the same as the reference's _ref
        name,
        title,
        profilePhoto{
          asset->{
            url
          }
        }
      },
      area,
      propertyType->{
        title
      },
      mainImage{
        asset->{
          url
        }
      }
    }
  `;

  try {
    const properties = await sanityClient.fetch(query);
    return properties;
  } catch (error) {
    console.error('Failed to fetch featured properties:', error);
    return [];
  }
};

export const getSingleProperty = async (params: GetSinglePropertyParams) => {
  const query = groq`
    *[_type == "property" && _id == $id][0] {
      _id,
      title,
      price,
      address,
      bedrooms,
      bathrooms,
      area,
      description,
      isFeatured,
      amenities, // Array of strings
      
      // Dereference propertyType to get its title
      propertyType->{
        _id,
        title
      },
      
      // Dereference agent to get all its details
      agent->{
        _id,
        name,
        title,
        email,
        phoneNumber,
        numberOfProperties,
        profilePhoto{
          asset->{
            _id,
            url,
            // You can add more asset details if needed, e.g., altText, dimensions
            metadata {
              lqip, // Low-quality image placeholder
              dimensions { width, height }
            }
          }
        }
      },
      
      // Main image details
      mainImage{
        asset->{
          _id,
          url,
          metadata {
            lqip,
            dimensions { width, height }
          }
        },
        alt // Include alt text from the image field itself
      },
      
      // Gallery of images
      gallery[]{
        asset->{
          _id,
          url,
          metadata {
            lqip,
            dimensions { width, height }
          }
        },
        alt // Include alt text for each gallery image
      }
    }
  `;

  try {
    const property = await sanityClient.fetch(query, { id: params.id });
    return property;
  } catch (error) {
    console.error(`Failed to fetch property with ID ${params.id}:`, error);
    return null; // Return null or throw an error based on your error handling strategy
  }
};
