export interface Property {
  _id?: string;
  id?: string;
  title: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number; // in sqft
  mainImage?: string;
  image?: string;
  gallery?: string[];
  images?: string[];
  isFeatured?: boolean;
  featured?: boolean;
  propertyType?: string;
  type?: string;
  description: string;
  amenities?: string[];
  agentId?: string;
  data_ai_hint?: string;
  agent?: any;
}

export type IProperty = {
  _id: string;
  address: string;
  isFeatured: boolean;
  agent: {
    _id: string;
    name: string;
    profilePhoto: null | {
      asset: {
        url: string;
      };
    };
    title: string;
  };
  area: number;
  bathrooms: number;
  bedrooms: number;
  mainImage: {
    alt: string;
    asset: {
      url: string;
    } | null;
  };
  price: number;
  propertyType: {
    title: string;
  };
  title: string;
};

export type ISingleProperty = {
  _id: string;
  title: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  isFeatured: boolean;
  amenities: string[];

  propertyType: {
    _id: string;
    title: string;
  };

  agent: {
    _id: string;
    name: string;
    title: string;
    email: string;
    phoneNumber: string;
    numberOfProperties: number;
    profilePhoto: {
      asset: {
        _id: string;
        url: string;
        metadata: {
          lqip?: string;
          dimensions: {
            width: number;
            height: number;
          };
        };
      };
    } | null;
  } | null;

  mainImage: {
    asset: {
      _id: string;
      url: string;
      metadata: {
        lqip?: string;
        dimensions: {
          width: number;
          height: number;
        };
      };
    };
    alt?: string;
  };

  gallery?: {
    asset: {
      _id: string;
      url: string;
      metadata: {
        lqip?: string;
        dimensions: {
          width: number;
          height: number;
        };
      };
    };
    alt?: string;
  }[];
};

// Investment type used by crypto flow and can be mapped to Supabase 'investments'
export type IInvestment = {
  amountInvested: number;
  currentValue?: number;
  expectedROI?: number;
  growthRate?: number;
  trend?: 'stable' | 'bullish' | 'bearish' | string;
  riskLevel?: 'low' | 'medium' | 'high' | string;
  startDate?: string;
  endDate?: string | null;
  profitOrLoss?: number;
  type: 'crypto' | 'real_estate' | string;
  status: 'pending' | 'confirmed' | 'failed' | string;
  planId?: string;
  targetId?: string;
  userId: string;
};

export interface IAgent {
  _id: string;
  _createdAt: string; // ISO date string
  profilePhotoUrl?: string;
  name: string;
  title: string;
  numberOfProperties: number;
  email: string;
  phoneNumber: string;
}

export type IArticle = {
  _id: string;
  title: string;
  link: string;
  description: string;
  dateCreated: string;
  mainImage: {
    asset: {
      url: string;
    };
  };
};

export interface Agent {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  image: string;
  propertiesCount: number;
  data_ai_hint?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  comment: string;
  image: string;
  data_ai_hint?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'User' | 'Admin';
  lastLogin: string;
  status: 'Active' | 'Suspended' | 'Banned';
}

export type IPlan = {
  popular: any;
  price: string;
  _id: string;
  _createdAt: string;
  name: string;
  priceRange: {
    minPrice: number;
    maxPrice: number;
  };
  features: string[];
};

// lib/types.ts (or wherever your IArticle is defined)

// Based on your 'crypto' schema
export interface ICrypto {
  _id: string;
  _createdAt: string; // Sanity internal field
  symbol: string;
  name: string;
  price: number | null; // Use | null since 'number' is not validated as required
  description: string | null; // Use | null for optional fields
  change24h: number | null;
  expectedROI: number | null;
  riskLevel: 'Low' | 'Medium' | 'High' | null;
  minInvestment: number;
  marketCap: string;
  logoUrl: string | null; // This will hold the logo's direct URL
}
