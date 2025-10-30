'use client';

/**
 * Dataset Labeling Tool
 * 
 * Features:
 * - Active learning suggestions queue
 * - Image upload and display
 * - Bounding box drawing
 * - Class selection
 * - Accept/Skip workflow
 * - Progress tracking
 */

import { useState, useEffect } from 'react';
import { 
  Upload, 
  Tag, 
  CheckCircle, 
  SkipForward,
  AlertCircle,
  TrendingUp,
  Image as ImageIcon,
  Lightbulb,
  Package
} from 'lucide-react';
import { customDefectsAPI } from '~/lib/radikal/custom-defects-api';
import { CustomDefectType } from '~/types/custom-defects';
import {
  ImageCanvas,
  ImageUploader,
  ActiveLearningSuggestions,
  LabelingStats,
} from './_components';

interface LabelingSession {
  mode: 'manual' | 'active_learning';
  currentImagePath?: string;
  currentImageId?: string;
  currentSuggestionId?: number;
  annotations: Array<{
    bbox: [number, number, number, number];
    class_id: number;
    class_name: string;
  }>;
}

export default function LabelingPage() {
  const [defectTypes, setDefectTypes] = useState<CustomDefectType[]>([]);
  const [session, setSession] = useState<LabelingSession>({
    mode: 'manual',
    annotations: [],
  });
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDefectTypes();
  }, []);

  const loadDefectTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const types = await customDefectsAPI.getCustomDefectTypes(true); // active only
      setDefectTypes(types);
      if (types.length > 0 && !selectedClassId) {
        setSelectedClassId(types[0]!.id);
      }
    } catch (err: any) {
      console.error('Failed to load defect types:', err);
      setError(err.response?.data?.detail || 'Failed to load defect types');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (imagePath: string, imageId: string) => {
    setSession({
      mode: 'manual',
      currentImagePath: imagePath,
      currentImageId: imageId,
      annotations: [],
    });
  };

  const handleActiveLearningSelect = (
    imagePath: string,
    imageId: string,
    suggestionId: number
  ) => {
    setSession({
      mode: 'active_learning',
      currentImagePath: imagePath,
      currentImageId: imageId,
      currentSuggestionId: suggestionId,
      annotations: [],
    });
  };

  const handleAddAnnotation = (bbox: [number, number, number, number]) => {
    if (!selectedClassId) {
      alert('Please select a defect class first');
      return;
    }

    const defectType = defectTypes.find(t => t.id === selectedClassId);
    if (!defectType) return;

    setSession(prev => ({
      ...prev,
      annotations: [
        ...prev.annotations,
        {
          bbox,
          class_id: selectedClassId,
          class_name: defectType.name,
        },
      ],
    }));
  };

  const handleRemoveAnnotation = (index: number) => {
    setSession(prev => ({
      ...prev,
      annotations: prev.annotations.filter((_, i) => i !== index),
    }));
  };

  const handleSaveAnnotations = async () => {
    if (!session.currentImagePath || session.annotations.length === 0) {
      alert('Please add at least one annotation');
      return;
    }

    try {
      setSaving(true);
      
      // Create FormData for each annotation
      for (const annotation of session.annotations) {
        const formData = new FormData();
        formData.append('defect_type_id', annotation.class_id.toString());
        formData.append('image_path', session.currentImagePath);
        if (session.currentImageId) {
          formData.append('image_id', session.currentImageId);
        }
        formData.append('annotations', JSON.stringify({
          bbox: annotation.bbox,
          class_name: annotation.class_name,
        }));
        formData.append('annotation_format', 'bbox');
        formData.append('source', session.mode === 'active_learning' ? 'active_learning' : 'manual');

        await customDefectsAPI.addTrainingSample(formData);
      }

      // If from active learning, mark as accepted
      if (session.mode === 'active_learning' && session.currentSuggestionId) {
        // TODO: Call accept endpoint when available
        // await customDefectsAPI.acceptActiveLearning(session.currentSuggestionId);
      }

      alert(`✅ Saved ${session.annotations.length} annotation(s) successfully!`);
      
      // Reset session
      setSession({
        mode: 'manual',
        annotations: [],
      });
      
      // Reload to update stats
      await loadDefectTypes();
    } catch (err: any) {
      console.error('Failed to save annotations:', err);
      alert(err.response?.data?.detail || 'Failed to save annotations');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (session.mode === 'active_learning' && session.currentSuggestionId) {
      // TODO: Call skip endpoint when available
      // await customDefectsAPI.skipActiveLearning(session.currentSuggestionId);
    }
    
    setSession({
      mode: 'manual',
      annotations: [],
    });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading labeling tool...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-2">Error Loading Tool</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={loadDefectTypes}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (defectTypes.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center h-96">
          <Package className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Custom Defect Types</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            You need to create custom defect types before you can label images.
            Go to the Custom Defects page to create them.
          </p>
          <a
            href="/home/custom-defects"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Go to Custom Defects
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dataset Labeling Tool</h1>
        <p className="text-muted-foreground mt-1">
          Annotate images to train your custom defect detection model
        </p>
      </div>

      {/* Stats */}
      <LabelingStats defectTypes={defectTypes} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mode Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Labeling Mode</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSession(prev => ({ ...prev, mode: 'manual' }))}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  session.mode === 'manual'
                    ? 'bg-primary text-white border-primary'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Upload className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Manual Upload</div>
                  <div className="text-xs opacity-80">Upload your own images</div>
                </div>
              </button>
              <button
                onClick={() => setSession(prev => ({ ...prev, mode: 'active_learning' }))}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  session.mode === 'active_learning'
                    ? 'bg-primary text-white border-primary'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Lightbulb className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Smart Suggestions</div>
                  <div className="text-xs opacity-80">AI-recommended images</div>
                </div>
              </button>
            </div>
          </div>

          {/* Class Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Defect Class
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {defectTypes.map((defect) => (
                <button
                  key={defect.id}
                  onClick={() => setSelectedClassId(defect.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selectedClassId === defect.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {defect.color && (
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: defect.color }}
                    />
                  )}
                  <div className="text-left flex-1">
                    <div className="font-medium">{defect.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {defect.current_sample_count} / {defect.min_samples_required} samples
                    </div>
                  </div>
                  {selectedClassId === defect.id && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Current Annotations */}
          {session.annotations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
              <h3 className="font-semibold mb-3">
                Annotations ({session.annotations.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {session.annotations.map((annotation, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{
                          backgroundColor: defectTypes.find(t => t.id === annotation.class_id)?.color || '#3b82f6',
                        }}
                      />
                      <span className="text-sm font-medium">{annotation.class_name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveAnnotation(index)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {session.currentImagePath && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-2">
              <button
                onClick={handleSaveAnnotations}
                disabled={saving || session.annotations.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Annotations'}
              </button>
              <button
                onClick={handleSkip}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <SkipForward className="h-4 w-4" />
                Skip Image
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Canvas */}
        <div className="lg:col-span-3">
          {session.mode === 'manual' && !session.currentImagePath && (
            <ImageUploader onImageUpload={handleImageUpload} />
          )}

          {session.mode === 'active_learning' && !session.currentImagePath && (
            <ActiveLearningSuggestions onSelectImage={handleActiveLearningSelect} />
          )}

          {session.currentImagePath && (
            <ImageCanvas
              imagePath={session.currentImagePath}
              annotations={session.annotations}
              selectedClassId={selectedClassId}
              defectTypes={defectTypes}
              onAddAnnotation={handleAddAnnotation}
              onRemoveAnnotation={handleRemoveAnnotation}
            />
          )}
        </div>
      </div>
    </div>
  );
}
