import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSanityClient } from '@sanity/client';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const sanity = createSanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2023-01-01',
  useCdn: false,
});

async function checkDatabase() {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return { status: error ? 'unhealthy' : 'healthy', error: error?.message };
  } catch (err) {
    return { status: 'unhealthy', error: (err as Error).message };
  }
}

async function checkPaystack() {
  try {
    const response = await fetch('https://api.paystack.co/transaction/verify/test_txn', {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });
    return { status: response.ok ? 'healthy' : 'unhealthy', error: response.ok ? null : `HTTP ${response.status}` };
  } catch (err) {
    return { status: 'unhealthy', error: (err as Error).message };
  }
}

async function checkPayPal() {
  try {
    // Use PayPal's status endpoint or a simple API call
    const response = await fetch('https://api.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    return { status: response.ok ? 'healthy' : 'unhealthy', error: response.ok ? null : `HTTP ${response.status}` };
  } catch (err) {
    return { status: 'unhealthy', error: (err as Error).message };
  }
}

async function checkSanity() {
  try {
    await sanity.fetch('*[_type == "property"][0]');
    return { status: 'healthy' };
  } catch (err) {
    return { status: 'unhealthy', error: (err as Error).message };
  }
}

export async function GET() {
  const [db, paystack, paypal, sanity] = await Promise.all([
    checkDatabase(),
    checkPaystack(),
    checkPayPal(),
    checkSanity(),
  ]);

  const overallStatus = [db, paystack, paypal, sanity].every(dep => dep.status === 'healthy') ? 'healthy' : 'unhealthy';

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    service: 'real-estate-investment-platform',
    dependencies: {
      database: db,
      paystack: paystack,
      paypal: paypal,
      sanity: sanity,
    },
  });
}