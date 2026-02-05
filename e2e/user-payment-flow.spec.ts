import { test, expect } from '@playwright/test';

test.describe('Payment Flow E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Supabase Auth and DB calls to bypass regional connectivity issues
        await page.route('**/auth/v1/token*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'mock-token',
                    token_type: 'bearer',
                    expires_in: 3600,
                    user: { id: 'mock-user-123', email: 'test@example.com' }
                }),
            });
        });

        await page.route('**/rest/v1/users*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    id: 'mock-user-123',
                    email: 'test@example.com',
                    status: 'Active',
                    role: 'user'
                }]),
            });
        });

        await page.route('**/rest/v1/transactions*', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ id: 'tx-123', status: 'pending' }),
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([]),
                });
            }
        });

        // Mock payment methods API
        await page.route('**/api/deposit/methods*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { id: 'usdt', name: 'USDT (Tron)', type: 'crypto', enabled: true, processingTime: '10-30m', fees: 0 }
                ]),
            });
        });

        await page.route('**/api/crypto/wallets*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { symbol: 'usdt', wallet_address: 'TMockAddress123456789' }
                ]),
            });
        });

        await page.route('**/api/csrf*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ token: 'mock-csrf' }),
            });
        });
    });

    test('User can initiate a crypto deposit', async ({ page }) => {
        // 1. Login
        await page.goto('/login');

        // Wait for the form to be visible
        await page.waitForSelector('input[placeholder="m@example.com"]');

        await page.fill('input[placeholder="m@example.com"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]:has-text("Login")');

        // 2. Dashboard to Deposit
        await page.waitForURL('/dashboard', { timeout: 10000 });
        await page.goto('/dashboard/deposit');

        // 3. Select Crypto and Amount
        await page.fill('#amount', '5000');

        // Wait for the crypto button and click it
        const cryptoButton = page.locator('button:has-text("USDT")');
        await cryptoButton.waitFor({ timeout: 5000 });
        await cryptoButton.click();

        // 4. Verification Modal
        await expect(page.locator('text=Pay with USDT')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=TMockAddress123456789')).toBeVisible();

        // 5. Confirm
        await page.click('button:has-text("Confirm Deposit")');

        // 6. Check for success message
        await expect(page.locator('text=Deposit Initiated')).toBeVisible({ timeout: 5000 });
    });
});
