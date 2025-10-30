/**
 * Training Monitor - Real-time training progress visualization
 */

import { useState, useEffect } from 'react';
import { X, RefreshCw, StopCircle, TrendingUp, Cpu, Clock } from 'lucide-react';
import { TrainingJob } from '~/types/custom-defects';
import { customDefectsAPI } from '~/lib/radikal/custom-defects-api';

interface TrainingMonitorProps {
  jobs: TrainingJob[];
  onClose: () => void;
  onRefresh: () => void;
}

export function TrainingMonitor({ jobs: initialJobs, onClose, onRefresh }: TrainingMonitorProps) {
  const [jobs, setJobs] = useState<TrainingJob[]>(initialJobs);
  const [selectedJob, setSelectedJob] = useState<TrainingJob | null>(
    initialJobs.length > 0 ? initialJobs[0]! : null
  );
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh progress every 3 seconds
  useEffect(() => {
    if (!autoRefresh || !selectedJob) return;

    const interval = setInterval(async () => {
      try {
        const progress = await customDefectsAPI.getTrainingProgress(selectedJob.id);
        setSelectedJob((prev) => prev ? { ...prev, ...progress } as TrainingJob : null);
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedJob?.id, autoRefresh]);

  const handleCancelJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to cancel this training job?')) return;
    
    try {
      await customDefectsAPI.cancelTrainingJob(jobId);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel job');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const formatDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt) return '—';
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Training Monitor</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time training progress and metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                autoRefresh
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Jobs List */}
            <div className="lg:col-span-1">
              <h3 className="font-semibold mb-3">Training Jobs</h3>
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedJob?.id === job.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">Job #{job.id}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {job.job_type.replace('_', ' ')}
                    </div>
                    {job.status === 'running' && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{job.progress_percent.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${job.progress_percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Job Details */}
            {selectedJob && (
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Job #{selectedJob.id} Details</h3>
                  {selectedJob.status === 'running' && (
                    <button
                      onClick={() => handleCancelJob(selectedJob.id)}
                      className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <StopCircle className="h-4 w-4" />
                      Cancel Job
                    </button>
                  )}
                </div>

                {/* Progress */}
                {selectedJob.status === 'running' && (
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Training Progress</span>
                      <span className="text-2xl font-bold text-primary">
                        {selectedJob.progress_percent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${selectedJob.progress_percent}%` }}
                      />
                    </div>
                    {selectedJob.current_epoch && selectedJob.total_epochs && (
                      <p className="text-sm text-muted-foreground">
                        Epoch {selectedJob.current_epoch} of {selectedJob.total_epochs}
                      </p>
                    )}
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {selectedJob.latest_train_loss !== undefined && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Train Loss</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedJob.latest_train_loss.toFixed(4)}
                      </div>
                    </div>
                  )}
                  {selectedJob.latest_val_loss !== undefined && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Val Loss</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedJob.latest_val_loss.toFixed(4)}
                      </div>
                    </div>
                  )}
                  {selectedJob.latest_accuracy !== undefined && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Accuracy</div>
                      <div className="text-2xl font-bold text-green-600">
                        {(selectedJob.latest_accuracy * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                  {selectedJob.gpu_utilization_percent !== undefined && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        GPU Usage
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedJob.gpu_utilization_percent.toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Training History Chart */}
                {selectedJob.training_history && selectedJob.training_history.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Training History
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedJob.training_history.slice(-10).reverse().map((entry) => (
                          <div
                            key={entry.epoch}
                            className="flex justify-between items-center text-sm p-2 bg-white dark:bg-gray-800 rounded"
                          >
                            <span className="font-medium">Epoch {entry.epoch}</span>
                            <div className="flex gap-4">
                              <span className="text-blue-600">
                                Loss: {entry.train_loss.toFixed(4)}
                              </span>
                              <span className="text-purple-600">
                                Val: {entry.val_loss.toFixed(4)}
                              </span>
                              <span className="text-green-600">
                                Acc: {(entry.accuracy * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Job Info */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Job Type:</span>
                    <span className="font-medium capitalize">
                      {selectedJob.job_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedJob.status)}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  {selectedJob.started_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Duration:
                      </span>
                      <span className="font-medium">
                        {formatDuration(selectedJob.started_at, selectedJob.completed_at)}
                      </span>
                    </div>
                  )}
                  {selectedJob.memory_usage_gb && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Memory Usage:</span>
                      <span className="font-medium">
                        {selectedJob.memory_usage_gb.toFixed(2)} GB
                      </span>
                    </div>
                  )}
                  {selectedJob.error_message && (
                    <div className="pt-2 border-t">
                      <span className="text-red-600 font-medium">Error:</span>
                      <pre className="mt-2 text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded overflow-x-auto">
                        {selectedJob.error_message}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
