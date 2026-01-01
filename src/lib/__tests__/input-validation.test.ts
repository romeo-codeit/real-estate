import { describe, it, expect } from 'vitest';
import { InputValidators, ValidationSchemas } from '../validation';

describe('Input Validation Improvements', () => {
    describe('InputValidators.cryptoAddress', () => {
        const schema = InputValidators.cryptoAddress;

        it('should validate valid BTC addresses', async () => {
            // Legacy
            await expect(schema.parseAsync('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).resolves.toBeTruthy();
            // Segwit
            await expect(schema.parseAsync('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).resolves.toBeTruthy();
        });

        it('should validate valid ETH addresses', async () => {
            await expect(schema.parseAsync('0x32Be343B94f860124dD4fE2780668394dBfa1921')).resolves.toBeTruthy();
        });

        it('should reject invalid addresses', async () => {
            await expect(schema.parseAsync('invalid-address')).rejects.toThrow();
            await expect(schema.parseAsync('0xshort')).rejects.toThrow();
        });
    });

    describe('InputValidators.phone', () => {
        const schema = InputValidators.phone;

        it('should validate valid phone numbers and strip formatting', async () => {
            expect(await schema.parseAsync('+1 (555) 123-4567')).toBe('+15551234567');
            expect(await schema.parseAsync('1234567890')).toBe('1234567890');
        });

        it('should reject invalid formatted numbers', async () => {
            await expect(schema.parseAsync('123')).rejects.toThrow(); // Too short
            await expect(schema.parseAsync('abcdefg')).rejects.toThrow();
        });
    });

    describe('InputValidators.metadata', () => {
        const schema = InputValidators.metadata;

        it('should accept valid object', async () => {
            const meta = { key: 'value', nested: { a: 1 } };
            const res = await schema.parseAsync(meta);
            expect(res).toEqual(meta);
        });

        it('should sanitize dangerous keys', async () => {
            const dangerous = { 'safe': 'value', '__proto__': 'hack' };
            const res = await schema.parseAsync(dangerous);
            expect(res).not.toHaveProperty('__proto__');
            expect(res).toHaveProperty('safe');
        });

        it('should reject non-objects', async () => {
            await expect(schema.parseAsync(null)).rejects.toThrow();
            await expect(schema.parseAsync('string')).rejects.toThrow();
            await expect(schema.parseAsync([])).rejects.toThrow();
        });
    });

    describe('Schema Integration', () => {
        it('register schema should use phone validator', async () => {
            const data = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                phone: '+1 555-555-5555'
            };
            const res = await ValidationSchemas.register.parseAsync(data);
            expect(res.phone).toBe('+15555555555');
        });

        it('withdraw schema should valid crypto address', async () => {
            const data = {
                amount: 100,
                currency: 'USD',
                walletAddress: '0x32Be343B94f860124dD4fE2780668394dBfa1921'
            };
            // Cast to match schema expected type if typescript complains, but runtime it's fine
            const res = await ValidationSchemas.withdraw.parseAsync(data as any);
            expect(res.walletAddress).toBe('0x32Be343B94f860124dD4fE2780668394dBfa1921');
        });
    });
});
