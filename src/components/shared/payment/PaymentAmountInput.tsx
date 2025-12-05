import { Input } from '@/components/ui/input';
import { formatAmount } from '@/lib/helpers';

interface PaymentAmountInputProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  minAmount?: number;
  maxAmount?: number;
  className?: string;
}

export function PaymentAmountInput({
  amount,
  onAmountChange,
  disabled = false,
  label = "Enter Investment Amount (USD)",
  placeholder = "e.g. 5000",
  minAmount,
  maxAmount,
  className = ""
}: PaymentAmountInputProps) {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      onAmountChange(value);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium">{label}</label>
      <div className="relative">
        <Input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pr-12"
          min={minAmount}
          max={maxAmount}
        />
        {amount && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            ≈ ${formatAmount(Number(amount) || 0)}
          </div>
        )}
      </div>
      {minAmount && maxAmount && (
        <p className="text-xs text-muted-foreground">
          Range: ${formatAmount(minAmount)} - ${formatAmount(maxAmount)}
        </p>
      )}
    </div>
  );
}