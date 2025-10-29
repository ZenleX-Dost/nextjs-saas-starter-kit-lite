'use client';

/**
 * Component to display XAI explanations with enhanced defect localization.
 * Now includes operator-friendly messaging and interactive visualization.
 */

import { ExplanationResponse } from '~/types';
import { useState } from 'react';
import DefectLocalizationView from './DefectLocalizationView';
import { 
  DefectBadge, 
  SeverityIndicator, 
  ActionRecommendation,
  DefectSummaryCard 
} from './OperatorMessaging';

interface XAIExplanationsProps {
  explanation: ExplanationResponse;
  originalImage?: string;
}

export default function XAIExplanations({
  explanation,
  originalImage,
}: XAIExplanationsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!explanation.metadata) {
    // Fallback for old-style explanations without metadata
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">XAI Explanations</h3>
          <div className="px-4 py-2 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-sm text-green-900">
              <strong>Consensus Score:</strong> {(explanation.consensus_score * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Simple heatmap display */}
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          <img
            src={`data:image/png;base64,${explanation.aggregated_heatmap}`}
            alt="Heatmap"
            className="w-full h-auto"
          />
        </div>
      </div>
    );
  }

  const { prediction, location_description, recommendation, regions } = explanation.metadata;

  return (
    <div className="space-y-6">
      {/* Header with badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Defect Analysis Results</h3>
        <DefectBadge prediction={prediction} size="lg" />
      </div>

      {/* Summary card */}
      <DefectSummaryCard
        prediction={prediction}
        locationDescription={location_description}
        numRegions={regions?.length || 0}
      />

      {/* Main visualization */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Visual Analysis</h4>
        <DefectLocalizationView
          explanation={explanation}
          originalImage={originalImage}
        />
      </div>

      {/* Action recommendation */}
      <ActionRecommendation
        prediction={prediction}
        recommendation={recommendation}
      />

      {/* Advanced details toggle */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
        >
          <span>{showAdvanced ? '▼' : '▶'}</span>
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Details</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-700">Model Confidence</p>
                <p className="text-gray-600">{(prediction.confidence * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Consensus Score</p>
                <p className="text-gray-600">{(explanation.consensus_score * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Computation Time</p>
                <p className="text-gray-600">{explanation.computation_time_ms.toFixed(1)} ms</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Analysis ID</p>
                <p className="text-gray-600 text-xs truncate">{explanation.image_id}</p>
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-700 text-sm mb-2">Full Description</p>
              <p className="text-gray-600 text-sm">{explanation.metadata.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

