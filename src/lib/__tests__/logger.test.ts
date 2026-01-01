import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { redactSensitiveData, Logger } from '../logger';

// Mock error-monitoring module
vi.mock('../error-monitoring', () => ({
  logApiError: vi.fn(),
  logUserAction: vi.fn(),
  logAuthEvent: vi.fn(),
}));

describe('Logger Redaction', () => {
    it('should redact sensitive keys in objects', () => {
        const sensitive = {
            password: 'secret123',
            token: 'eyJh...',
            user: {
                className: 'User',
                apiKey: '123-456'
            },
            safe: 'value'
        };

        const redacted = redactSensitiveData(sensitive);
        expect(redacted.password).toBe('[REDACTED]');
        expect(redacted.token).toBe('[REDACTED]');
        expect(redacted.user.apiKey).toBe('[REDACTED]');
        expect(redacted.safe).toBe('value');
    });

    it('should redact sensitive keys in arrays', () => {
        const arr = [
            { password: '123' },
            { safe: 'ok' }
        ];
        const redacted = redactSensitiveData(arr);
        expect(redacted[0].password).toBe('[REDACTED]');
        expect(redacted[1].safe).toBe('ok');
    });

    it('should redact JWT strings', () => {
        const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        const redacted = redactSensitiveData(jwt);
        expect(redacted).toBe('[REDACTED_JWT]');
    });

    it('should redact credit card numbers', () => {
        const data = { creditCard: '4111111111111111', safe: 'ok' };
        const redacted = redactSensitiveData(data);
        expect(redacted.creditCard).toBe('[REDACTED]');
        expect(redacted.safe).toBe('ok');
    });

    it('should preserve non-sensitive data', () => {
        const data = {
            userId: '123',
            action: 'login',
            timestamp: '2026-01-01T10:30:45Z',
        };
        const redacted = redactSensitiveData(data);
        expect(redacted).toEqual(data);
    });
});

