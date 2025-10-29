'use client';

/**
 * OperatorMessaging - Operator-friendly communication components
 * 
 * Provides clear, actionable messages for operators including:
 * - Defect type badges
 * - Severity indicators
 * - Tooltips with explanations
 * - Action buttons
 */

import { PredictionInfo } from '@/types';
import { AlertTriangle, CheckCircle, Info, XCircle, AlertCircle } from 'lucide-react';

interface DefectBadgeProps {
  prediction: PredictionInfo;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function DefectBadge({ prediction, size = 'md', showTooltip = true }: DefectBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const severityColors = {
    CRITICAL: 'bg-red-600 text-white border-red-700',
    HIGH: 'bg-orange-600 text-white border-orange-700',
    MEDIUM: 'bg-yellow-500 text-gray-900 border-yellow-600',
    LOW: 'bg-blue-500 text-white border-blue-600',
    ACCEPTABLE: 'bg-green-600 text-white border-green-700',
  };

  const tooltipText = getDefectDescription(prediction.predicted_class_name);

  return (
    <div className="relative inline-block group">
      <span
        className={`inline-flex items-center font-bold border-2 rounded-lg ${
          severityColors[prediction.severity]
        } ${sizeClasses[size]}`}
      >
        {getSeverityIcon(prediction.severity, size)}
        <span className="ml-1.5">{prediction.predicted_class_name}</span>
      </span>
      
      {showTooltip && tooltipText && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-64">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
            <p className="font-semibold mb-1">{prediction.predicted_class_full_name}</p>
            <p>{tooltipText}</p>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SeverityIndicatorProps {
  severity: PredictionInfo['severity'];
  confidence: number;
  showLabel?: boolean;
}

export function SeverityIndicator({ severity, confidence, showLabel = true }: SeverityIndicatorProps) {
  const severityLevels = {
    CRITICAL: { color: 'red', level: 5, text: 'Critical' },
    HIGH: { color: 'orange', level: 4, text: 'High' },
    MEDIUM: { color: 'yellow', level: 3, text: 'Medium' },
    LOW: { color: 'blue', level: 2, text: 'Low' },
    ACCEPTABLE: { color: 'green', level: 1, text: 'Acceptable' },
  };

  const info = severityLevels[severity];

  return (
    <div className="flex items-center space-x-3">
      {/* Visual bars */}
      <div className="flex items-end space-x-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`w-2 rounded-t transition-all ${
              level <= info.level
                ? `bg-${info.color}-600`
                : 'bg-gray-200'
            }`}
            style={{
              height: `${level * 6}px`,
              backgroundColor: level <= info.level
                ? info.color === 'red' ? '#dc2626'
                  : info.color === 'orange' ? '#ea580c'
                  : info.color === 'yellow' ? '#eab308'
                  : info.color === 'blue' ? '#2563eb'
                  : '#16a34a'
                : '#e5e7eb',
            }}
          />
        ))}
      </div>
      
      {showLabel && (
        <div>
          <p className="text-sm font-semibold text-gray-900">{info.text} Risk</p>
          <p className="text-xs text-gray-600">{(confidence * 100).toFixed(1)}% confidence</p>
        </div>
      )}
    </div>
  );
}

interface ActionRecommendationProps {
  prediction: PredictionInfo;
  recommendation: string;
  onAccept?: () => void;
  onReject?: () => void;
}

export function ActionRecommendation({ 
  prediction, 
  recommendation,
  onAccept,
  onReject 
}: ActionRecommendationProps) {
  const actionTypes = {
    CRITICAL: {
      icon: XCircle,
      color: 'red',
      action: 'Reject Weld',
      bgClass: 'bg-red-50 border-red-300',
      textClass: 'text-red-900',
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    HIGH: {
      icon: AlertTriangle,
      color: 'orange',
      action: 'Review Required',
      bgClass: 'bg-orange-50 border-orange-300',
      textClass: 'text-orange-900',
      buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
    MEDIUM: {
      icon: AlertCircle,
      color: 'yellow',
      action: 'Assess & Document',
      bgClass: 'bg-yellow-50 border-yellow-300',
      textClass: 'text-yellow-900',
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    LOW: {
      icon: Info,
      color: 'blue',
      action: 'Monitor',
      bgClass: 'bg-blue-50 border-blue-300',
      textClass: 'text-blue-900',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    ACCEPTABLE: {
      icon: CheckCircle,
      color: 'green',
      action: 'Accept Weld',
      bgClass: 'bg-green-50 border-green-300',
      textClass: 'text-green-900',
      buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
    },
  };

  const actionInfo = actionTypes[prediction.severity];
  const Icon = actionInfo.icon;

  return (
    <div className={`p-5 border-2 rounded-lg ${actionInfo.bgClass}`}>
      <div className="flex items-start space-x-3 mb-4">
        <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 text-${actionInfo.color}-600`} 
              style={{ color: actionInfo.color === 'red' ? '#dc2626'
                : actionInfo.color === 'orange' ? '#ea580c'
                : actionInfo.color === 'yellow' ? '#ca8a04'
                : actionInfo.color === 'blue' ? '#2563eb'
                : '#16a34a' }} />
        <div className="flex-1">
          <h4 className={`font-bold text-lg mb-2 ${actionInfo.textClass}`}>
            {actionInfo.action}
          </h4>
          <p className={`text-sm ${actionInfo.textClass}`}>{recommendation}</p>
        </div>
      </div>

      {(onAccept || onReject) && (
        <div className="flex items-center space-x-3 mt-4">
          {onAccept && (
            <button
              onClick={onAccept}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${actionInfo.buttonClass}`}
            >
              {actionInfo.action}
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Override
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface DefectSummaryCardProps {
  prediction: PredictionInfo;
  locationDescription: string;
  numRegions: number;
}

export function DefectSummaryCard({ 
  prediction, 
  locationDescription,
  numRegions 
}: DefectSummaryCardProps) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg overflow-hidden">
      {/* Header with severity color */}
      <div 
        className="p-4 text-white font-bold text-lg"
        style={{ 
          backgroundColor: prediction.severity === 'CRITICAL' ? '#dc2626'
            : prediction.severity === 'HIGH' ? '#ea580c'
            : prediction.severity === 'MEDIUM' ? '#eab308'
            : prediction.severity === 'LOW' ? '#2563eb'
            : '#16a34a'
        }}
      >
        <div className="flex items-center justify-between">
          <span>{prediction.predicted_class_full_name}</span>
          {getSeverityIcon(prediction.severity, 'lg')}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Confidence meter */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700">Confidence</span>
            <span className="text-gray-900 font-bold">{(prediction.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
              style={{ width: `${prediction.confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Severity indicator */}
        <div className="flex items-center justify-between py-3 border-t border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Severity Level</span>
          <SeverityIndicator severity={prediction.severity} confidence={prediction.confidence} showLabel={false} />
        </div>

        {/* Location */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-700">Location</p>
          <p className="text-sm text-gray-600">{locationDescription}</p>
        </div>

        {/* Regions */}
        {numRegions > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-700">Detected Regions</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded-full font-bold">
              {numRegions}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getSeverityIcon(severity: string, size: 'sm' | 'md' | 'lg' = 'md') {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  
  switch (severity) {
    case 'CRITICAL':
      return <XCircle className={sizeClass} />;
    case 'HIGH':
      return <AlertTriangle className={sizeClass} />;
    case 'MEDIUM':
      return <AlertCircle className={sizeClass} />;
    case 'LOW':
      return <Info className={sizeClass} />;
    case 'ACCEPTABLE':
      return <CheckCircle className={sizeClass} />;
    default:
      return <Info className={sizeClass} />;
  }
}

function getDefectDescription(defectType: string): string {
  const descriptions: Record<string, string> = {
    'LP': 'Incomplete fusion at the weld root caused by insufficient penetration. This is a critical defect that compromises weld integrity and requires immediate repair.',
    'PO': 'Gas pockets trapped in the weld metal during solidification. Assess the size and density to determine acceptability per welding standards.',
    'CR': 'Linear discontinuities in the weld material. Cracks are critical defects that can propagate under stress and require immediate rejection and repair.',
    'ND': 'No significant defects detected. The weld meets quality standards and can be accepted.',
  };
  return descriptions[defectType] || 'Defect detected in radiographic inspection.';
}

// Export all components
export default {
  DefectBadge,
  SeverityIndicator,
  ActionRecommendation,
  DefectSummaryCard,
};
