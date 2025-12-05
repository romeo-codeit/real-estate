// components/InvestmentForm.tsx

// shadcn/ui components (assuming these are configured)

// schemas/investmentSchema.ts
import CryptoDetails from '@/components/crypto/crypto-details';
import { getSingleCrypto } from '@/services/sanity/crypto.sanity';

export default async function InvestmentForm({ params }: { params: any }) {
  const resolvedParams = await Promise.resolve(params);
  const cryptoData = await getSingleCrypto({ id: resolvedParams.id });

  return <CryptoDetails id={resolvedParams.id} initialData={cryptoData} />;
}
