import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '../lib/csrf';

/**
 * CSRF Protection Middleware for Next.js API routes
 * This should be used in API routes that handle state-changing operations
 */
export async function withCSRFProtection(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    userId?: string;
  } = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    // Validate CSRF token
    const csrfResult = await CSRFProtection.validateRequest(request, options.userId);

    if (!csrfResult.valid) {
      return csrfResult.response!;
    }

    // Call the original handler
    return handler(request, context);
  };
}

/**
 * Get CSRF token for client-side usage
 * This can be called from API routes to provide tokens to the frontend
 */
export async function getCSRFToken(userId?: string): Promise<string> {
  return CSRFProtection.createToken(userId);
}

/**
 * CSRF cleanup utility - should be called periodically
 */
export function cleanupCSRF(): void {
  CSRFProtection.cleanup();
}