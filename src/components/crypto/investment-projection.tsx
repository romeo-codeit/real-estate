// components/InvestmentProjectionStep.tsx
import { AlertTriangle, FileText } from 'lucide-react';
import React from 'react';

// shadcn/ui components (assuming these are configured)
import { Button } from '@/components/ui/button';

interface InvestmentProjectionStepProps {
  initialInvestment: number; // e.g., 200
  investmentPeriod: '3_months' | '6_months' | '12_months' | '24_months';
  // Handlers for navigation
  onBack: () => void;
  onConfirm: () => void;
}

const InvestmentProjectionStep: React.FC<InvestmentProjectionStepProps> = ({
  initialInvestment,
  investmentPeriod,
  onBack,
  onConfirm,
}) => {
  // --- Data & Calculation Logic ---
  const ANNUAL_ROI_PERCENT = 210; // +210% from the summary card (Polygon)
  const periodMonths = {
    '3_months': 3,
    '6_months': 6,
    '12_months': 12,
    '24_months': 24,
  }[investmentPeriod];

  // Calculate projected values
  const monthlyROI = ANNUAL_ROI_PERCENT / 12; // 17.5% per month
  const totalPeriodROI = monthlyROI * periodMonths; // e.g., 17.5 * 12 = 210%

  // Total Profit = Initial Investment * (Total Period ROI / 100)
  const totalProfit = initialInvestment * (totalPeriodROI / 100);

  // Expected Return = Initial Investment + Total Profit
  const expectedReturn = initialInvestment + totalProfit;

  // --- Utility Functions ---
  const formatCurrency = (amount: number, prefix: boolean = true) =>
    `${prefix && amount > 0 ? '+' : ''}${amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0, // Keep it simple as per image
      maximumFractionDigits: 0,
    })}`;

  const formatPercent = (percent: number) => `+${percent.toFixed(1)}%`;

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Investment Projection Card */}
      <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
        <div className="flex items-center text-lg font-semibold text-gray-800 mb-6">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Investment Projection
        </div>

        {/* Projection Stats */}
        <div className="grid grid-cols-3 gap-4 pb-4 border-b border-dashed border-gray-200">
          <div className="text-gray-500">Initial Investment</div>
          <div className="text-gray-500">Expected Return</div>
          <div className="text-gray-500">Total Profit</div>

          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(initialInvestment, false)}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(expectedReturn, false)}
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalProfit, true)}
          </div>
        </div>

        {/* Monthly ROI */}
        <div className="flex justify-between items-center pt-4">
          <span className="text-gray-500">Average Monthly ROI</span>
          <span className="text-green-600 font-bold">
            {formatPercent(monthlyROI)}
          </span>
        </div>
      </div>

      {/* Investment Disclaimer */}
      <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800 flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold mb-1">Investment Disclaimer</h4>
          <p>
            Cryptocurrency investments involve significant risk. Past
            performance does not guarantee future results. The projected returns
            are estimates based on historical data and current market
            conditions.
          </p>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="px-6 py-3 rounded-xl text-base text-gray-700 hover:bg-gray-50"
        >
          Back
        </Button>
        <Button
          onClick={onConfirm}
          className="px-6 py-3 rounded-xl text-base text-white font-semibold"
          style={{
            background: 'linear-gradient(to right, #3B82F6, #2563EB)', // Blue gradient
            boxShadow: '0 4px 14px 0 rgba(60, 130, 240, 0.4)',
          }}
        >
          Confirm Investment
        </Button>
      </div>
    </div>
  );
};

export default InvestmentProjectionStep;
