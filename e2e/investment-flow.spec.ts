import { test, expect } from '@playwright/test';

test.describe('Investment Flow E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Auth
        await page.route('**/auth/v1/token*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'mock-token',
                    user: { id: 'mock-user-123', email: 'test@example.com' }
                }),
            });
        });

        await page.route('**/rest/v1/users*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ id: 'mock-user-123', email: 'test@example.com', status: 'Active', role: 'user' }]),
            });
        });

        // Mock Properties API
        await page.route('**/api/properties*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    properties: [
                        { _id: 'prop-1', title: 'Luxury Villa', price: 500000, description: 'Beautiful villa' }
                    ]
                }),
            });
        });

        // Mock Investment Plans API
        await page.route('**/api/investment-plans*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { id: 'plan-1', name: 'Starter Plan', roi_rate: 6.5, min_investment: 1000 }
                ]),
            });
        });

        // Mock CSRF
        await page.route('**/api/csrf*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ token: 'mock-csrf' }),
            });
        });

        // Mock Invest API
        await page.route('**/api/invest*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true }),
            });
        });
    });

    test('User can invest in a property', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.waitForSelector('input[placeholder="m@example.com"]');
        await page.fill('input[placeholder="m@example.com"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]:has-text("Login")');

        // 2. Go to Invest Page
        await page.waitForURL('/dashboard');
        await page.goto('/dashboard/invest');

        // 3. Select Real Estate (default usually)
        const propertyCard = page.locator('h3:has-text("Real Estate")').locator('..');
        await propertyCard.click();

        // 4. Select a property from dropdown
        // Note: The Select component in Radix might need specific handling
        await page.click('button[role="combobox"]');
        await page.click('text=Luxury Villa');

        // 5. Enter amount
        await page.fill('#amount', '10000');

        // 6. Submit
        await page.click('button:has-text("Make Investment")');

        // 7. Verify Success
        await expect(page.locator('text=Investment Successful')).toBeVisible();
        await page.waitForURL('/dashboard/invested-properties');
    });
});
