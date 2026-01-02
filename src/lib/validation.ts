import { z } from 'zod';
import { InputSanitizer } from './sanitization';

// Investment limits configuration
export const INVESTMENT_LIMITS = {
  // Global limits
  GLOBAL_MIN: 10,           // $10 minimum for any investment
  GLOBAL_MAX: 1000000,      // $1M maximum for any single investment
  DEPOSIT_MIN: 10,          // $10 minimum deposit
  DEPOSIT_MAX: 100000,      // $100k maximum deposit
  WITHDRAW_MIN: 10,         // $10 minimum withdrawal
  WITHDRAW_MAX: 50000,      // $50k maximum withdrawal per request
  // Type-specific defaults (can be overridden by plan settings)
  CRYPTO_MIN: 50,           // $50 minimum for crypto investments
  PROPERTY_MIN: 100,        // $100 minimum for property investments
  PLAN_MIN: 100,            // $100 minimum for plan investments (overridden by plan)
} as const;

// Withdrawal limits based on KYC status
export const WITHDRAWAL_LIMITS = {
  // Daily limits by KYC status
  NONE: {
    daily: 1000,           // $1000/day without KYC
    perTransaction: 500,   // $500 per transaction
    requiresApproval: 500, // Above $500 requires admin approval
  },
  PENDING: {
    daily: 1000,           // Same as none while pending
    perTransaction: 500,
    requiresApproval: 500,
  },
  VERIFIED: {
    daily: 50000,          // $50k/day with KYC
    perTransaction: 25000, // $25k per transaction
    requiresApproval: 10000, // Above $10k requires admin approval
  },
  REJECTED: {
    daily: 0,              // No withdrawals if KYC rejected
    perTransaction: 0,
    requiresApproval: 0,
  },
} as const;

// KYC requirement thresholds
export const KYC_THRESHOLDS = {
  REQUIRE_FOR_WITHDRAWAL_ABOVE: 5000,  // Require KYC for withdrawals above $5k
  REQUIRE_FOR_TOTAL_ABOVE: 10000,      // Require KYC if total withdrawn exceeds $10k
} as const;

// Reusable strict validators
export const InputValidators = {
  // Crypto Addresses (BTC, ETH, etc.)
  cryptoAddress: z.string().refine((val) => {
    // Basic regex for common chains
    const btcRegex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/;
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    const genericRegex = /^[a-zA-Z0-9]{20,60}$/; // Fallback for other chains
    return btcRegex.test(val) || ethRegex.test(val) || genericRegex.test(val);
  }, 'Invalid crypto wallet address format').transform(InputSanitizer.sanitizeInput),

  // Phone Number (International format preferred, or local)
  phone: z.string().refine((val) => {
    // Allows +, spaces, hyphens, digits. Min 7, max 15 digits effectively.
    // E.164 generally: ^\+[1-9]\d{1,14}$
    // Looser regex to allow user formatting, but check digit count
    const digits = val.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }, 'Invalid phone number format').transform((val) => {
    // Strip all non-digits/non-plus
    return val.replace(/[^0-9+]/g, '');
  }),

  // Safe Metadata (JSON object)
  metadata: z.record(z.string(), z.unknown()).refine((obj) => {
    // Check depth or size if needed, for now just ensure it's a plain object
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
  }, 'Invalid metadata object').transform((obj) => {
    return InputSanitizer.sanitizeObject(obj);
  }),
};