describe('Structured Logger', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as any;
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as any;
        (process.env as any).NODE_ENV = 'development';
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        (process.env as any).NODE_ENV = originalEnv;
    });

    describe('Logger.info', () => {
        it('should log info message in development format', () => {
            Logger.info('Test message');
            expect(consoleLogSpy).toHaveBeenCalled();
            const call = consoleLogSpy.mock.calls[0][0] as string;
            expect(call).toContain('ℹ️');
            expect(call).toContain('INFO');
            expect(call).toContain('Test message');
        });

        it('should log info message in production JSON format', () => {
            (process.env as any).NODE_ENV = 'production';
            Logger.info('Test message', { userId: '123' });
            expect(consoleLogSpy).toHaveBeenCalled();
            const call = consoleLogSpy.mock.calls[0][0] as string;
            const log = JSON.parse(call);
            expect(log.level).toBe('INFO');
            expect(log.message).toBe('Test message');
            expect(log.meta.userId).toBe('123');
        });

        it('should redact sensitive data in production', () => {
            (process.env as any).NODE_ENV = 'production';
            Logger.info('Auth', { userId: '123', password: 'secret123' });
            const call = consoleLogSpy.mock.calls[0][0] as string;
            const log = JSON.parse(call);
            expect(log.meta.password).toBe('[REDACTED]');
            expect(log.meta.userId).toBe('123');
        });
    });

    describe('Logger.error', () => {
        it('should log error message with Error object', () => {
            const error = new Error('Test error');
            Logger.error('Something went wrong', error);
            expect(consoleErrorSpy).toHaveBeenCalled();
            const call = consoleErrorSpy.mock.calls[0][0] as string;
            expect(call).toContain('❌');
            expect(call).toContain('ERROR');
            expect(call).toContain('Something went wrong');
        });

        it('should log error with metadata', () => {
            const error = new Error('DB error');
            Logger.error('Database operation failed', error, { table: 'users' });
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('should output JSON with error details in production', () => {
            (process.env as any).NODE_ENV = 'production';
            const error = new Error('Test error');
            Logger.error('Test error occurred', error);
            const call = consoleErrorSpy.mock.calls[0][0] as string;
            const log = JSON.parse(call);
            expect(log.level).toBe('ERROR');
            expect(log.message).toBe('Test error occurred');
            expect(log.error.name).toBe('Error');
            expect(log.error.message).toBe('Test error');
            // Stack should not be included in production
            expect(log.error.stack).toBeUndefined();
        });

        it('should include stack trace in development', () => {
            const error = new Error('Test error');
            Logger.error('Error in dev', error);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('Logger.warn', () => {
        it('should log warning message', () => {
            Logger.warn('High memory usage');
            expect(consoleLogSpy).toHaveBeenCalled();
            const call = consoleLogSpy.mock.calls[0][0] as string;
            expect(call).toContain('⚠️');
            expect(call).toContain('WARN');
            expect(call).toContain('High memory usage');
        });

        it('should output JSON in production', () => {
            (process.env as any).NODE_ENV = 'production';
            Logger.warn('Warning', { code: 'LOW_BALANCE' });
            const call = consoleLogSpy.mock.calls[0][0] as string;
            const log = JSON.parse(call);
            expect(log.level).toBe('WARN');
            expect(log.message).toBe('Warning');
            expect(log.meta.code).toBe('LOW_BALANCE');
        });
    });

    describe('Logger.debug', () => {
        it('should log debug message in development', () => {
            (process.env as any).NODE_ENV = 'development';
            Logger.debug('Debug info', { cacheKey: 'prop123' });
            expect(consoleLogSpy).toHaveBeenCalled();
            const call = consoleLogSpy.mock.calls[0][0] as string;
            expect(call).toContain('🔍');
            expect(call).toContain('DEBUG');
            expect(call).toContain('Debug info');
        });

        it('should not log debug message in production', () => {
            (process.env as any).NODE_ENV = 'production';
            Logger.debug('Debug info');
            expect(consoleLogSpy).not.toHaveBeenCalled();
        });
    });

    describe('Logger.httpRequest', () => {
        it('should log HTTP request in development format', () => {
            Logger.httpRequest('GET', '/api/properties', 200, 145);
            expect(consoleLogSpy).toHaveBeenCalled();
            const call = consoleLogSpy.mock.calls[0][0] as string;
            expect(call).toContain('📡');
            expect(call).toContain('GET /api/properties');
            expect(call).toContain('200');
            expect(call).toContain('145ms');
        });

        it('should log HTTP request in production JSON format', () => {
            (process.env as any).NODE_ENV = 'production';
            Logger.httpRequest('POST', '/api/invest', 201, 234);
            const call = consoleLogSpy.mock.calls[0][0] as string;
            const log = JSON.parse(call);
            expect(log.level).toBe('INFO');
            expect(log.statusCode).toBe(201);
            expect(log.durationMs).toBe(234);
        });
    });

    describe('Logger.payment', () => {
        it('should log payment event in development', () => {
            Logger.payment('deposit', 'paystack', 50000, 'NGN');
            expect(consoleLogSpy).toHaveBeenCalled();
            const call = consoleLogSpy.mock.calls[0][0] as string;
            expect(call).toContain('💰');
            expect(call).toContain('Payment');
            expect(call).toContain('deposit');
            expect(call).toContain('paystack');
        });

        it('should log payment event in production JSON format', () => {
            (process.env as any).NODE_ENV = 'production';
            Logger.payment('withdrawal', 'crypto', 0.5, 'BTC', { userId: '123' });
            const call = consoleLogSpy.mock.calls[0][0] as string;
            const log = JSON.parse(call);
            expect(log.amount).toBe(0.5);
            expect(log.currency).toBe('BTC');
            expect(log.meta.userId).toBe('123');
        });
    });

    describe('Logger.security', () => {
        it('should log security event in development', () => {
            Logger.security('failed_login', { userId: 'user123' });
            expect(consoleLogSpy).toHaveBeenCalled();
            const call = consoleLogSpy.mock.calls[0][0] as string;
            expect(call).toContain('🔐');
            expect(call).toContain('Security');
            expect(call).toContain('failed_login');
        });

        it('should log security event in production JSON format', () => {
            (process.env as any).NODE_ENV = 'production';
            Logger.security('suspicious_activity', { userId: '123', action: 'rapid_requests' });
            const call = consoleLogSpy.mock.calls[0][0] as string;
            const log = JSON.parse(call);
            expect(log.level).toBe('WARN');
            expect(log.message).toContain('Security');
            expect(log.meta.userId).toBe('123');
        });
    });
});
