/**
 * Menu Status Badge Component
 * Displays draft/published status
 */

import React from 'react';
import { cn } from '../../../utils/classNames';

interface MenuStatusBadgeProps {
  status: 'draft' | 'published';
  isDirty?: boolean;
  className?: string;
}

const MenuStatusBadge: React.FC<MenuStatusBadgeProps> = ({ status, isDirty, className }) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded text-xs font-medium gap-1';

  if (status === 'draft' || isDirty) {
    return (
      <span
        className={cn(
          baseClasses,
          'bg-yellow-100 text-yellow-700 border border-yellow-200',
          className
        )}
      >
        <span className="w-2 h-2 bg-yellow-600 rounded-full" />
        {isDirty ? 'Draft changes' : 'Draft'}
      </span>
    );
  }

  return (
    <span
      className={cn(
        baseClasses,
        'bg-green-100 text-green-700 border border-green-200',
        className
      )}
    >
      <span className="w-2 h-2 bg-green-600 rounded-full" />
      Published
    </span>
  );
};

export default MenuStatusBadge;
