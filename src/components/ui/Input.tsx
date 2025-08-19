import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    const inputId = React.useId();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-muted-foreground">
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            id={inputId}
            className={cn(
              'flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-destructive focus:ring-destructive',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="h-5 w-5 text-muted-foreground">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="mt-1 text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
