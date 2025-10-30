/**
 * Modal for confirming deletion of a custom defect type
 */

import { AlertTriangle, X } from 'lucide-react';
import { CustomDefectType } from '~/types/custom-defects';

interface DeleteConfirmModalProps {
  defect: CustomDefectType;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ defect, onClose, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Confirm Deletion</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 dark:text-gray-100 mb-2">
                Are you sure you want to delete the defect type{' '}
                <span className="font-semibold">"{defect.name}"</span> ({defect.code})?
              </p>
              {defect.current_sample_count > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    <strong>Warning:</strong> This defect has{' '}
                    <strong>{defect.current_sample_count} training samples</strong>. Deleting it
                    will also remove all associated training data.
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-3">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete Defect Type
          </button>
        </div>
      </div>
    </div>
  );
}
