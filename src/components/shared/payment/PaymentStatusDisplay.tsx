import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export type PaymentStatus = 'waiting' | 'pending' | 'confirmed' | 'error';

interface PaymentStatusDisplayProps {
  status: PaymentStatus;
  customMessage?: string;
  className?: string;
}

export function PaymentStatusDisplay({ status, customMessage, className = "" }: PaymentStatusDisplayProps) {
  let statusMessage: string;
  let StatusIcon: typeof CheckCircle;
  let statusClass: string;
  let title: string;

  switch (status) {
    case 'confirmed':
      statusMessage = customMessage || 'Payment Confirmed! Your investment is now active.';
      StatusIcon = CheckCircle;
      statusClass = 'border-green-400 bg-green-50 text-green-700';
      title = 'Success!';
      break;
    case 'pending':
      statusMessage = customMessage || 'Transaction Pending. Waiting for network confirmations.';
      StatusIcon = Clock;
      statusClass = 'border-yellow-400 bg-yellow-50 text-yellow-700';
      title = 'Processing';
      break;
    case 'error':
      statusMessage = customMessage || 'Payment failed. Please try again.';
      StatusIcon = AlertTriangle;
      statusClass = 'border-red-400 bg-red-50 text-red-700';
      title = 'Error';
      break;
    default: // 'waiting'
      statusMessage = customMessage || 'Deposit required to confirm your investment.';
      StatusIcon = Clock;
      statusClass = 'border-blue-400 bg-blue-50 text-blue-700';
      title = 'Action Required';
  }

  return (
    <Alert className={`p-4 ${statusClass} ${className}`}>
      <StatusIcon className="h-5 w-5" />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription className="text-sm">{statusMessage}</AlertDescription>
    </Alert>
  );
}