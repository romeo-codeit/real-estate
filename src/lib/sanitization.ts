import validator from 'validator';

export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks (basic implementation)
   */
  static sanitizeHTML(dirty: string): string {
    if (typeof dirty !== 'string') return '';

    // Basic HTML sanitization - remove script tags and dangerous elements
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<[^>]*>/g, '') // Remove all HTML tags for now (can be made more permissive later)
      .trim();
  }

  /**
   * Sanitize plain text by removing potentially dangerous characters
   */
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') return '';

    return validator.escape(input.trim());
  }

  /**
   * Sanitize email addresses
   */
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';

    const sanitized = validator.normalizeEmail(email.trim(), {
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false,
    });

    return sanitized || '';
  }

  /**
   * Sanitize usernames (alphanumeric, hyphens, underscores only)
   */
  static sanitizeUsername(username: string): string {
    if (typeof username !== 'string') return '';

    return username.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
  }

  /**
   * Sanitize general text input (remove script tags, etc.)
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';

    // Remove script tags and other potentially dangerous content
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();

    // Escape HTML entities
    sanitized = validator.escape(sanitized);

    return sanitized;
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: any): number | null {
    if (typeof input === 'number' && !isNaN(input)) {
      return input;
    }

    if (typeof input === 'string') {
      const parsed = parseFloat(input);
      return !isNaN(parsed) ? parsed : null;
    }

    return null;
  }

  /**
   * Sanitize integer input
   */
  static sanitizeInteger(input: any): number | null {
    if (typeof input === 'number' && Number.isInteger(input)) {
      return input;
    }

    if (typeof input === 'string') {
      const parsed = parseInt(input, 10);
      return !isNaN(parsed) ? parsed : null;
    }

    return null;
  }

  /**
   * Sanitize boolean input
   */
  static sanitizeBoolean(input: any): boolean {
    if (typeof input === 'boolean') return input;
    if (typeof input === 'string') {
      return input.toLowerCase() === 'true' || input === '1';
    }
    if (typeof input === 'number') return input === 1;

    return false;
  }

  /**
   * Sanitize URL
   */
  static sanitizeURL(url: string): string {
    if (typeof url !== 'string') return '';

    try {
      const sanitized = validator.escape(url.trim());
      return validator.isURL(sanitized, {
        protocols: ['http', 'https'],
        require_protocol: true,
      }) ? sanitized : '';
    } catch {
      return '';
    }
  }

  /**
   * Sanitize object recursively
   */
  static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return this.sanitizeInput(obj);
    if (typeof obj === 'number') return this.sanitizeNumber(obj);
    if (typeof obj === 'boolean') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip dangerous keys
        if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;

        sanitized[this.sanitizeInput(key)] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Validate and sanitize common form fields
   */
  static sanitizeFormData(formData: FormData): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        // Special handling for different field types
        if (key.toLowerCase().includes('email')) {
          sanitized[key] = this.sanitizeEmail(value);
        } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
          sanitized[key] = this.sanitizeURL(value);
        } else if (key.toLowerCase().includes('username') || key.toLowerCase().includes('handle')) {
          sanitized[key] = this.sanitizeUsername(value);
        } else if (key.toLowerCase().includes('description') || key.toLowerCase().includes('content') || key.toLowerCase().includes('bio')) {
          sanitized[key] = this.sanitizeHTML(value);
        } else {
          sanitized[key] = this.sanitizeInput(value);
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}