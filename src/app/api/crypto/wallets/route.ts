import { NextResponse } from 'next/server';
import cryptoWalletsService from '@/services/supabase/crypto-wallets.service';

export async function GET() {
  try {
    // Get enabled crypto wallets from database
    const wallets = await cryptoWalletsService.getEnabledCryptoWallets();

    // If no wallets configured, check for env var fallback (for backward compatibility)
    if (!wallets || wallets.length === 0) {
      const envAddress = process.env.NEXT_PUBLIC_USDT_WALLET_ADDRESS;
      if (envAddress) {
        return NextResponse.json([
          {
            id: 'env-usdt',
            symbol: 'USDT',
            name: 'Tether (USDT)',
            wallet_address: envAddress,
            enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);
      }
    }

    return NextResponse.json(wallets || []);
  } catch (error) {
    console.error('Error fetching crypto wallets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crypto wallets' },
      { status: 500 }
    );
  }
}
