import { vi } from 'vitest';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-key';
process.env.PAYSTACK_SECRET_KEY = 'mock-paystack-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock server-only to prevent errors in test environment
vi.mock('server-only', () => { return {}; });

// Mock console methods to reduce noise during tests (optional)
// global.console.log = vi.fn();
// global.console.error = vi.fn();
