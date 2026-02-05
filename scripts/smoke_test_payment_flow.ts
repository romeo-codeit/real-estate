
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function runTest() {
    console.log('Starting Payment Flow Smoke Test...');

    // 1. Create a Test User
    const testEmail = `test-investor-${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    console.log(`Creating test user: ${testEmail}`);

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { first_name: 'Test', last_name: 'Investor' }
    });

    if (authError || !authUser.user) {
        console.error('Failed to create test user:', authError);
        process.exit(1);
    }

    const userId = authUser.user.id;
    console.log(`User created: ${userId}`);

    try {
        // 2. Simulate "Pending" Investment
        console.log('Simulating User Investment (Pending)...');

        // Create Investment Record
        const { data: investment, error: invError } = await supabase
            .from('investments')
            .insert({
                user_id: userId,
                amount_invested: 1000,
                investment_type: 'plan', // Simulating a plan
                roi_rate: 10,
                status: 'pending', // Starts pending
                duration_months: 12
            })
            .select()
            .single();

        if (invError) throw new Error(`Investment creation failed: ${invError.message}`);
        console.log(`Investment created: ${investment.id} (Status: ${investment.status})`);

        // Create Transaction Record (linked to investment)
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                type: 'investment',
                amount: 1000,
                currency: 'USD',
                status: 'pending',
                provider: 'bank_transfer', // Simulate manual payment
                related_object: {
                    investment_id: investment.id,
                    investment_type: 'plan'
                }
            })
            .select()
            .single();

        if (txError) throw new Error(`Transaction creation failed: ${txError.message}`);
        console.log(`Transaction created: ${transaction.id} (Status: ${transaction.status})`);

        // 3. Admin Confirms Payment
        console.log('Simulating Admin Confirmation...');

        // Update Transaction to "completed"
        // We manually simulate what transactionService.updateTransactionStatus does:
        // 1. Update transaction status
        // 2. Trigger side effects (update investment)

        // NOTE: In the real app, the code in `transactionService` handles the side effect.
        // Since we are running outside the app context, we are testing if the *logic* (if we called the service) works.
        // BUT wait, this script does NOT use `transactionService`. It uses direct DB calls.
        // Direct DB calls won't trigger the application-level logic in `transactionService.ts`.
        // The `transactionService` is a TypeScript class, not a database trigger.

        // CRITICAL: Database Triggers vs App Logic.
        // The file `transaction.service.ts` had:
        // `if (status === 'completed' ... ) { await investmentService.activateInvestment(...) }`
        // This is APPLICATION logic.

        // To truly test this, I should import the service. 
        // But importing the service is hard due to aliases ('@/services...').

        // ALTERNATIVE: I will verify that the Database triggers (if any) are working?
        // Looking at schema.sql, there are NO triggers that auto-update investment status when transaction is completed.
        // It relies on the API/Service layer.

        // THEREFORE: The smoke test MUST verify the API logic.
        // I cannot just do direct DB updates. I must invoke the API logic.
        // Since I can't easily import the service due to compilation issues in this script...
        // I should create a comprehensive test file using `vitest` which supports aliases (via tsconfig/vite config).
        // The user has `vitest` configured.

        console.log('Cannot test application logic via direct DB calls. Aborting script to switch to Vitest.');

    } catch (error: any) {
        console.error('Test failed:', error.message);
    } finally {
        // Cleanup
        console.log('Cleaning up user...');
        await supabase.auth.admin.deleteUser(userId);
    }
}

// Ensure the aliases issue is noted.
console.log('This script is a placeholder. Real verification requires Vitest to load app modules.');
runTest();
