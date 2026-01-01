import { logApiError, logUserAction, logAuthEvent } from './error-monitoring';

// List of keys to redact from logs
const SENSITIVE_KEYS = [
    'password', 'passwd', 'pwd',
    'token', 'accessToken', 'refreshToken', 'api_key', 'apiKey', 'secret',
    'authorization', 'auth',
    'creditCard', 'card', 'cvv', 'cc',
    'ssn', 'socialSecurity',
    'dob', 'dateOfBirth',
    'cookie', 'session'
];

/**
 * Redacts sensitive information from objects for logging
 */
export function redactSensitiveData(data: any): any {
    if (!data) return data;

    if (typeof data === 'string') {
        // Basic JWT redaction (looks for eyJ...)
        if (data.includes('eyJ') && data.length > 20) {
            return data.replace(/eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/g, '[REDACTED_JWT]');
        }
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => redactSensitiveData(item));
    }

    if (typeof data === 'object') {
        const redacted: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null && 'toString' in value && typeof value.toString === 'function' && value.constructor !== Object && value.constructor !== Array) {
                // Handle objects like Date, or customized objects if simple serialization is needed
                // But for safety, recursive check is better if it's a plain object
            }

            const lowerKey = key.toLowerCase();
            if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive.toLowerCase()))) {
                redacted[key] = '[REDACTED]';
            } else {
                redacted[key] = redactSensitiveData(value);
            }
        }
        return redacted;
    }

    return data;
}

/**
 * Structured logger - Production-safe with no console output in prod
 * 
 * Output format:
 * - Production: JSON to stdout (for log aggregators like Datadog, CloudWatch)
 * - Development: Human-readable with emojis and colors
 */
export const Logger = {
    info: (message: string, meta?: Record<string, any>) => {
        const safeMeta = redactSensitiveData(meta);
        const timestamp = new Date().toISOString();
        
        if (process.env.NODE_ENV === 'production') {
            // JSON format for log aggregators
            console.log(JSON.stringify({
                timestamp,
                level: 'INFO',
                message,
                ...(safeMeta && { meta: safeMeta })
            }));
        } else {
            // Human-readable for development
            console.log(`ℹ️  [${timestamp}] INFO: ${message}`, safeMeta ? JSON.stringify(safeMeta) : '');
        }
        
        if (meta) logUserAction(message, safeMeta);
    },

    error: (message: string, error?: any, meta?: Record<string, any>) => {
        const safeMeta = redactSensitiveData(meta);
        const timestamp = new Date().toISOString();
        const safeError = error instanceof Error 
            ? { 
                name: error.name,
                message: error.message, 
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
              } 
            : error;

        if (process.env.NODE_ENV === 'production') {
            // JSON format for log aggregators
            console.error(JSON.stringify({
                timestamp,
                level: 'ERROR',
                message,
                error: safeError,
                ...(safeMeta && { meta: safeMeta })
            }));
        } else {
            // Human-readable for development
            console.error(
                `❌ [${timestamp}] ERROR: ${message}`,
                safeError,
                safeMeta ? JSON.stringify(safeMeta) : ''
            );
        }

        // Send to monitoring
        logApiError(message, error);
    },

    warn: (message: string, meta?: Record<string, any>) => {
        const safeMeta = redactSensitiveData(meta);
        const timestamp = new Date().toISOString();

        if (process.env.NODE_ENV === 'production') {
            // JSON format for log aggregators
            console.log(JSON.stringify({
                timestamp,
                level: 'WARN',
                message,
                ...(safeMeta && { meta: safeMeta })
            }));
        } else {
            // Human-readable for development
            console.log(`⚠️  [${timestamp}] WARN: ${message}`, safeMeta ? JSON.stringify(safeMeta) : '');
        }
    },

    debug: (message: string, meta?: Record<string, any>) => {
        if (process.env.NODE_ENV !== 'production') {
            const safeMeta = redactSensitiveData(meta);
            const timestamp = new Date().toISOString();
            console.log(`🔍 [${timestamp}] DEBUG: ${message}`, safeMeta ? JSON.stringify(safeMeta) : '');
        }
    },

    /**
     * Log HTTP request (for middleware/API handlers)
     */
    httpRequest: (method: string, path: string, status: number, durationMs: number, meta?: Record<string, any>) => {
        const timestamp = new Date().toISOString();
        const safeMeta = redactSensitiveData(meta);

        if (process.env.NODE_ENV === 'production') {
            console.log(JSON.stringify({
                timestamp,
                level: 'INFO',
                message: `${method} ${path}`,
                statusCode: status,
                durationMs,
                ...(safeMeta && { meta: safeMeta })
            }));
        } else {
            console.log(`📡 [${timestamp}] ${method} ${path} - ${status} (${durationMs}ms)`);
        }
    },

    /**
     * Log payment event
     */
    payment: (action: string, provider: string, amount: number, currency: string, meta?: Record<string, any>) => {
        const timestamp = new Date().toISOString();
        const safeMeta = redactSensitiveData(meta);

        if (process.env.NODE_ENV === 'production') {
            console.log(JSON.stringify({
                timestamp,
                level: 'INFO',
                message: `Payment: ${action} via ${provider}`,
                amount,
                currency,
                ...(safeMeta && { meta: safeMeta })
            }));
        } else {
            console.log(`💰 [${timestamp}] Payment: ${action} via ${provider} (${amount} ${currency})`);
        }

        logUserAction(`payment_${action}`, { provider, amount, currency, ...safeMeta });
    },

    /**
     * Log security event
     */
    security: (event: string, meta?: Record<string, any>) => {
        const timestamp = new Date().toISOString();
        const safeMeta = redactSensitiveData(meta);

        if (process.env.NODE_ENV === 'production') {
            console.log(JSON.stringify({
                timestamp,
                level: 'WARN',
                message: `Security: ${event}`,
                ...(safeMeta && { meta: safeMeta })
            }));
        } else {
            console.log(`🔐 [${timestamp}] Security: ${event}`, safeMeta ? JSON.stringify(safeMeta) : '');
        }

        logAuthEvent(event, safeMeta);
    }
};
