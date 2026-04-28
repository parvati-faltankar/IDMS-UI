/**
 * Menu Validation Summary Component
 * Displays validation errors and warnings
 */

import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { MenuValidationResult } from '../../utils/menuBuilderTypes';
import { cn } from '../../utils/classNames';

interface MenuValidationSummaryProps {
  validation: MenuValidationResult | null;
  onDismiss?: () => void;
}

const MenuValidationSummary: React.FC<MenuValidationSummaryProps> = ({ validation, onDismiss }) => {
  if (!validation) return null;

  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex items-center gap-2">
        <CheckCircle2 size={16} />
        <span>Configuration is valid and ready to publish</span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm space-y-2">
      {validation.errors.length > 0 && (
        <div className="flex gap-2 items-start">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-red-900 mb-1">Validation Errors:</div>
            <ul className="space-y-1 text-red-700">
              {validation.errors.map((error, idx) => (
                <li key={idx}>• {error.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="flex gap-2 items-start pt-2 border-t border-red-200 mt-2">
          <AlertTriangle size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-orange-900 mb-1">Warnings:</div>
            <ul className="space-y-1 text-orange-700">
              {validation.warnings.map((warning, idx) => (
                <li key={idx}>• {warning.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuValidationSummary;
