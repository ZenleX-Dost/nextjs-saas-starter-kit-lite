/**
 * Modal for creating a new custom defect type
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { CustomDefectTypeCreate } from '~/types/custom-defects';

interface CreateDefectModalProps {
  onClose: () => void;
  onSubmit: (data: CustomDefectTypeCreate) => Promise<void>;
}

export function CreateDefectModal({ onClose, onSubmit }: CreateDefectModalProps) {
  const [formData, setFormData] = useState<CustomDefectTypeCreate>({
    name: '',
    code: '',
    description: '',
    severity_default: 'medium',
    color: '#3b82f6',
    min_samples_required: 50,
    compliance_standards: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Name and code are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to create defect type');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Create Custom Defect Type</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Defect Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Surface Corrosion"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-900 dark:border-gray-700"
              required
            />
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Defect Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., SC"
              maxLength={10}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-900 dark:border-gray-700 font-mono"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Short alphanumeric code (max 10 characters)
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the defect characteristics..."
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-900 dark:border-gray-700"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium mb-2">Default Severity</label>
            <select
              value={formData.severity_default}
              onChange={(e) => setFormData({ ...formData, severity_default: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-900 dark:border-gray-700"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Display Color</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3b82f6"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-900 dark:border-gray-700 font-mono"
              />
            </div>
          </div>

          {/* Min Samples */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Minimum Training Samples
            </label>
            <input
              type="number"
              value={formData.min_samples_required}
              onChange={(e) => setFormData({ ...formData, min_samples_required: parseInt(e.target.value) })}
              min={10}
              max={1000}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-900 dark:border-gray-700"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Required samples before training (recommended: 50-100)
            </p>
          </div>

          {/* Compliance Standards */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Compliance Standards (Optional)
            </label>
            <input
              type="text"
              value={formData.compliance_standards?.join(', ') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                compliance_standards: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
              })}
              placeholder="e.g., ISO 6520-1, AWS D1.1"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-900 dark:border-gray-700"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated list of standards
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Defect Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
