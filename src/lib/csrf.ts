import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_NAME = 'csrf-token';
  private static readonly HEADER_NAME = 'x-csrf-token';

  /**
   * Generate a new CSRF token
   */
  static generateToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Store CSRF token in session/storage (simplified version)
   * In production, this should be stored in a secure session store
   */
  static storeToken(token: string, userId?: string): void {
    // For now, we'll use a simple in-memory store
    // In production, use Redis or database
    if (!global.csrfTokens) {
      global.csrfTokens = new Map();
    }
    const key = userId || 'anonymous';
    global.csrfTokens.set(key, {
      token,
      expires: Date.now() + (60 * 60 * 1000), // 1 hour
    });
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string, userId?: string): boolean {
    if (!global.csrfTokens) return false;

    const key = userId || 'anonymous';
    const stored = global.csrfTokens.get(key);

    if (!stored) return false;

    // Check if token is expired
    if (Date.now() > stored.expires) {
      global.csrfTokens.delete(key);
      return false;
    }

    return stored.token === token;
  }

  /**
   * Extract CSRF token from request
   */
  static extractToken(request: NextRequest): string | null {
    // Try header first
    const headerToken = request.headers.get(this.HEADER_NAME);
    if (headerToken) return headerToken;

    // Try body (for JSON requests)
    try {
      const body = request.body;
      if (body && typeof body === 'object' && body[this.TOKEN_NAME]) {
        return body[this.TOKEN_NAME];
      }
    } catch {
      // Ignore body parsing errors
    }

    // Try form data
    try {
      const formData = request.formData();
      const token = formData.get(this.TOKEN_NAME);
      if (typeof token === 'string') return token;
    } catch {
      // Ignore form data parsing errors
    }

    return null;
  }

  /**
   * Middleware function to validate CSRF tokens on state-changing requests
   */
  static async validateRequest(request: NextRequest, userId?: string): Promise<{ valid: boolean; response?: NextResponse }> {
    // Only validate state-changing methods
    const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!methods.includes(request.method)) {
      return { valid: true };
    }

    // Skip validation for certain paths (webhooks, public APIs)
    const skipPaths = [
      '/api/webhooks/',
      '/api/auth/',
      '/api/public/',
    ];

    if (skipPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
      return { valid: true };
    }

    const token = this.extractToken(request);
    if (!token) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'CSRF token missing' },
          { status: 403 }
        )
      };
    }

    if (!this.validateToken(token, userId)) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'CSRF token invalid or expired' },
          { status: 403 }
        )
      };
    }

    return { valid: true };
  }

  /**
   * Get CSRF token for client-side usage
   */
  static getToken(userId?: string): string | null {
    if (!global.csrfTokens) return null;

    const key = userId || 'anonymous';
    const stored = global.csrfTokens.get(key);

    if (!stored || Date.now() > stored.expires) {
      return null;
    }

    return stored.token;
  }

  /**
   * Create new token and return it
   */
  static createToken(userId?: string): string {
    const token = this.generateToken();
    this.storeToken(token, userId);
    return token;
  }

  /**
   * Clean up expired tokens (should be called periodically)
   */
  static cleanup(): void {
    if (!global.csrfTokens) return;

    const now = Date.now();
    for (const [key, stored] of global.csrfTokens.entries()) {
      if (now > stored.expires) {
        global.csrfTokens.delete(key);
      }
    }
  }
}

// Extend global type for TypeScript
declare global {
  var csrfTokens: Map<string, { token: string; expires: number }> | undefined;
}