'use client';

import { useState } from 'react';
import ImageUpload from '~/components/ImageUpload';
import DetectionResults from '~/components/DetectionResults';
import XAIExplanations from '~/components/XAIExplanations';
import ExportButton from '~/components/ExportButton';
import { apiClient } from '~/lib/radikal/api';
import { DetectionResponse, ExplanationResponse } from '~/types';
import { 
  AlertCircle, 
  Save, 
  Microscope, 
  Upload, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  BarChart3, 
  XCircle, 
  AlertOctagon, 
  Info, 
  Eye,
  TrendingUp
} from 'lucide-react';
import { useAnalysisStore } from '~/store/analysisStore';
import { useUIStore } from '~/store/uiStore';
import { useSettingsStore } from '~/store/settingsStore';

export default function DashboardPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResponse | null>(null);
  const [explanationResult, setExplanationResult] = useState<ExplanationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [selectedMethods, setSelectedMethods] = useState<string>('gradcam'); // XAI method selection

  const { addToHistory } = useAnalysisStore();
  const { addToast } = useUIStore();
  const { settings } = useSettingsStore();

  const handleImageUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setDetectionResult(null);
    setExplanationResult(null);
    setCurrentFileName(file.name);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Step 1: Detect defects
      const detection = await apiClient.detectDefects(file);
      setDetectionResult(detection);

      addToast({
        type: 'success',
        title: 'Detection Complete',
        message: `Found ${detection.detections.length} defect(s)`,
      });

      // Step 2: Get explanations (classification already includes them)
      // The detection response now includes classification metadata
      if ((detection as any)._classification_metadata) {
        // Use the stored file to get full explanation with heatmaps
        const explanation = await apiClient.getExplanations({
          image_id: detection.image_id,
          file: file, // Pass file directly
          methods: selectedMethods, // Pass selected XAI methods
        });
        
        setExplanationResult(explanation);

        // Auto-save to history if enabled
        if (settings.autoSaveAnalyses && uploadedImage) {
          saveToHistory(file.name, uploadedImage, detection, explanation);
        }
      } else if (settings.autoSaveAnalyses && uploadedImage) {
        saveToHistory(file.name, uploadedImage, detection);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'An error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Detection Failed',
        message: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToHistory = (
    fileName: string,
    imageUrl: string,
    detection: DetectionResponse,
    explanation?: ExplanationResponse
  ) => {
    const severityCounts = detection.detections.reduce(
      (acc, det) => {
        const sev = det.severity || 'low';
        if (sev === 'critical' || sev === 'high') {
          acc.high = (acc.high || 0) + 1;
        } else if (sev === 'medium') {
          acc.medium = (acc.medium || 0) + 1;
        } else {
          acc.low = (acc.low || 0) + 1;
        }
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );

    addToHistory({
      imageName: fileName,
      imageUrl,
      detections: detection.detections.length,
      highSeverity: severityCounts.high || 0,
      mediumSeverity: severityCounts.medium || 0,
      lowSeverity: severityCounts.low || 0,
      result: detection,
      explanation,
    });

    addToast({
      type: 'info',
      title: 'Saved to History',
      message: 'Analysis saved successfully',
      duration: 3000,
    });
  };

  const handleManualSave = () => {
    if (currentFileName && uploadedImage && detectionResult) {
      saveToHistory(currentFileName, uploadedImage, detectionResult, explanationResult || undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Enhanced Styling */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 shadow-xl">
          <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <Microscope className="w-12 h-12" />
            RadiKal XAI Quality Control
          </h1>
          <p className="text-blue-100 text-lg">
            AI-Powered Radiographic Defect Detection & Explainable Analysis
          </p>
        </div>

        {/* Quick Stats Overview */}
        {detectionResult && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Total Detections */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border-l-4 border-blue-500 transform transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Detections</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{detectionResult.detections.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Target className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Average Confidence */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border-l-4 border-green-500 transform transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Avg Confidence</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {detectionResult.detections.length > 0 
                      ? (detectionResult.detections.reduce((sum, d) => sum + d.confidence, 0) / detectionResult.detections.length * 100).toFixed(1)
                      : '0'}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* High Severity Count */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border-l-4 border-red-500 transform transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Critical Defects</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {detectionResult.detections.filter(d => d.severity === 'critical' || d.severity === 'high').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            {/* Inference Time */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border-l-4 border-purple-500 transform transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Processing Time</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {detectionResult.inference_time_ms}
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">ms</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Zap className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Severity Breakdown */}
        {detectionResult && detectionResult.detections.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              Defect Severity Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Critical */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase">Critical</span>
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-4xl font-bold text-red-900 dark:text-red-300">
                  {detectionResult.detections.filter(d => d.severity === 'critical').length}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Requires immediate action</p>
              </div>

              {/* High */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-orange-700 dark:text-orange-400 uppercase">High</span>
                  <AlertOctagon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-4xl font-bold text-orange-900 dark:text-orange-300">
                  {detectionResult.detections.filter(d => d.severity === 'high').length}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Significant concern</p>
              </div>

              {/* Medium */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 uppercase">Medium</span>
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-4xl font-bold text-yellow-900 dark:text-yellow-300">
                  {detectionResult.detections.filter(d => d.severity === 'medium').length}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Monitor closely</p>
              </div>

              {/* Low */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase">Low</span>
                  <Info className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-4xl font-bold text-green-900 dark:text-green-300">
                  {detectionResult.detections.filter(d => d.severity === 'low').length}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Minor issue</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Image Upload & Analysis
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload a radiographic weld image for AI-powered defect detection
          </p>
          
          {/* XAI Method Selector */}
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              🧠 XAI Explanation Methods
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                onClick={() => setSelectedMethods('gradcam')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedMethods === 'gradcam'
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                }`}
              >
                Grad-CAM
              </button>
              <button
                onClick={() => setSelectedMethods('lime')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedMethods === 'lime'
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-700'
                }`}
              >
                LIME
              </button>
              <button
                onClick={() => setSelectedMethods('shap')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedMethods === 'shap'
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700'
                }`}
              >
                SHAP
              </button>
              <button
                onClick={() => setSelectedMethods('ig')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedMethods === 'ig'
                    ? 'bg-orange-600 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'
                }`}
              >
                Int. Grad.
              </button>
              <button
                onClick={() => setSelectedMethods('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedMethods === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gray-700'
                }`}
              >
                All Methods
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {selectedMethods === 'gradcam' && '🔵 Grad-CAM: Class Activation Mapping (fast, recommended)'}
              {selectedMethods === 'lime' && '🟢 LIME: Superpixel-based local explanations (slower)'}
              {selectedMethods === 'shap' && '🟣 SHAP: Shapley value attributions (slower)'}
              {selectedMethods === 'ig' && '🟠 Integrated Gradients: Path-based attributions (moderate)'}
              {selectedMethods === 'all' && '🌈 All Methods: Complete comparison (slowest, most comprehensive)'}
            </p>
          </div>
          
          <ImageUpload onUpload={handleImageUpload} isUploading={isProcessing} />
          
          {isProcessing && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
              <p className="text-center text-lg font-semibold text-blue-900 dark:text-blue-200">AI Analysis in Progress...</p>
              <p className="text-center text-sm text-blue-700 dark:text-blue-400 mt-2">
                Running YOLOv8s defect detection model
              </p>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-xl p-6 mb-8 flex items-start animate-shake shadow-xl">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mr-4 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 dark:text-red-200 text-xl mb-2">Error Occurred</h3>
              <p className="text-red-800 dark:text-red-300 text-base leading-relaxed">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Dismiss Error
              </button>
            </div>
          </div>
        )}

        {/* Detection results */}
        {detectionResult && uploadedImage && currentFileName && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 mb-8 animate-slide-up border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  Classification Results
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  YOLOv8-cls Model • Whole-image classification{detectionResult.detections.length > 0 ? ' • Defect detected' : ' • No defect detected'}
                </p>
                {(detectionResult as any)._classification_metadata && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                    <Info className="w-3 h-3 mr-1" />
                    Using classification mode: classifies entire image, not individual defect regions
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold uppercase">Detections</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{detectionResult.detections.length}</p>
                </div>
                {!settings.autoSaveAnalyses && (
                  <button
                    onClick={handleManualSave}
                    className="flex items-center space-x-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Analysis</span>
                  </button>
                )}
                <ExportButton
                  imageName={currentFileName}
                  imageUrl={uploadedImage}
                  detectionResult={detectionResult}
                  explanationResult={explanationResult || undefined}
                />
              </div>
            </div>
            <DetectionResults
              imageUrl={uploadedImage}
              detections={detectionResult.detections.map((det, idx) => {
                // Map label to defect class names
                const classNames: Record<number, string> = {
                  0: 'LP', // Lack of Penetration
                  1: 'PO', // Porosity
                  2: 'CR', // Cracks
                  3: 'ND', // No Defect
                };
                
                const fullNames: Record<number, string> = {
                  0: 'Lack of Penetration',
                  1: 'Porosity',
                  2: 'Cracks',
                  3: 'No Defect',
                };
                
                return {
                  detection_id: `det-${idx}`,
                  bbox: [det.x1, det.y1, det.x2, det.y2] as [number, number, number, number],
                  confidence: det.confidence,
                  class_name: classNames[det.label] || `Unknown-${det.label}`,
                  class_full_name: fullNames[det.label] || `Unknown-${det.label}`,
                  severity: det.severity || 'low',
                  mask_base64: null,
                  x1: det.x1,
                  y1: det.y1,
                  x2: det.x2,
                  y2: det.y2,
                  label: det.label
                };
              })}
              meanUncertainty={0.15}
            />
          </div>
        )}

        {/* XAI explanations */}
        {explanationResult && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 animate-slide-up border-2 border-purple-200 dark:border-purple-800">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Eye className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                Explainable AI (XAI) Analysis
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Visual explanations showing why the AI made its predictions
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase mb-1">Visualization Methods</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">Grad-CAM + Overlay</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {explanationResult.explanations.length} views available
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase mb-1">Consensus Score</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">{(explanationResult.consensus_score * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase mb-1">Reliability</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-200">
                  {explanationResult.consensus_score > 0.8 ? 'High' : explanationResult.consensus_score > 0.6 ? 'Medium' : 'Low'}
                </p>
              </div>
            </div>
            <XAIExplanations
              explanation={explanationResult}
              originalImage={uploadedImage || undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
