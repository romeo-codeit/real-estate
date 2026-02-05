
import dotenv from 'dotenv';
import path from 'path';
import { vi } from 'vitest';

// Load real env vars from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Integration Test Setup: Loaded .env');
// Verify we have the key
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('WARNING: SUPABASE_SERVICE_ROLE_KEY not found in .env');
}

// Mock server-only
vi.mock('server-only', () => { return {}; });
