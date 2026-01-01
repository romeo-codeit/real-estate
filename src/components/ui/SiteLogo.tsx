import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SiteLogoProps {
  showText?: boolean;
  className?: string;
  /**
   * variant: 'none' = no background, 'circle' = subtle circular bg (useful on dark headers)
   */
  variant?: 'none' | 'circle';
}

/**
 * SiteLogo now uses the provided SVG asset for perfect scaling and fidelity.
 * Default: transparent background; use `variant="circle"` to get a subtle circular bg (adapts to light/dark).
 */
export function SiteLogo({ showText = true, className, variant = 'none' }: SiteLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('relative', variant === 'circle' ? 'p-1 rounded-full bg-white dark:bg-slate-800/60' : '')}>
        <Image src="/realestate-logo.svg" alt="Real Estate Invest logo" width={40} height={40} className="w-9 h-9 object-contain" priority />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="text-base md:text-lg font-bold text-foreground">Real Estate Invest</div>
        </div>
      )}
    </div>
  );
}

export default SiteLogo;
