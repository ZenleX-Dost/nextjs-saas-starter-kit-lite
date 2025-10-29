'use client';

/**
 * DefectLocalizationView - Enhanced visualization component for defect localization
 * 
 * Features:
 * - Interactive heatmap overlay with zoom/pan
 * - Defect region highlighting
 * - Confidence bars for all classes
 * - Severity indicators
 * - Location descriptions
 * - Actionable recommendations
 */

import { ExplanationResponse, DefectRegion } from '~/types';
import { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  MapPin,
  Activity
} from 'lucide-react';

interface DefectLocalizationViewProps {
  explanation: ExplanationResponse;
  originalImage?: string; // Base64 encoded original image
  onRegionClick?: (region: DefectRegion) => void;
}

export default function DefectLocalizationView({
  explanation,
  originalImage,
  onRegionClick,
}: DefectLocalizationViewProps) {
  const [xaiMethod, setXaiMethod] = useState<'gradcam' | 'overlay' | 'original'>('overlay');
  const [zoom, setZoom] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const metadata = explanation.metadata;
  if (!metadata) return null;

  const { prediction, probabilities, regions, location_description, description, recommendation } = metadata;

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'HIGH':
        return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'MEDIUM':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'LOW':
        return 'bg-blue-100 border-blue-500 text-blue-900';
      case 'ACCEPTABLE':
        return 'bg-green-100 border-green-500 text-green-900';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-900';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5" />;
      case 'ACCEPTABLE':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  // Draw regions on canvas overlay
  useEffect(() => {
    if (!canvasRef.current || !regions || regions.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each region
    regions.forEach((region, idx) => {
      const isSelected = selectedRegion === idx;
      const isHovered = hoveredRegion === idx;
      
      // Draw bounding box
      ctx.strokeStyle = isSelected ? '#ef4444' : isHovered ? '#f59e0b' : '#3b82f6';
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1.5;
      ctx.strokeRect(region.x, region.y, region.width, region.height);

      // Draw label background
      const label = `Region ${idx + 1}`;
      ctx.font = '12px sans-serif';
      const textWidth = ctx.measureText(label).width;
      
      ctx.fillStyle = isSelected ? '#ef4444' : isHovered ? '#f59e0b' : '#3b82f6';
      ctx.fillRect(region.x, region.y - 20, textWidth + 8, 18);
      
      // Draw label text
      ctx.fillStyle = 'white';
      ctx.fillText(label, region.x + 4, region.y - 6);

      // Draw coverage indicator
      const coverageText = region.coverage && !isNaN(region.coverage) 
        ? `${(region.coverage * 100).toFixed(1)}%` 
        : 'N/A';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(region.x, region.y + region.height + 2, textWidth + 8, 16);
      ctx.fillStyle = 'white';
      ctx.font = '10px sans-serif';
      ctx.fillText(coverageText, region.x + 4, region.y + region.height + 14);
    });
  }, [regions, selectedRegion, hoveredRegion]);

  // Handle region click on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !regions) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Find clicked region
    const clickedRegionIdx = regions.findIndex(region =>
      x >= region.x &&
      x <= region.x + region.width &&
      y >= region.y &&
      y <= region.y + region.height
    );

    if (clickedRegionIdx !== -1) {
      setSelectedRegion(clickedRegionIdx);
      const clickedRegion = regions[clickedRegionIdx];
      if (onRegionClick && clickedRegion) {
        onRegionClick(clickedRegion);
      }
    } else {
      setSelectedRegion(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with defect classification */}
      <div className={`flex items-center justify-between p-4 border-2 rounded-lg ${getSeverityColor(prediction.severity)}`}>
        <div className="flex items-center space-x-3">
          {getSeverityIcon(prediction.severity)}
          <div>
            <h3 className="text-lg font-bold">{prediction.predicted_class_full_name}</h3>
            <p className="text-sm opacity-75">{prediction.predicted_class_name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{(prediction.confidence * 100).toFixed(1)}%</p>
          <p className="text-xs opacity-75">Confidence</p>
        </div>
      </div>

      {/* Location description */}
      {location_description && (
        <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900">Defect Location</p>
            <p className="text-sm text-blue-800">{location_description}</p>
          </div>
        </div>
      )}

      {/* Visualization Controls */}
      <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 mr-2">XAI Method:</span>
            <button
              onClick={() => setXaiMethod('gradcam')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                xaiMethod === 'gradcam'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Show Grad-CAM heatmap highlighting defect regions"
            >
              Grad-CAM
            </button>
            <button
              onClick={() => setXaiMethod('overlay')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                xaiMethod === 'overlay'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Show heatmap overlaid on original image"
            >
              Overlay
            </button>
            <button
              onClick={() => setXaiMethod('original')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                xaiMethod === 'original'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Show original radiographic image"
            >
              Original
            </button>
            <span className="text-sm text-gray-600 ml-4">|</span>
            <span className="text-sm text-gray-700">Zoom: {(zoom * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Reset Zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Method description */}
        <div className="text-xs text-gray-600">
          {xaiMethod === 'gradcam' && ' Heat intensity shows where the model focuses to detect defects'}
          {xaiMethod === 'overlay' && ' Heatmap overlaid on original image for precise defect localization'}
          {xaiMethod === 'original' && ' Original radiographic weld image without visualization'}
        </div>
      </div>

      {/* Main visualization area */}
      <div
        ref={containerRef}
        className="relative border-2 border-gray-300 rounded-lg overflow-auto bg-gray-100"
        style={{ maxHeight: '600px' }}
      >
        <div
          className="relative inline-block"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease-out',
          }}
        >
          {/* Base image (selected XAI method) */}
          <img
            src={
              xaiMethod === 'overlay' && explanation.explanations[1]
                ? `data:image/png;base64,${explanation.explanations[1].heatmap_base64}`
                : xaiMethod === 'gradcam' && explanation.explanations[0]
                ? `data:image/png;base64,${explanation.explanations[0].heatmap_base64}`
                : originalImage || `data:image/png;base64,${explanation.explanations[0]?.heatmap_base64}`
            }
            alt="Defect visualization"
            className="block max-w-none"
            onLoad={(e) => {
              // Set canvas size to match image
              if (canvasRef.current) {
                const img = e.target as HTMLImageElement;
                canvasRef.current.width = img.naturalWidth;
                canvasRef.current.height = img.naturalHeight;
              }
            }}
          />

          {/* Interactive canvas overlay for regions */}
          {regions && regions.length > 0 && (
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 cursor-crosshair"
              onClick={handleCanvasClick}
              onMouseMove={(e) => {
                if (!canvasRef.current || !regions) return;
                const canvas = canvasRef.current;
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                const y = (e.clientY - rect.top) * (canvas.height / rect.height);

                const hoveredIdx = regions.findIndex(region =>
                  x >= region.x &&
                  x <= region.x + region.width &&
                  y >= region.y &&
                  y <= region.y + region.height
                );

                setHoveredRegion(hoveredIdx !== -1 ? hoveredIdx : null);
              }}
              onMouseLeave={() => setHoveredRegion(null)}
            />
          )}
        </div>
      </div>

      {/* Detected regions info */}
      {regions && regions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-700" />
            <h4 className="font-semibold text-gray-900">Detected Regions ({regions.length})</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {regions.map((region, idx) => (
              <div
                key={idx}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedRegion === idx
                    ? 'border-red-500 bg-red-50'
                    : hoveredRegion === idx
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-300 bg-white hover:border-blue-400'
                }`}
                onClick={() => {
                  setSelectedRegion(idx);
                  if (onRegionClick) onRegionClick(region);
                }}
                onMouseEnter={() => setHoveredRegion(idx)}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <p className="text-sm font-semibold text-gray-900">Region {idx + 1}</p>
                <div className="mt-2 space-y-1 text-xs text-gray-700">
                  <p>Coverage: <span className="font-medium">{region.coverage && !isNaN(region.coverage) ? (region.coverage * 100).toFixed(1) : 'N/A'}%</span></p>
                  <p>Intensity: <span className="font-medium">{region.intensity && !isNaN(region.intensity) ? (region.intensity * 100).toFixed(1) : 'N/A'}%</span></p>
                  <p className="text-gray-500">
                    Position: ({region.x || 0}, {region.y || 0})
                  </p>
                  <p className="text-gray-500">
                    Size: {region.width || 0} × {region.height || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Class probabilities */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Class Probabilities</h4>
        <div className="space-y-2">
          {Array.isArray(probabilities) ? (
            probabilities.map((probInfo: any) => (
              <div key={probInfo.class_code}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">
                    {probInfo.class_name} ({probInfo.class_code})
                  </span>
                  <span className="text-gray-600">
                    {probInfo.probability && !isNaN(probInfo.probability) 
                      ? (probInfo.probability * 100).toFixed(2) 
                      : 'N/A'}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      probInfo.class_code === prediction.predicted_class_name
                        ? 'bg-blue-600'
                        : 'bg-gray-400'
                    }`}
                    style={{ 
                      width: `${probInfo.probability && !isNaN(probInfo.probability) 
                        ? probInfo.probability * 100 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            Object.entries(probabilities).map(([className, probability]) => (
              <div key={className}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{className}</span>
                  <span className="text-gray-600">
                    {probability && !isNaN(probability as number) 
                      ? ((probability as number) * 100).toFixed(2) 
                      : 'N/A'}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      className === prediction.predicted_class_name
                        ? 'bg-blue-600'
                        : 'bg-gray-400'
                    }`}
                    style={{ 
                      width: `${probability && !isNaN(probability as number) 
                        ? (probability as number) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Description and Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Description */}
        {description && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-purple-900 mb-2">Analysis</p>
                <p className="text-sm text-purple-800">{description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendation */}
        {recommendation && (
          <div className={`p-4 border rounded-lg ${
            prediction.severity === 'CRITICAL' || prediction.severity === 'HIGH'
              ? 'bg-red-50 border-red-200'
              : prediction.severity === 'ACCEPTABLE'
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start space-x-2">
              <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                prediction.severity === 'CRITICAL' || prediction.severity === 'HIGH'
                  ? 'text-red-600'
                  : prediction.severity === 'ACCEPTABLE'
                  ? 'text-green-600'
                  : 'text-yellow-600'
              }`} />
              <div>
                <p className={`font-semibold mb-2 ${
                  prediction.severity === 'CRITICAL' || prediction.severity === 'HIGH'
                    ? 'text-red-900'
                    : prediction.severity === 'ACCEPTABLE'
                    ? 'text-green-900'
                    : 'text-yellow-900'
                }`}>Recommendation</p>
                <p className={`text-sm ${
                  prediction.severity === 'CRITICAL' || prediction.severity === 'HIGH'
                    ? 'text-red-800'
                    : prediction.severity === 'ACCEPTABLE'
                    ? 'text-green-800'
                    : 'text-yellow-800'
                }`}>{recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Method info */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div>
            <span className="font-semibold">Method:</span> Grad-CAM
          </div>
          <div>
            <span className="font-semibold">Computation Time:</span> {explanation.computation_time_ms.toFixed(1)}ms
          </div>
          <div>
            <span className="font-semibold">Consensus Score:</span> {(explanation.consensus_score * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
