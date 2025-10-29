'use client';

/**
 * Reusable card component.
 */

import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-gray-800 rounded-lg p-6',
      bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6',
      elevated: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6',
    };

    return (
      <div ref={ref} className={clsx(variants[variant], className)} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={clsx('text-xl font-semibold text-gray-900 dark:text-white', className)} {...props}>
    {children}
  </h3>
);

export const CardContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx(className)} {...props}>
    {children}
  </div>
);
