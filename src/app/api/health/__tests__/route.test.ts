import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

// Create mock implementations before importing
let mockSupabaseQuery: any;
let mockSanityFetch: any;

// Mock external dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => mockSupabaseQuery),
    })),
  })),
}));

vi.mock('@sanity/client', () => ({
  createClient: vi.fn(() => ({
    fetch: vi.fn((query) => mockSanityFetch(query)),
  })),
}));

// Mock fetch for payment gateways
global.fetch = vi.fn();

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks for Supabase and Sanity
    mockSupabaseQuery = {
      limit: vi.fn(() => Promise.resolve({ error: null })),
    };
    mockSanityFetch = vi.fn(() => Promise.resolve([]));
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns healthy status when all dependencies are healthy', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('healthy');
    expect(data.service).toBe('real-estate-investment-platform');
    expect(data.dependencies).toBeDefined();
    expect(data.dependencies.database.status).toBe('healthy');
    expect(data.dependencies.paystack.status).toBe('healthy');
    expect(data.dependencies.paypal.status).toBe('healthy');
    expect(data.dependencies.sanity.status).toBe('healthy');
  });

  it('returns unhealthy status when database fails', async () => {
    // Mock database failure
    mockSupabaseQuery = {
      limit: vi.fn(() => Promise.resolve({ error: { message: 'DB error' } })),
    };

    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('unhealthy');
    expect(data.dependencies.database.status).toBe('unhealthy');
    expect(data.dependencies.database.error).toBe('DB error');
  });

  it('returns unhealthy status when Paystack fails', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('paystack')) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({ ok: true, status: 200 });
    });

    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('unhealthy');
    expect(data.dependencies.paystack.status).toBe('unhealthy');
    expect(data.dependencies.paystack.error).toBe('HTTP 500');
  });

  it('returns unhealthy status when PayPal fails', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('paypal')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ ok: true, status: 200 });
    });

    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('unhealthy');
    expect(data.dependencies.paypal.status).toBe('unhealthy');
    expect(data.dependencies.paypal.error).toBe('Network error');
  });

  it('returns unhealthy status when Sanity fails', async () => {
    // Mock Sanity failure
    mockSanityFetch = vi.fn(() => Promise.reject(new Error('Sanity error')));

    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('unhealthy');
    expect(data.dependencies.sanity.status).toBe('unhealthy');
    expect(data.dependencies.sanity.error).toBe('Sanity error');
  });
});