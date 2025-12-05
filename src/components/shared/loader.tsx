import { cn } from '@/lib/utils';
import * as React from 'react';

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'destructive' | 'foreground';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-3',
};

const colorClasses = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  destructive: 'text-destructive',
  foreground: 'text-foreground',
};

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = 'primary',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-t-transparent',
        sizeClasses[size],
        colorClasses[color],
        'border-current', // uses text color for border
        className
      )}
      {...props}
    />
  );
};
