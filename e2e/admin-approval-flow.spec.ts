import { test, expect } from '@playwright/test';

test.describe('Admin Approval Flow E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Admin Auth and DB
        await page.route('**/auth/v1/token*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'admin-token',
                    user: { id: 'admin-user', email: 'admin@example.com' }
                }),
            });
        });

        await page.route('**/rest/v1/users*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ id: 'admin-user', role: 'admin', status: 'Active' }]),
            });
        });

        // Mock transactions list
        await page.route('**/api/admin/transactions*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    transactions: [
                        {
                            id: 'tx-pending-123',
                            tx_ref: 'REF-001',
                            user_id: 'user-123',
                            amount: 5000,
                            type: 'deposit',
                            status: 'pending',
                            provider: 'crypto',
                            created_at: new Date().toISOString()
                        }
                    ]
                }),
            });
        });

        await page.route('**/api/admin/transactions/approve-crypto', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true }),
            });
        });
    });

    test('Admin can approve a crypto deposit', async ({ page }) => {
        // 1. Admin Login
        await page.goto('/login');
        await page.waitForSelector('input[placeholder="m@example.com"]');
        await page.fill('input[placeholder="m@example.com"]', 'admin@example.com');
        await page.fill('input[type="password"]', 'adminpass');
        await page.click('button[type="submit"]:has-text("Login")');

        // 2. Go to Admin Transactions
        await page.goto('/admin/transactions');

        // 3. Find the pending transaction
        await expect(page.locator('text=REF-001')).toBeVisible();

        // 4. Open Actions
        await page.click('tr:has-text("REF-001") button[variant="ghost"]');

        // 5. Select Approve
        // playwright handles window.confirm and window.prompt
        page.on('dialog', async dialog => {
            if (dialog.type() === 'confirm') {
                await dialog.accept();
            } else if (dialog.type() === 'prompt') {
                await dialog.accept('mock-blockchain-hash-123');
            }
        });

        await page.click('text=Approve Crypto Payment');

        // 6. Verify Success Toast
        await expect(page.locator('text=Success')).toBeVisible();
        await expect(page.locator('text=Crypto payment approved successfully')).toBeVisible();
    });
});
