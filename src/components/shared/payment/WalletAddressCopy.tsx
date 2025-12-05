import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';
import { useState } from 'react';

interface WalletAddressCopyProps {
  address: string;
  label?: string;
  className?: string;
}

export function WalletAddressCopy({ address, label = "Wallet Address", className = "" }: WalletAddressCopyProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast({
      title: 'Address Copied!',
      description: 'Wallet address copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input
          value={address}
          readOnly
          className="flex-1 font-mono text-sm"
        />
        <Button
          onClick={handleCopy}
          variant="outline"
          size="icon"
          className={copied ? 'bg-green-50 border-green-200' : ''}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}