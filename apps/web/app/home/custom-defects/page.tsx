'use client';

/**
 * Custom Defects Management Page
 * 
 * Features:
 * - View all custom defect types
 * - Create/Edit/Delete defect types
 * - View training sample counts
 * - Start training
 * - View training status
 */

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  PlayCircle, 
  AlertCircle,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';
import { customDefectsAPI } from '~/lib/radikal/custom-defects-api';
import { 
  CustomDefectType, 
  CustomDefectTypeUpdate,
  DefectStatistics,
  TrainingJob 
} from '~/types/custom-defects';
import { 
  CreateDefectModal,
  EditDefectModal,
  DeleteConfirmModal,
  TrainingMonitor
} from './_components';

export default function CustomDefectsPage() {
  const [defectTypes, setDefectTypes] = useState<CustomDefectType[]>([]);
  const [statistics, setStatistics] = useState<DefectStatistics | null>(null);
  const [activeJobs, setActiveJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDefect, setEditingDefect] = useState<CustomDefectType | null>(null);
  const [deletingDefect, setDeletingDefect] = useState<CustomDefectType | null>(null);
  const [showTrainingMonitor, setShowTrainingMonitor] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [types, stats, jobs] = await Promise.all([
        customDefectsAPI.getCustomDefectTypes(),
        customDefectsAPI.getStatistics(),
        customDefectsAPI.getTrainingJobs(10),
      ]);
      
      setDefectTypes(types);
      setStatistics(stats);
      setActiveJobs(jobs.filter(j => j.status === 'running' || j.status === 'pending'));
    } catch (err: any) {
      console.error('Failed to load custom defects:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefect = async (data: any) => {
    try {
      await customDefectsAPI.createCustomDefectType(data);
      setShowCreateModal(false);
      await loadData();
    } catch (err: any) {
      console.error('Failed to create defect type:', err);
      throw new Error(err.response?.data?.detail || 'Failed to create defect type');
    }
  };

  const handleUpdateDefect = async (id: number, data: CustomDefectTypeUpdate) => {
    try {
      await customDefectsAPI.updateCustomDefectType(id, data);
      setEditingDefect(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to update defect type:', err);
      throw new Error(err.response?.data?.detail || 'Failed to update defect type');
    }
  };

  const handleDeleteDefect = async (id: number) => {
    try {
      await customDefectsAPI.deleteCustomDefectType(id);
      setDeletingDefect(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to delete defect type:', err);
      alert(err.response?.data?.detail || 'Failed to delete defect type');
    }
  };

  const handleStartTraining = async () => {
    try {
      const result = await customDefectsAPI.startTraining({
        epochs: 50,
        batch_size: 16,
        auto_deploy: false,
      });
      alert(`Training started! Job ID: ${result.job_id}`);
      setShowTrainingMonitor(true);
      await loadData();
    } catch (err: any) {
      console.error('Failed to start training:', err);
      alert(err.response?.data?.detail || 'Failed to start training');
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading custom defect types...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-2">Error Loading Data</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Custom Defect Types</h1>
          <p className="text-muted-foreground mt-1">
            Manage unlimited custom defect categories for your specific needs
          </p>
        </div>
        <div className="flex gap-3">
          {activeJobs.length > 0 && (
            <button
              onClick={() => setShowTrainingMonitor(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Clock className="h-4 w-4" />
              Training ({activeJobs.length})
            </button>
          )}
          <button
            onClick={handleStartTraining}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            disabled={!statistics || statistics.types_ready_for_training === 0}
          >
            <PlayCircle className="h-4 w-4" />
            Start Training
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Defect Type
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-primary">{statistics.total_custom_types}</div>
            <div className="text-sm text-muted-foreground">Total Types</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{statistics.active_custom_types}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{statistics.total_training_samples}</div>
            <div className="text-sm text-muted-foreground">Training Samples</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {statistics.avg_samples_per_type.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Samples</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">{statistics.types_needing_samples}</div>
            <div className="text-sm text-muted-foreground">Need Samples</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-emerald-600">{statistics.types_ready_for_training}</div>
            <div className="text-sm text-muted-foreground">Ready to Train</div>
          </div>
        </div>
      )}

      {/* Defect Types Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Samples
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {defectTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No custom defect types yet. Click "New Defect Type" to create one.
                  </td>
                </tr>
              ) : (
                defectTypes.map((defect) => (
                  <tr key={defect.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {defect.color && (
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: defect.color }}
                          />
                        )}
                        <span className="font-mono font-semibold">{defect.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">{defect.name}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {defect.description || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(defect.severity_default)}`}>
                        {defect.severity_default.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="font-semibold">{defect.current_sample_count}</span>
                        <span className="text-muted-foreground"> / {defect.min_samples_required}</span>
                      </div>
                      {defect.current_sample_count >= defect.min_samples_required ? (
                        <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <CheckCircle className="h-3 w-3" />
                          Ready
                        </div>
                      ) : (
                        <div className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          Need {defect.min_samples_required - defect.current_sample_count} more
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {defect.is_active ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            Active
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Inactive</span>
                        )}
                        {defect.requires_retraining && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Needs Training
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingDefect(defect)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingDefect(defect)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateDefectModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDefect}
        />
      )}

      {editingDefect && (
        <EditDefectModal
          defect={editingDefect}
          onClose={() => setEditingDefect(null)}
          onSubmit={(data) => handleUpdateDefect(editingDefect.id, data)}
        />
      )}

      {deletingDefect && (
        <DeleteConfirmModal
          defect={deletingDefect}
          onClose={() => setDeletingDefect(null)}
          onConfirm={() => handleDeleteDefect(deletingDefect.id)}
        />
      )}

      {showTrainingMonitor && (
        <TrainingMonitor
          jobs={activeJobs}
          onClose={() => setShowTrainingMonitor(false)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
