import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-800 bg-gray-900/50 px-3 py-2 text-sm text-gray-100 ring-offset-gray-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-red-500/50 focus-visible:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-400 mt-1">{error}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export default Input;
