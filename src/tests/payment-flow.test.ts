
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TransactionService } from '@/services/supabase/transaction.service';
import { InvestmentService } from '@/services/supabase/investment.service';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';

// Re-instantiate services with ADMIN client to avoid RLS issues in test environment
const transactionService = new TransactionService(supabaseAdmin);
const investmentService = new InvestmentService(supabaseAdmin);

describe('Manual Payment & Investment Flow Smoke Test', () => {
    let testUserId: string;
    const testEmail = `smoke-test-${Date.now()}@example.com`;
    let usedExistingUser = false;

    beforeAll(async () => {
        // Verify connection
        console.log('Verifying Supabase Connection...');
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (listError) {
            console.error('Connection Check Failed:', listError);
            throw new Error(`Connection Check Failed: ${listError.message}`);
        }
        console.log('Connection OK. Found users:', users?.users?.length ?? 0);

        // Try to create a test user
        console.log(`Creating test user: ${testEmail}`);
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: testEmail,
            email_confirm: true,
            password: 'TestPassword123!',
            user_metadata: { first_name: 'Smoke', last_name: 'Test' }
        });

        if (error) {
            console.warn('Create User Failed:', error.message);
            console.warn('Attempting to use existing user...');

            if (users?.users?.length > 0) {
                testUserId = users.users[0].id;
                usedExistingUser = true;
                console.log(`Using existing user: ${testUserId}`);
            } else {
                throw new Error(`Failed to create user and no existing users found: ${error.message}`);
            }
        } else if (data.user) {
            testUserId = data.user.id;
            console.log(`Created test user: ${testUserId}`);
        } else {
            throw new Error('User creation returned no data');
        }

        // Wait a bit for triggers to populate public.users if we created a new one
        if (!usedExistingUser) {
            let retries = 10;
            while (retries > 0) {
                const { data: profile, error: profileError } = await supabaseAdmin.from('users').select('*').eq('id', testUserId).single();
                if (profile) {
                    console.log('Public profile found.');
                    break;
                }
                if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is 'not found'
                    console.warn('Error checking profile:', profileError);
                }
                await new Promise(r => setTimeout(r, 1000));
                retries--;
            }
        }
    });

    afterAll(async () => {
        if (testUserId && !usedExistingUser) {
            console.log(`Deleting test user: ${testUserId}`);
            await supabaseAdmin.auth.admin.deleteUser(testUserId);
        }
    });

    it('should correctly activate an investment when transaction is confirmed by admin', async () => {
        const amount = 500;
        const investmentType = 'plan';

        // 1. User initiates Investment (Pending)
        console.log('Creating pending investment (Direct DB)...');

        const { data: investment, error: invError } = await supabaseAdmin
            .from('investments')
            .insert({
                user_id: testUserId,
                amount_invested: amount,
                investment_type: investmentType,
                roi_rate: 10,
                duration_months: 12,
                status: 'pending',
                start_date: null
            })
            .select()
            .single();

        if (invError) {
            throw new Error(`Failed to create investment directly: ${invError.message}`);
        }

        expect(investment).toBeDefined();
        expect(investment!.status).toBe('pending');
        expect(investment!.start_date).toBeNull();

        // 2. User creates Transaction (Pending)
        console.log('Creating pending transaction...');
        const manualTxnId = `manual-${Date.now()}`;

        const transaction = await transactionService.createTransaction({
            user_id: testUserId,
            type: 'investment',
            amount: amount,
            currency: 'USD',
            status: 'pending',
            provider: 'bank_transfer',
            provider_txn_id: manualTxnId,
            related_object: {
                investment_id: investment!.id,
                investment_type: investmentType
            }
        });

        expect(transaction).toBeDefined();
        expect(transaction.status).toBe('pending');

        // 3. Admin Confirms Payment
        console.log('Confirming transaction (Admin Action)...');

        const updatedTransaction = await transactionService.updateTransactionStatus(
            testUserId,
            manualTxnId, // Use the ID we set
            'completed',
            {
                source: 'manual_confirm',
                method: 'bank_transfer',
                note: 'Smoke Test Confirmation'
            }
        );

        expect(updatedTransaction.status).toBe('completed');

        // 4. Verify Side Effects
        console.log('Verifying investment activation...');
        const updatedInvestment = await investmentService.getInvestmentById(investment!.id);

        expect(updatedInvestment).toBeDefined();
        expect(updatedInvestment.status).toBe('active');
        expect(updatedInvestment.start_date).not.toBeNull();

        const startDate = new Date(updatedInvestment.start_date!);
        const now = new Date();
        const diffMs = Math.abs(now.getTime() - startDate.getTime());
        expect(diffMs).toBeLessThan(60000);

        console.log('Smoke Test Passed: Investment automatically activated upon transaction completion.');
    });
});
