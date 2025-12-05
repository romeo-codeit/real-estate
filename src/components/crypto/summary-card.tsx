// components/InvestmentSummaryCard.tsx
import { Badge } from '@/components/ui/badge'; // Assumed shadcn/ui Badge component
import React from 'react';

const InvestmentSummaryCard: React.FC = () => {
  const tokenData = {
    symbol: 'MATIC',
    name: 'Polygon',
    price: '$0.89',
    riskLevel: 'High',
    expectedAnnualROI: '+210%',
    marketCap: '$8.7B',
  };

  return (
    <div className="bg-white p-6 rounded-lg w-full">
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-gray-100 text-gray-800 font-bold p-2 px-3 rounded-lg text-sm">
          {tokenData.symbol}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 leading-none">
            {tokenData.name}
          </h3>
          <p className="text-gray-600 text-sm leading-none">
            {tokenData.price}
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Risk Level</span>
          <Badge
            variant="outline"
            className="bg-red-50 text-red-600 border-red-300 px-3 py-1 text-xs"
          >
            {tokenData.riskLevel}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Expected Annual ROI</span>
          <span className="text-green-500 font-medium">
            {tokenData.expectedAnnualROI}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Market Cap</span>
          <span className="font-semibold text-gray-900">
            {tokenData.marketCap}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSummaryCard;
