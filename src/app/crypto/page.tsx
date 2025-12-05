import { Button } from '@/components/ui/button';
import { ICrypto } from '@/lib/types';
import { getCryptos } from '@/services/sanity/crypto.sanity';
import { formatAmount } from '@/lib/helpers';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const Crypto = async () => {
  const cryptoItems = await getCryptos();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Return to previous page</span>
        </Button>
      </div>
      <div className="bg-gray-700 text-white p-8 rounded-lg mb-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Browse Crypto assets</h1>
        <p className="text-lg text-gray-300 mb-6">
          Find the perfect crypto asset to invest in
        </p>
        {/* <SearchFilters /> */}
      </div>

      {cryptoItems.length === 0 ? (
        <div>
          <div className="text-center py-12 col-span-full">
            <h2 className="text-2xl">No Crypto assets found</h2>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left">Symbol</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Price</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">24h Change</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Expected ROI</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Risk Level</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Min. Investment</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Market Cap</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {cryptoItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2 font-bold">{item.symbol}</td>
                    <td className="border border-gray-200 px-4 py-2">{item.name}</td>
                    <td className="border border-gray-200 px-4 py-2">${item.price}</td>
                    <td className="border border-gray-200 px-4 py-2">{item.change24h}%</td>
                    <td className="border border-gray-200 px-4 py-2">+{item.expectedROI}%</td>
                    <td className="border border-gray-200 px-4 py-2">{item.riskLevel}</td>
                    <td className="border border-gray-200 px-4 py-2">{formatAmount(item.minInvestment || 0)}</td>
                    <td className="border border-gray-200 px-4 py-2">{formatAmount(+item?.marketCap || 0)}B</td>
                    <td className="border border-gray-200 px-4 py-2">
                      <Link href={`/crypto/${item._id}`}>
                        <Button>Invest</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Crypto;
