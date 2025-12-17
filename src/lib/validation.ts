import { z } from 'zod';
import { InputSanitizer } from './sanitization';

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
    phone: z.string().optional().transform(val => val ? InputSanitizer.sanitizeInput(val) : val),
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
    amount: z.number().positive().max(100000), // Max $100k per deposit
    currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
    paymentMethod: z.string().min(1).max(50).transform(InputSanitizer.sanitizeInput),
  }),

  withdraw: z.object({
    amount: z.number().positive().max(50000), // Max $50k per withdrawal
    currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
    walletAddress: z.string().min(20).max(100).transform(InputSanitizer.sanitizeInput),
  }),

  invest: z.object({
    amount: z.number().positive().max(100000), // Max $100k per investment
    investmentType: z.enum(['property', 'crypto', 'plan']),
    targetId: z.string().min(1).max(100).transform(InputSanitizer.sanitizeInput),
    durationMonths: z.number().int().min(1).max(120).optional(),
    currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
    paymentMethod: z.enum(['stripe', 'paypal', 'paystack', 'crypto']).default('crypto'),
  }),

  // Admin operations
  updateUser: z.object({
    userId: z.string().min(1).max(100).transform(InputSanitizer.sanitizeInput),
    role: z.enum(['admin', 'agent', 'investor', 'user']).optional(),
    status: z.enum(['Active', 'Suspended', 'Banned']).optional(),
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
    action: z.enum(['refund', 'adjust']),
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