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
  role: UserRole;
  permissions: Permission[];
  lastLogin: string;
  status: 'Active' | 'Suspended' | 'Banned';
  is_admin?: boolean; // Legacy field, will be removed
}

export type UserRole = 'admin' | 'agent' | 'investor' | 'user';

export type Permission =
  | 'manage_users'
  | 'manage_properties'
  | 'manage_investments'
  | 'manage_transactions'
  | 'view_reports'
  | 'manage_crypto'
  | 'manage_agents'
  | 'view_analytics';

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
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

// Referral Types
export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  status: 'pending' | 'registered' | 'invested' | 'completed';
  commission_amount: number;
  commission_paid: boolean;
  first_investment_amount?: number;
  first_investment_date?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  referee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  registeredReferrals: number;
  investedReferrals: number;
  completedReferrals: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  referralCode: string;
  referralLink: string;
}

export interface ReferralCommission {
  referral_id: string;
  amount: number;
  description: string;
  paid: boolean;
  created_at: string;
}

// Reports and Moderation Types
export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  content_type: 'property' | 'comment' | 'user_profile' | 'investment' | 'crypto';
  content_id: string;
  reason: 'spam' | 'harassment' | 'inappropriate_content' | 'scam' | 'copyright_violation' | 'other';
  description?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  admin_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  reporter?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  reported_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ModerationQueueItem {
  id: string;
  content_type: 'property' | 'comment' | 'user_profile' | 'investment' | 'crypto';
  content_id: string;
  flagged_by?: string;
  flag_reason: 'automated' | 'user_report' | 'admin_review';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'removed';
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  content?: any; // The actual content being moderated
  flagged_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ModerationAction {
  id: string;
  moderation_id: string;
  report_id?: string;
  action_type: 'approve' | 'reject' | 'remove' | 'warn' | 'suspend' | 'ban' | 'content_edit';
  action_details?: Record<string, any>;
  performed_by: string;
  created_at: string;
  performed_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ReportsStats {
  totalReports: number;
  pendingReports: number;
  investigatingReports: number;
  resolvedReports: number;
  dismissedReports: number;
  moderationQueueItems: number;
  pendingModerationItems: number;
  criticalItems: number;
}
