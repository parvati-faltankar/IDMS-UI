/**
 * Menu Confirmation Dialogs
 * Dialogs for reset and publish confirmations
 */

import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../utils/classNames';

interface MenuConfirmationDialogProps {
  isOpen: boolean;
  type: 'reset' | 'publish';
  isDirty?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const MenuConfirmationDialog: React.FC<MenuConfirmationDialogProps> = ({
  isOpen,
  type,
  isDirty,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  if (!isOpen) return null;

  const isReset = type === 'reset';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className={cn(
            'flex items-center justify-center w-12 h-12 mx-auto mt-4 rounded-full',
            isReset ? 'bg-yellow-100' : 'bg-green-100'
          )}>
            {isReset ? (
              <AlertTriangle size={24} className="text-yellow-600" />
            ) : (
              <CheckCircle2 size={24} className="text-green-600" />
            )}
          </div>

          <div className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">
              {isReset ? 'Reset Changes?' : 'Publish Menu Configuration?'}
            </h3>

            <p className="text-gray-600 text-sm mb-4">
              {isReset
                ? isDirty
                  ? 'This will discard all unsaved changes and revert to the last published configuration.'
                  : 'This will reset the builder. No unsaved changes to discard.'
                : 'This will publish the current configuration and update the navigation menu globally.'}
            </p>

            <div className={cn(
              'p-3 rounded text-sm mb-6',
              isReset ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'
            )}>
              {isReset
                ? '⚠️ This action cannot be easily undone. The published menu will remain active.'
                : '✓ Users will immediately see the new navigation menu after publishing.'}
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium text-white rounded transition-colors disabled:opacity-50',
                isReset
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-green-600 hover:bg-green-700'
              )}
            >
              {isLoading ? 'Processing...' : isReset ? 'Reset' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MenuConfirmationDialog;