// Common validation schemas
export const ValidationSchemas = {
  // User authentication
  login: z.object({
    email: z.string().email().transform(InputSanitizer.sanitizeEmail),
    password: z.string().min(8).max(128),
  }),

  register: z.object({
    email: z.string().email().transform(InputSanitizer.sanitizeEmail),
    password: z.string().min(8).max(128),
    firstName: z.string().min(1).max(50).transform(InputSanitizer.sanitizeText),
    lastName: z.string().min(1).max(50).transform(InputSanitizer.sanitizeText),
    phone: InputValidators.phone.optional(),
  }),

  // Property management
  createProperty: z.object({
    title: z.string().min(1).max(200).transform(InputSanitizer.sanitizeText),
    description: z.string().min(10).max(5000).transform(InputSanitizer.sanitizeHTML),
    price: z.number().positive().max(100000000), // Max 100M
    address: z.string().min(1).max(500).transform(InputSanitizer.sanitizeText),
    bedrooms: z.number().int().min(0).max(50),
    bathrooms: z.number().min(0).max(50),
    area: z.number().positive().max(100000), // Max 100k sq ft
    type: z.enum(['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial']),
    featured: z.boolean().default(false),
    amenities: z.array(z.string().transform(InputSanitizer.sanitizeText)).default([]),
  }),

  updateProperty: z.object({
    title: z.string().min(1).max(200).transform(InputSanitizer.sanitizeText).optional(),
    description: z.string().min(10).max(5000).transform(InputSanitizer.sanitizeHTML).optional(),
    price: z.number().positive().max(100000000).optional(),
    address: z.string().min(1).max(500).transform(InputSanitizer.sanitizeText).optional(),
    bedrooms: z.number().int().min(0).max(50).optional(),
    bathrooms: z.number().min(0).max(50).optional(),
    area: z.number().positive().max(100000).optional(),
    type: z.enum(['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial']).optional(),
    featured: z.boolean().optional(),
    amenities: z.array(z.string().transform(InputSanitizer.sanitizeText)).optional(),
  }),

  // Financial operations
  deposit: z.object({
    amount: z.number()
      .min(INVESTMENT_LIMITS.DEPOSIT_MIN, `Minimum deposit is $${INVESTMENT_LIMITS.DEPOSIT_MIN}`)
      .max(INVESTMENT_LIMITS.DEPOSIT_MAX, `Maximum deposit is $${INVESTMENT_LIMITS.DEPOSIT_MAX.toLocaleString()}`)
      .refine(val => val > 0, 'Amount must be positive'),
    currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
    paymentMethod: z.string().min(1).max(50).transform(InputSanitizer.sanitizeInput),
  }),

  withdraw: z.object({
    amount: z.number()
      .min(INVESTMENT_LIMITS.WITHDRAW_MIN, `Minimum withdrawal is $${INVESTMENT_LIMITS.WITHDRAW_MIN}`)
      .max(INVESTMENT_LIMITS.WITHDRAW_MAX, `Maximum withdrawal is $${INVESTMENT_LIMITS.WITHDRAW_MAX.toLocaleString()}`)
      .refine(val => val > 0, 'Amount must be positive'),
    currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
    walletAddress: InputValidators.cryptoAddress,
  }),

  invest: z.object({
    amount: z.number()
      .min(INVESTMENT_LIMITS.GLOBAL_MIN, `Minimum investment is $${INVESTMENT_LIMITS.GLOBAL_MIN}`)
      .max(INVESTMENT_LIMITS.GLOBAL_MAX, `Maximum investment is $${INVESTMENT_LIMITS.GLOBAL_MAX.toLocaleString()}`)
      .refine(val => val > 0, 'Amount must be positive')
      .refine(val => Number.isFinite(val), 'Amount must be a valid number'),
    investmentType: z.enum(['property', 'crypto', 'plan']),
    targetId: z.string().min(1).max(100).transform(InputSanitizer.sanitizeInput),
    durationMonths: z.number().int().min(1).max(120).optional(),
    currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
    paymentMethod: z.enum(['stripe', 'paypal', 'paystack', 'crypto']).default('crypto'),
  }),

  // Admin operations
  updateUser: z.object({
    userId: z.string().min(1).max(100).transform(InputSanitizer.sanitizeInput),
    role: z.enum(['admin', 'agent', 'user']).optional(),
    status: z.enum(['Active', 'Suspended', 'Banned']).optional(),
    phone: InputValidators.phone.optional(),
    metadata: InputValidators.metadata.optional(),
  }),

  createReport: z.object({
    reportedUserId: z.string().min(1).max(100).transform(InputSanitizer.sanitizeInput),
    contentType: z.enum(['property', 'user', 'comment', 'review']),
    contentId: z.string().min(1).max(100).transform(InputSanitizer.sanitizeInput),
    reason: z.enum(['spam', 'harassment', 'inappropriate', 'fraud', 'other']),
    description: z.string().min(10).max(1000).transform(InputSanitizer.sanitizeText),
  }),

  updateReport: z.object({
    reportId: z.string().min(1).max(100).transform(InputSanitizer.sanitizeInput),
    status: z.enum(['pending', 'investigating', 'resolved', 'dismissed']),
    adminNotes: z.string().max(1000).transform(InputSanitizer.sanitizeText).optional(),
  }),

  // Transaction reconciliation
  reconcileTransaction: z.object({
    transactionId: z.string().min(1).max(100).transform(InputSanitizer.sanitizeInput),
    action: z.enum(['refund', 'adjust', 'cancel']),
    amount: z.number().positive().optional(),
    direction: z.enum(['credit', 'debit']).optional(),
    note: z.string().max(500).transform(InputSanitizer.sanitizeText).optional(),
  }),

  // Webhook events
  webhookEvent: z.object({
    id: z.string().min(1).max(100).transform(InputSanitizer.sanitizeInput),
    action: z.enum(['reprocess']),
  }),

  // General purpose
  idOnly: z.object({
    id: z.string().min(1).max(100).transform(InputSanitizer.sanitizeInput),
  }),

  // Contact/Support
  contact: z.object({
    name: z.string().min(1).max(100).transform(InputSanitizer.sanitizeText),
    email: z.string().email().transform(InputSanitizer.sanitizeEmail),
    subject: z.string().min(1).max(200).transform(InputSanitizer.sanitizeText),
    message: z.string().min(10).max(2000).transform(InputSanitizer.sanitizeText),
  }),
};

// Validation helper functions
export class ValidationHelper {
  /**
   * Validate and sanitize input against a schema
   */
  static async validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
    try {
      const result = await schema.parseAsync(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error };
      }
      throw error;
    }
  }

  /**
   * Validate API request body
   */
  static async validateRequest<T>(
    schema: z.ZodSchema<T>,
    request: Request
  ): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
    try {
      const body = await request.json();
      return this.validate(schema, body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error };
      }
      // If JSON parsing fails, return validation error
      return {
        success: false,
        errors: new z.ZodError([{
          code: 'custom',
          message: 'Invalid JSON',
          path: [],
        }])
      };
    }
  }

  /**
   * Validate FormData
   */
  static async validateFormData<T>(
    schema: z.ZodSchema<T>,
    formData: FormData
  ): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
    try {
      const data = InputSanitizer.sanitizeFormData(formData);
      return this.validate(schema, data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error };
      }
      throw error;
    }
  }
}