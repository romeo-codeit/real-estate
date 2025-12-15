// components/InvestmentForm.tsx

// shadcn/ui components (assuming these are configured)

// schemas/investmentSchema.ts
import CryptoDetails from '@/components/crypto/crypto-details';
import { getSingleCrypto } from '@/services/sanity/crypto.sanity';

export default async function InvestmentForm({ params }: { params: any }) {
  const resolvedParams = await Promise.resolve(params);

  let cryptoData = null;
  try {
    cryptoData = await getSingleCrypto({ id: resolvedParams.id });
  } catch (error) {
    console.error('Failed to fetch crypto data:', error);
  }

  return <CryptoDetails id={resolvedParams.id} initialData={cryptoData} />;
}
