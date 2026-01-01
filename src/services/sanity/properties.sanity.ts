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

export const getFilteredProperties = async (filters: { location?: string; type?: string; priceRange?: string } = {}) => {
  const { location, type, priceRange } = filters;
  const clauses: string[] = ['_type == "property"'];
  const params: Record<string, any> = {};

  if (location) {
    clauses.push('address match $location');
    params.location = `*${location}*`;
  }

  if (type && type !== 'any') {
    // propertyType is a referenced doc; compare by title
    clauses.push('propertyType->title == $type');
    params.type = type;
  }

  if (priceRange && priceRange !== 'any') {
    if (priceRange === '<500k') clauses.push('price < 500000');
    else if (priceRange === '500k-1m') clauses.push('price >= 500000 && price <= 1000000');
    else if (priceRange === '1m-2m') clauses.push('price >= 1000000 && price <= 2000000');
    else if (priceRange === '>2m') clauses.push('price > 2000000');
  }

  const filter = clauses.join(' && ');

  const query = groq`
    *[${filter}] | order(_createdAt desc) {
      _id,
      title,
      price,
      address,
      bedrooms,
      bathrooms,
      isFeatured,
      agent->{ _id, name, title, profilePhoto{ asset->{ url } } },
      area,
      propertyType->{ title },
      mainImage{ asset->{ url } }
    }
  `;

  try {
    const properties = await sanityClient.fetch(query, params);
    return properties;
  } catch (error) {
    console.error('Failed to fetch filtered properties:', error);
    return [];
  }
};

export const getPropertiesCount = async (): Promise<number> => {
  const query = groq`
    count(*[_type == "property"])
  `;

  try {
    const count = await sanityClient.fetch(query);
    return count || 0;
  } catch (error) {
    console.error('Failed to fetch properties count:', error);
    return 0;
  }
};

export const getPropertyById = async (id: string) => {
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
    const property = await sanityClient.fetch(query, { id });
    return property;
  } catch (error) {
    console.error(`Failed to fetch property with ID ${id}:`, error);
    return null;
  }
};

// Create a new property
export const createProperty = async (propertyData: any) => {
  try {
    const doc = {
      _type: 'property',
      title: propertyData.title,
      price: propertyData.price,
      address: propertyData.address,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      area: propertyData.area,
      description: propertyData.description,
      isFeatured: propertyData.featured || false,
      amenities: propertyData.amenities || [],
      propertyType: {
        _type: 'reference',
        _ref: propertyData.propertyTypeId // This would need to be resolved
      },
      // Handle images - this would need proper image upload handling
      mainImage: propertyData.mainImage ? {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: propertyData.mainImage
        }
      } : undefined,
      gallery: propertyData.galleryImages ? propertyData.galleryImages.map((img: string) => ({
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: img
        }
      })) : []
    };

    const result = await sanityClient.create(doc);
    return result;
  } catch (error) {
    console.error('Failed to create property:', error);
    throw error;
  }
};

// Update an existing property
export const updateProperty = async (id: string, propertyData: any) => {
  try {
    const doc = {
      title: propertyData.title,
      price: propertyData.price,
      address: propertyData.address,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      area: propertyData.area,
      description: propertyData.description,
      isFeatured: propertyData.featured || false,
      amenities: propertyData.amenities || [],
      // Handle property type update
      ...(propertyData.propertyTypeId && {
        propertyType: {
          _type: 'reference',
          _ref: propertyData.propertyTypeId
        }
      }),
      // Handle image updates - this would need proper image handling
      ...(propertyData.mainImage && {
        mainImage: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: propertyData.mainImage
          }
        }
      }),
      ...(propertyData.galleryImages && {
        gallery: propertyData.galleryImages.map((img: string) => ({
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: img
          }
        }))
      })
    };

    const result = await sanityClient.patch(id).set(doc).commit();
    return result;
  } catch (error) {
    console.error('Failed to update property:', error);
    throw error;
  }
};

// Delete a property
export const deleteProperty = async (id: string) => {
  try {
    await sanityClient.delete(id);
    return true;
  } catch (error) {
    console.error('Failed to delete property:', error);
    throw error;
  }
};
