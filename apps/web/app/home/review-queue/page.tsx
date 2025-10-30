'use client';

/**
 * Review Queue - Collaborative Review System
 * 
 * Features:
 * - Pending analysis reviews
 * - Approve/Reject/Escalate workflow
 * - Add annotations and comments
 * - Review history
 * - Add corrections to training (Active Learning Integration)
 */

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  User,
  Clock,
  FileText,
  BookmarkPlus
} from 'lucide-react';
import Image from 'next/image';
import { customDefectsAPI } from '~/lib/radikal/custom-defects-api';
import { CustomDefectType } from '~/types/custom-defects';

interface ReviewQueueItem {
  analysis_id: string;
  image_name: string;
  upload_timestamp: string;
  defect_type: string | null;
  severity: string | null;
  confidence: number;
  review_status: string;
  reviewer_id: string | null;
}

export default function ReviewQueuePage() {
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Active Learning Integration
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [defectTypes, setDefectTypes] = useState<CustomDefectType[]>([]);
  const [selectedDefectTypeId, setSelectedDefectTypeId] = useState<number | null>(null);
  const [addingToTraining, setAddingToTraining] = useState(false);

  useEffect(() => {
    fetchQueue();
    loadDefectTypes();
  }, [filter]);

  const loadDefectTypes = async () => {
    try {
      const types = await customDefectsAPI.getCustomDefectTypes(true);
      setDefectTypes(types);
    } catch (error) {
      console.error('Failed to load defect types:', error);
    }
  };

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/xai-qc/reviews/queue?status=${filter}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch queue');
      
      const data = await response.json();
      setQueue(data);
      
      // Auto-select first item if none selected
      if (!selectedItem && data.length > 0) {
        setSelectedItem(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch review queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (status: 'approved' | 'rejected' | 'needs_second_opinion') => {
    if (!selectedItem) return;
    
    try {
      setSubmitting(true);
      
      const response = await fetch('http://localhost:8000/api/xai-qc/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: selectedItem.analysis_id,
          status,
          comments: comments || undefined,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to submit review');
      
      // Refresh queue
      await fetchQueue();
      
      // Clear form
      setComments('');
      
      // Move to next item
      const currentIndex = queue.findIndex(item => item.analysis_id === selectedItem.analysis_id);
      if (currentIndex < queue.length - 1) {
        setSelectedItem(queue[currentIndex + 1] || null);
      } else {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToTraining = async () => {
    if (!selectedItem || !selectedDefectTypeId) {
      alert('Please select a defect type');
      return;
    }

    try {
      setAddingToTraining(true);
      
      const response = await fetch('http://localhost:8000/api/xai-qc/reviews/add-to-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: selectedItem.analysis_id,
          corrected_defect_type_id: selectedDefectTypeId,
          confidence: selectedItem.confidence,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add to training');
      }

      const result = await response.json();
      
      alert(
        `✅ ${result.message}\n\n` +
        `Defect Type: ${result.defect_type}\n` +
        `Samples: ${result.current_samples}/${result.min_required}\n` +
        `${result.ready_for_training ? '✓ Ready for training!' : '⏳ Need more samples'}`
      );
      
      setShowTrainingModal(false);
      setSelectedDefectTypeId(null);
      
      // Reload defect types to update counts
      await loadDefectTypes();
    } catch (error: any) {
      console.error('Failed to add to training:', error);
      alert(error.message || 'Failed to add to training');
    } finally {
      setAddingToTraining(false);
    }
  };

  const getSeverityColor = (severity: string | null) => {
    if (!severity) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    
    const colors: Record<string, string> = {
      'CRITICAL': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'HIGH': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'LOW': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'ACCEPTABLE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    
    return colors[severity] || colors['MEDIUM'];
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Review Queue
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Collaborative inspection review system
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Pending ({queue.length})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Queue List */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          <div className="p-4 space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading...</p>
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No items in queue</p>
              </div>
            ) : (
              queue.map((item) => (
                <button
                  key={item.analysis_id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedItem?.analysis_id === item.analysis_id
                      ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-md'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.image_name}
                    </span>
                    {item.severity && (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getSeverityColor(item.severity)}`}>
                        {item.severity}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {item.defect_type && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Type: <span className="font-medium">{item.defect_type}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Confidence: <span className="font-medium">{(item.confidence * 100).toFixed(1)}%</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(item.upload_timestamp).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Review Detail */}
        <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto">
          {selectedItem ? (
            <div className="p-8 max-w-4xl mx-auto">
              {/* Image Preview */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {selectedItem.image_name}
                </h2>
                
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 aspect-video flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Image preview would appear here
                  </p>
                </div>
              </div>

              {/* Analysis Details */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Analysis Details
                  </h3>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Defect Type:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedItem.defect_type || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Severity:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedItem.severity || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {(selectedItem.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Metadata
                  </h3>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Analysis ID:</span>
                      <p className="font-mono text-xs text-gray-900 dark:text-white">
                        {selectedItem.analysis_id}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Timestamp:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedItem.upload_timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Review Comments
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add your review comments, observations, or notes..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                {/* Add to Training Button */}
                {defectTypes.length > 0 && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowTrainingModal(true)}
                      className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <BookmarkPlus className="w-5 h-5 mr-2" />
                      Add to Training Dataset
                    </button>
                  </div>
                )}

                {/* Review Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => submitReview('needs_second_opinion')}
                    disabled={submitting}
                    className="flex items-center px-6 py-3 border border-orange-500 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50"
                  >
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Request Second Opinion
                  </button>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => submitReview('rejected')}
                      disabled={submitting}
                      className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      Reject
                    </button>
                    
                    <button
                      onClick={() => submitReview('approved')}
                      disabled={submitting}
                      className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-600 dark:text-gray-400">
                  Select an item to review
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add to Training Modal */}
      {showTrainingModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold">Add to Training Dataset</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select the correct defect type for this image
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTrainingModal(false);
                  setSelectedDefectTypeId(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Current Analysis Info */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Current Analysis</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Image:</span>{' '}
                    <span className="font-medium">{selectedItem.image_name}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">AI Prediction:</span>{' '}
                    <span className="font-medium">{selectedItem.defect_type || 'N/A'}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Confidence:</span>{' '}
                    <span className="font-medium">{(selectedItem.confidence * 100).toFixed(1)}%</span>
                  </p>
                </div>
              </div>

              {/* Defect Type Selector */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Select Correct Defect Type <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {defectTypes.map((defect) => (
                    <button
                      key={defect.id}
                      onClick={() => setSelectedDefectTypeId(defect.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        selectedDefectTypeId === defect.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {defect.color && (
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: defect.color }}
                          />
                        )}
                        <div className="text-left">
                          <div className="font-medium">{defect.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {defect.code} • {defect.current_sample_count}/{defect.min_samples_required} samples
                          </div>
                        </div>
                      </div>
                      {selectedDefectTypeId === defect.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Help Text */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  <strong>💡 Active Learning:</strong> This image will be added to the training dataset
                  for the selected defect type. When enough samples are collected, you can retrain
                  the model to improve its accuracy.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowTrainingModal(false);
                  setSelectedDefectTypeId(null);
                }}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={addingToTraining}
              >
                Cancel
              </button>
              <button
                onClick={handleAddToTraining}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                disabled={!selectedDefectTypeId || addingToTraining}
              >
                {addingToTraining ? 'Adding...' : 'Add to Training'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
